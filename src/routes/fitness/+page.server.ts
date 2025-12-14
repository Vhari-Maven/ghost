import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { fitnessEntries } from '$lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

function getDateRange(): { start: string; end: string; dates: string[] } {
  const today = new Date();
  const dates: string[] = [];

  // 5 days before and 5 days after today
  for (let i = -5; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return {
    start: dates[0],
    end: dates[dates.length - 1],
    dates
  };
}

// Calculate current streak for a habit field
function calculateStreak(entries: Array<{ date: string; [key: string]: any }>, field: string, today: string): number {
  // Sort entries by date descending (most recent first)
  const sorted = [...entries]
    .filter(e => e.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  let expectedDate = new Date(today + 'T00:00:00');

  for (const entry of sorted) {
    const entryDate = new Date(entry.date + 'T00:00:00');
    const diffDays = Math.round((expectedDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

    // If there's a gap, streak is broken
    if (diffDays > 1) break;

    // If this entry has the habit checked, increment streak
    if (entry[field]) {
      streak++;
      expectedDate = entryDate;
    } else if (diffDays === 0) {
      // Today doesn't have it checked yet, that's ok - check yesterday
      expectedDate = new Date(expectedDate);
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      // Past day not checked = streak broken
      break;
    }
  }

  return streak;
}

export const load: PageServerLoad = async () => {
  const { start, end, dates } = getDateRange();
  const today = new Date().toISOString().split('T')[0];

  // Fetch existing entries in date range
  const entries = await db
    .select()
    .from(fitnessEntries)
    .where(and(gte(fitnessEntries.date, start), lte(fitnessEntries.date, end)));

  // Also fetch more history for streak calculation (last 60 days)
  const streakStart = new Date();
  streakStart.setDate(streakStart.getDate() - 60);
  const allEntries = await db
    .select()
    .from(fitnessEntries)
    .where(gte(fitnessEntries.date, streakStart.toISOString().split('T')[0]));

  // Create a map for quick lookup
  const entryMap = new Map(entries.map((e) => [e.date, e]));

  // Calculate streaks for habit fields
  const habitFields = ['breakfast', 'brush', 'floss', 'shower', 'shake'];
  const streaks: Record<string, number> = {};
  for (const field of habitFields) {
    streaks[field] = calculateStreak(allEntries, field, today);
  }

  // Get yesterday's data for the "copy" feature
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdayEntry = entryMap.get(yesterdayStr);

  // Build the full date range with entries (or empty placeholders)
  const rows = dates.map((date) => {
    const existing = entryMap.get(date);
    const isPast = date <= today;

    return {
      date,
      isToday: date === today,
      isPast,
      isFuture: date > today,
      entry: existing || null
    };
  });

  return {
    rows,
    today,
    streaks,
    yesterdayWalk: yesterdayEntry ? {
      walkDistance: yesterdayEntry.walkDistance,
      walkIncline: yesterdayEntry.walkIncline
    } : null
  };
};

export const actions: Actions = {
  updateField: async ({ request }) => {
    const formData = await request.formData();
    const date = formData.get('date') as string;
    const field = formData.get('field') as string;
    const value = formData.get('value') as string;

    const today = new Date().toISOString().split('T')[0];

    // Don't allow updates to future dates
    if (date > today) {
      return { success: false, error: 'Cannot update future dates' };
    }

    // Check if entry exists
    const existing = await db
      .select()
      .from(fitnessEntries)
      .where(eq(fitnessEntries.date, date))
      .get();

    // Prepare the update value
    let updateValue: number | boolean | null;

    if (['breakfast', 'brush', 'floss', 'shower', 'shake'].includes(field)) {
      updateValue = value === 'true';
    } else {
      updateValue = value === '' ? null : parseFloat(value);
    }

    const updateData = {
      [field]: updateValue,
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      await db
        .update(fitnessEntries)
        .set(updateData)
        .where(eq(fitnessEntries.date, date));
    } else {
      await db.insert(fitnessEntries).values({
        date,
        ...updateData
      });
    }

    return { success: true };
  },

  copyYesterdayWalk: async ({ request }) => {
    const formData = await request.formData();
    const date = formData.get('date') as string;
    const walkDistance = formData.get('walkDistance');
    const walkIncline = formData.get('walkIncline');

    const today = new Date().toISOString().split('T')[0];

    if (date > today) {
      return { success: false, error: 'Cannot update future dates' };
    }

    const existing = await db
      .select()
      .from(fitnessEntries)
      .where(eq(fitnessEntries.date, date))
      .get();

    const updateData = {
      walkDistance: walkDistance ? parseFloat(walkDistance as string) : null,
      walkIncline: walkIncline ? parseFloat(walkIncline as string) : null,
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      await db
        .update(fitnessEntries)
        .set(updateData)
        .where(eq(fitnessEntries.date, date));
    } else {
      await db.insert(fitnessEntries).values({
        date,
        ...updateData
      });
    }

    return { success: true };
  }
};
