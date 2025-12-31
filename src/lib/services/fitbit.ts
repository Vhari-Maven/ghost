import { db } from '$lib/db';
import { oauthTokens, fitbitDailyData } from '$lib/db/schema';
import type { FitbitDailyData, NewFitbitDailyData } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

// ============================================
// Constants
// ============================================

const FITBIT_API_BASE = 'https://api.fitbit.com';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';

// ============================================
// Types
// ============================================

export interface FitbitTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string | null;
  scope: string | null;
}

interface FitbitTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
  scope: string;
  token_type: string;
}

interface FitbitHeartRateZone {
  name: string;
  min: number;
  max: number;
  minutes: number;
  caloriesOut: number;
}

interface FitbitHeartRateResponse {
  'activities-heart': Array<{
    dateTime: string;
    value: {
      restingHeartRate?: number;
      heartRateZones: FitbitHeartRateZone[];
    };
  }>;
}

interface FitbitSleepResponse {
  sleep: Array<{
    dateOfSleep: string;
    duration: number; // milliseconds
    efficiency: number;
    isMainSleep: boolean;
    levels?: {
      summary: {
        deep?: { minutes: number };
        light?: { minutes: number };
        rem?: { minutes: number };
        wake?: { minutes: number };
      };
    };
  }>;
  summary: {
    totalMinutesAsleep: number;
    totalTimeInBed: number;
  };
}

interface FitbitActivityResponse {
  summary: {
    caloriesOut: number;
    activityCalories: number;
    caloriesBMR: number;
  };
}

export interface SyncResult {
  date: string;
  success: boolean;
  error?: string;
  data?: Partial<NewFitbitDailyData>;
}

// ============================================
// Token Management
// ============================================

/**
 * Check if Fitbit is connected (has valid tokens)
 */
export async function isFitbitConnected(): Promise<boolean> {
  const token = await db
    .select()
    .from(oauthTokens)
    .where(eq(oauthTokens.provider, 'fitbit'))
    .get();

  return token !== undefined;
}

/**
 * Get Fitbit token data (without refreshing)
 */
export async function getFitbitTokenData(): Promise<FitbitTokenData | null> {
  const token = await db
    .select()
    .from(oauthTokens)
    .where(eq(oauthTokens.provider, 'fitbit'))
    .get();

  if (!token) return null;

  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt: token.expiresAt,
    userId: token.userId,
    scope: token.scope
  };
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getFitbitAccessToken(): Promise<string | null> {
  const tokenData = await getFitbitTokenData();
  if (!tokenData) return null;

  // Check if token is expired (with 5 minute buffer)
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000;

  if (tokenData.expiresAt - bufferMs <= now) {
    console.log('[Fitbit] Token expired, refreshing...');
    const refreshed = await refreshFitbitToken(tokenData.refreshToken);
    if (!refreshed) {
      console.error('[Fitbit] Failed to refresh token');
      return null;
    }
    return refreshed.accessToken;
  }

  return tokenData.accessToken;
}

/**
 * Refresh the Fitbit access token
 */
async function refreshFitbitToken(refreshToken: string): Promise<FitbitTokenData | null> {
  try {
    const credentials = Buffer.from(`${env.FITBIT_CLIENT_ID}:${env.FITBIT_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(FITBIT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Fitbit] Token refresh failed:', response.status, errorText);
      return null;
    }

    const data: FitbitTokenResponse = await response.json();
    const expiresAt = Date.now() + (data.expires_in * 1000);

    // Update token in database
    await db
      .update(oauthTokens)
      .set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        updatedAt: new Date().toISOString()
      })
      .where(eq(oauthTokens.provider, 'fitbit'));

    console.log('[Fitbit] Token refreshed successfully');

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      userId: data.user_id,
      scope: data.scope
    };
  } catch (error) {
    console.error('[Fitbit] Token refresh error:', error);
    return null;
  }
}

/**
 * Store new Fitbit tokens after OAuth callback
 */
export async function storeFitbitToken(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  userId: string,
  scope: string
): Promise<void> {
  const expiresAt = Date.now() + (expiresIn * 1000);
  const now = new Date().toISOString();

  // Check if we already have a token
  const existing = await db
    .select()
    .from(oauthTokens)
    .where(eq(oauthTokens.provider, 'fitbit'))
    .get();

  if (existing) {
    await db
      .update(oauthTokens)
      .set({
        accessToken,
        refreshToken,
        expiresAt,
        userId,
        scope,
        updatedAt: now
      })
      .where(eq(oauthTokens.provider, 'fitbit'));
  } else {
    await db.insert(oauthTokens).values({
      provider: 'fitbit',
      accessToken,
      refreshToken,
      expiresAt,
      userId,
      scope,
      createdAt: now,
      updatedAt: now
    });
  }

  console.log('[Fitbit] Token stored successfully');
}

/**
 * Delete Fitbit tokens (disconnect)
 */
export async function deleteFitbitToken(): Promise<void> {
  await db
    .delete(oauthTokens)
    .where(eq(oauthTokens.provider, 'fitbit'));

  console.log('[Fitbit] Token deleted (disconnected)');
}

// ============================================
// API Calls
// ============================================

/**
 * Fetch heart rate data for a specific date
 */
export async function fetchHeartRate(date: string): Promise<{
  zones: { outOfRange: number; fatBurn: number; cardio: number; peak: number };
  restingHeartRate: number | null;
} | null> {
  const token = await getFitbitAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(
      `${FITBIT_API_BASE}/1/user/-/activities/heart/date/${date}/1d.json`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      console.error('[Fitbit] Heart rate fetch failed:', response.status);
      return null;
    }

    const data: FitbitHeartRateResponse = await response.json();
    const heartData = data['activities-heart']?.[0]?.value;

    if (!heartData) return null;

    // Extract zone minutes
    const zoneMap: Record<string, number> = {};
    for (const zone of heartData.heartRateZones) {
      zoneMap[zone.name.toLowerCase().replace(/\s+/g, '')] = zone.minutes;
    }

    return {
      zones: {
        outOfRange: zoneMap['outofrange'] || 0,
        fatBurn: zoneMap['fatburn'] || 0,
        cardio: zoneMap['cardio'] || 0,
        peak: zoneMap['peak'] || 0
      },
      restingHeartRate: heartData.restingHeartRate || null
    };
  } catch (error) {
    console.error('[Fitbit] Heart rate fetch error:', error);
    return null;
  }
}

/**
 * Fetch sleep data for a specific date
 */
export async function fetchSleep(date: string): Promise<{
  duration: number; // minutes
  efficiency: number; // percentage
  deep: number;
  light: number;
  rem: number;
  awake: number;
} | null> {
  const token = await getFitbitAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(
      `${FITBIT_API_BASE}/1.2/user/-/sleep/date/${date}.json`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      console.error('[Fitbit] Sleep fetch failed:', response.status);
      return null;
    }

    const data: FitbitSleepResponse = await response.json();

    // Find the main sleep record
    const mainSleep = data.sleep?.find(s => s.isMainSleep);
    if (!mainSleep) {
      // No sleep data for this date
      return null;
    }

    const stages = mainSleep.levels?.summary;

    return {
      duration: Math.round(mainSleep.duration / 60000), // Convert ms to minutes
      efficiency: mainSleep.efficiency,
      deep: stages?.deep?.minutes || 0,
      light: stages?.light?.minutes || 0,
      rem: stages?.rem?.minutes || 0,
      awake: stages?.wake?.minutes || 0
    };
  } catch (error) {
    console.error('[Fitbit] Sleep fetch error:', error);
    return null;
  }
}

/**
 * Fetch calories burned for a specific date
 */
export async function fetchCalories(date: string): Promise<number | null> {
  const token = await getFitbitAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(
      `${FITBIT_API_BASE}/1/user/-/activities/date/${date}.json`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      console.error('[Fitbit] Calories fetch failed:', response.status);
      return null;
    }

    const data: FitbitActivityResponse = await response.json();
    return data.summary?.caloriesOut || null;
  } catch (error) {
    console.error('[Fitbit] Calories fetch error:', error);
    return null;
  }
}

// ============================================
// Sync Operations
// ============================================

/**
 * Sync all Fitbit data for a specific date
 */
export async function syncFitbitDate(date: string): Promise<SyncResult> {
  console.log(`[Fitbit] Syncing data for ${date}...`);

  try {
    // Fetch all data types in parallel
    const [heartRate, sleep, calories] = await Promise.all([
      fetchHeartRate(date),
      fetchSleep(date),
      fetchCalories(date)
    ]);

    // Build the data object
    const dataToStore: NewFitbitDailyData = {
      date,
      zoneOutOfRange: heartRate?.zones.outOfRange ?? null,
      zoneFatBurn: heartRate?.zones.fatBurn ?? null,
      zoneCardio: heartRate?.zones.cardio ?? null,
      zonePeak: heartRate?.zones.peak ?? null,
      restingHeartRate: heartRate?.restingHeartRate ?? null,
      sleepDuration: sleep?.duration ?? null,
      sleepEfficiency: sleep?.efficiency ?? null,
      sleepDeep: sleep?.deep ?? null,
      sleepLight: sleep?.light ?? null,
      sleepRem: sleep?.rem ?? null,
      sleepAwake: sleep?.awake ?? null,
      caloriesBurned: calories ?? null,
      syncedAt: new Date().toISOString()
    };

    // Upsert into database
    const existing = await db
      .select()
      .from(fitbitDailyData)
      .where(eq(fitbitDailyData.date, date))
      .get();

    if (existing) {
      await db
        .update(fitbitDailyData)
        .set(dataToStore)
        .where(eq(fitbitDailyData.date, date));
    } else {
      await db.insert(fitbitDailyData).values(dataToStore);
    }

    console.log(`[Fitbit] Synced ${date}: HR zones=${heartRate ? 'yes' : 'no'}, sleep=${sleep ? 'yes' : 'no'}, calories=${calories ?? 'no'}`);

    return {
      date,
      success: true,
      data: dataToStore
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Fitbit] Sync failed for ${date}:`, errorMessage);
    return {
      date,
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Sync today's Fitbit data
 */
export async function syncFitbitToday(): Promise<SyncResult> {
  const today = getLocalDateString(new Date());
  return syncFitbitDate(today);
}

/**
 * Sync a range of dates (for backfill)
 */
export async function syncFitbitDateRange(
  startDate: string,
  endDate: string
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  console.log(`[Fitbit] Syncing date range: ${startDate} to ${endDate}`);

  const current = new Date(start);
  while (current <= end) {
    const dateStr = getLocalDateString(current);
    const result = await syncFitbitDate(dateStr);
    results.push(result);

    // Rate limiting: Fitbit allows 150 requests/hour
    // Each date makes 3 API calls, so ~50 dates/hour max
    // Add a small delay to be safe
    await new Promise(r => setTimeout(r, 200));

    current.setDate(current.getDate() + 1);
  }

  const successful = results.filter(r => r.success).length;
  console.log(`[Fitbit] Range sync complete: ${successful}/${results.length} days synced`);

  return results;
}

/**
 * Get the last sync timestamp
 */
export async function getLastSyncTime(): Promise<string | null> {
  const latest = await db
    .select({ syncedAt: fitbitDailyData.syncedAt })
    .from(fitbitDailyData)
    .orderBy(fitbitDailyData.syncedAt)
    .limit(1)
    .get();

  return latest?.syncedAt || null;
}

/**
 * Get Fitbit data for a specific date
 */
export async function getFitbitDataForDate(date: string): Promise<FitbitDailyData | null> {
  return db
    .select()
    .from(fitbitDailyData)
    .where(eq(fitbitDailyData.date, date))
    .get() || null;
}

// ============================================
// Utility Functions
// ============================================

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
