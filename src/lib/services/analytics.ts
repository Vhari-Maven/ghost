import { db } from '$lib/db';
import { exerciseSessions, exerciseLogs, fitnessEntries } from '$lib/db/schema';
import type { WorkoutType } from '$lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { EXERCISES } from '$lib/data/exercises';
import { getLocalDateString } from './exercise';

// ============================================
// Types
// ============================================

export interface ExerciseProgressPoint {
  date: string;
  exerciseId: string;
  maxWeight: number | null;
  maxReps: number | null;
  totalVolume: number; // weight × reps summed across sets
  totalSets: number;
}

export interface ExerciseProgressSeries {
  exerciseId: string;
  exerciseName: string;
  category: string;
  dataPoints: ExerciseProgressPoint[];
  trend: 'improving' | 'maintaining' | 'declining' | 'insufficient_data';
  percentChange: number | null;
}

export interface WorkoutConsistencyDay {
  date: string;
  workoutType: WorkoutType | null;
  completed: boolean;
  exerciseCount: number;
  totalSets: number;
}

export interface MonthlySummary {
  month: string; // "2025-01"
  totalWorkouts: number;
  completedWorkouts: number;
  workoutsByType: Record<WorkoutType, number>;
  averageSetsPerWorkout: number;
  topExercises: Array<{
    exerciseId: string;
    exerciseName: string;
    totalVolume: number;
    sessions: number;
  }>;
}

// ============================================
// Date Utilities
// ============================================

function getDateDaysAgo(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return getLocalDateString(date);
}

function getMonthString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getMonthDateRange(monthStr: string): { start: string; end: string } {
  const [year, month] = monthStr.split('-').map(Number);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;

  // Get last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return { start, end };
}

// ============================================
// Exercise Progress
// ============================================

export async function getExerciseProgress(
  exerciseId: string,
  daysBack: number = 30
): Promise<ExerciseProgressSeries> {
  const startDate = getDateDaysAgo(daysBack);
  const exercise = EXERCISES[exerciseId];

  const logs = await db
    .select({
      date: exerciseSessions.date,
      weight: exerciseLogs.weight,
      reps: exerciseLogs.reps,
      setNumber: exerciseLogs.setNumber,
      completed: exerciseLogs.completed
    })
    .from(exerciseLogs)
    .innerJoin(exerciseSessions, eq(exerciseLogs.sessionId, exerciseSessions.id))
    .where(and(
      eq(exerciseLogs.exerciseId, exerciseId),
      gte(exerciseSessions.date, startDate)
    ))
    .orderBy(exerciseSessions.date);

  // Group by date and calculate metrics
  const byDate = new Map<string, typeof logs>();
  for (const log of logs) {
    const existing = byDate.get(log.date) || [];
    existing.push(log);
    byDate.set(log.date, existing);
  }

  const dataPoints: ExerciseProgressPoint[] = [];
  for (const [date, dayLogs] of byDate) {
    const weights = dayLogs.filter(l => l.weight != null).map(l => l.weight!);
    const reps = dayLogs.filter(l => l.reps != null).map(l => l.reps!);

    // Calculate volume: sum of (weight × reps) for each set
    let totalVolume = 0;
    for (const log of dayLogs) {
      if (log.weight != null && log.reps != null) {
        totalVolume += log.weight * log.reps;
      }
    }

    dataPoints.push({
      date,
      exerciseId,
      maxWeight: weights.length > 0 ? Math.max(...weights) : null,
      maxReps: reps.length > 0 ? Math.max(...reps) : null,
      totalVolume,
      totalSets: dayLogs.length
    });
  }

  // Sort by date ascending
  dataPoints.sort((a, b) => a.date.localeCompare(b.date));

  const { trend, percentChange } = calculateTrend(dataPoints);

  return {
    exerciseId,
    exerciseName: exercise?.name || exerciseId,
    category: exercise?.category || 'unknown',
    dataPoints,
    trend,
    percentChange
  };
}

export async function getAllExerciseProgress(
  daysBack: number = 30
): Promise<ExerciseProgressSeries[]> {
  const startDate = getDateDaysAgo(daysBack);

  // Get all unique exercise IDs that have logs in the period
  const exerciseIds = await db
    .selectDistinct({ exerciseId: exerciseLogs.exerciseId })
    .from(exerciseLogs)
    .innerJoin(exerciseSessions, eq(exerciseLogs.sessionId, exerciseSessions.id))
    .where(gte(exerciseSessions.date, startDate));

  const results: ExerciseProgressSeries[] = [];
  for (const { exerciseId } of exerciseIds) {
    const progress = await getExerciseProgress(exerciseId, daysBack);
    // Only include exercises with actual data points
    if (progress.dataPoints.length > 0) {
      results.push(progress);
    }
  }

  // Sort by exercise name
  results.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

  return results;
}

// ============================================
// Workout Consistency
// ============================================

export async function getWorkoutConsistency(
  daysBack: number = 30
): Promise<WorkoutConsistencyDay[]> {
  const startDate = getDateDaysAgo(daysBack);
  const today = getLocalDateString(new Date());

  // Get all sessions in the period
  const sessions = await db
    .select({
      date: exerciseSessions.date,
      workoutType: exerciseSessions.workoutType,
      completedAt: exerciseSessions.completedAt,
      sessionId: exerciseSessions.id
    })
    .from(exerciseSessions)
    .where(gte(exerciseSessions.date, startDate))
    .orderBy(exerciseSessions.date);

  // Get exercise counts per session
  const logCounts = await db
    .select({
      sessionId: exerciseLogs.sessionId,
      exerciseCount: sql<number>`count(distinct ${exerciseLogs.exerciseId})`,
      setCount: sql<number>`count(*)`
    })
    .from(exerciseLogs)
    .groupBy(exerciseLogs.sessionId);

  const countMap = new Map(logCounts.map(c => [c.sessionId, c]));

  // Build array for each day in the range
  const result: WorkoutConsistencyDay[] = [];
  const current = new Date(startDate + 'T00:00:00');
  const endDate = new Date(today + 'T00:00:00');

  while (current <= endDate) {
    const dateStr = getLocalDateString(current);
    const session = sessions.find(s => s.date === dateStr);

    if (session) {
      const counts = countMap.get(session.sessionId);
      result.push({
        date: dateStr,
        workoutType: session.workoutType as WorkoutType,
        completed: session.completedAt != null,
        exerciseCount: counts?.exerciseCount || 0,
        totalSets: counts?.setCount || 0
      });
    } else {
      result.push({
        date: dateStr,
        workoutType: null,
        completed: false,
        exerciseCount: 0,
        totalSets: 0
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return result;
}

// ============================================
// Period Summary
// ============================================

export async function getPeriodSummary(
  daysBack: number = 30
): Promise<MonthlySummary> {
  const startDate = getDateDaysAgo(daysBack);
  const today = getLocalDateString(new Date());

  // Get all sessions in the period
  const sessions = await db
    .select()
    .from(exerciseSessions)
    .where(and(
      gte(exerciseSessions.date, startDate),
      sql`${exerciseSessions.date} <= ${today}`
    ));

  const sessionIds = sessions.map(s => s.id);
  let totalSets = 0;
  let exerciseVolumes: Map<string, { volume: number; sessions: Set<number> }> = new Map();
  let sessionsWithLogs = new Set<number>();

  if (sessionIds.length > 0) {
    const logs = await db
      .select()
      .from(exerciseLogs)
      .where(sql`${exerciseLogs.sessionId} in ${sessionIds}`);

    totalSets = logs.length;

    // Calculate volume per exercise and track which sessions have logs
    for (const log of logs) {
      sessionsWithLogs.add(log.sessionId);
      const existing = exerciseVolumes.get(log.exerciseId) || { volume: 0, sessions: new Set() };
      if (log.weight != null && log.reps != null) {
        existing.volume += log.weight * log.reps;
      }
      existing.sessions.add(log.sessionId);
      exerciseVolumes.set(log.exerciseId, existing);
    }
  }

  // Only count sessions that have logged sets as "workouts"
  const activeSessionIds = Array.from(sessionsWithLogs);
  const activeSessions = sessions.filter(s => sessionsWithLogs.has(s.id));
  const totalWorkouts = activeSessions.length;
  const completedWorkouts = activeSessions.filter(s => s.completedAt != null).length;

  // Count by workout type (only for sessions with logs)
  const workoutsByType: Record<WorkoutType, number> = {
    upper_push: 0,
    lower: 0,
    upper_pull: 0,
    recovery: 0
  };
  for (const session of activeSessions) {
    const type = session.workoutType as WorkoutType;
    workoutsByType[type] = (workoutsByType[type] || 0) + 1;
  }

  // Get top 5 exercises by volume
  const topExercises = Array.from(exerciseVolumes.entries())
    .map(([exerciseId, data]) => {
      const exercise = EXERCISES[exerciseId];
      return {
        exerciseId,
        exerciseName: exercise?.name || exerciseId,
        totalVolume: Math.round(data.volume),
        sessions: data.sessions.size
      };
    })
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 5);

  return {
    month: `${daysBack} days`,
    totalWorkouts,
    completedWorkouts,
    workoutsByType,
    averageSetsPerWorkout: totalWorkouts > 0 ? Math.round(totalSets / totalWorkouts) : 0,
    topExercises
  };
}

// ============================================
// Trend Calculation
// ============================================

export function calculateTrend(
  dataPoints: ExerciseProgressPoint[]
): { trend: 'improving' | 'maintaining' | 'declining' | 'insufficient_data'; percentChange: number | null } {
  // Need at least 2 data points to calculate trend
  if (dataPoints.length < 2) {
    return { trend: 'insufficient_data', percentChange: null };
  }

  // Compare first third vs last third of data points (by volume)
  const third = Math.max(1, Math.floor(dataPoints.length / 3));
  const firstPoints = dataPoints.slice(0, third);
  const lastPoints = dataPoints.slice(-third);

  const avgFirst = firstPoints.reduce((sum, p) => sum + p.totalVolume, 0) / firstPoints.length;
  const avgLast = lastPoints.reduce((sum, p) => sum + p.totalVolume, 0) / lastPoints.length;

  // Handle case where there's no volume data
  if (avgFirst === 0 && avgLast === 0) {
    return { trend: 'insufficient_data', percentChange: null };
  }

  // Calculate percent change
  let percentChange: number;
  if (avgFirst === 0) {
    percentChange = 100; // Went from nothing to something
  } else {
    percentChange = Math.round(((avgLast - avgFirst) / avgFirst) * 100);
  }

  // Determine trend (5% threshold for "maintaining")
  let trend: 'improving' | 'maintaining' | 'declining';
  if (percentChange > 5) {
    trend = 'improving';
  } else if (percentChange < -5) {
    trend = 'declining';
  } else {
    trend = 'maintaining';
  }

  return { trend, percentChange };
}

// ============================================
// Morning Tracker Stats
// ============================================

export interface MorningTrackerStats {
  avgWeight: number | null;
  totalMiles: number;
  daysWithWeight: number;
  daysWithWalk: number;
}

export async function getMorningTrackerStats(
  daysBack: number = 30
): Promise<MorningTrackerStats> {
  const startDate = getDateDaysAgo(daysBack);

  const entries = await db
    .select({
      weight: fitnessEntries.weight,
      walkDistance: fitnessEntries.walkDistance
    })
    .from(fitnessEntries)
    .where(gte(fitnessEntries.date, startDate));

  const weights = entries.filter(e => e.weight != null).map(e => e.weight!);
  const walks = entries.filter(e => e.walkDistance != null).map(e => e.walkDistance!);

  const avgWeight = weights.length > 0
    ? Math.round(weights.reduce((a, b) => a + b, 0) / weights.length * 10) / 10
    : null;

  const totalMiles = walks.reduce((a, b) => a + b, 0);

  return {
    avgWeight,
    totalMiles: Math.round(totalMiles * 100) / 100,
    daysWithWeight: weights.length,
    daysWithWalk: walks.length
  };
}

// ============================================
// Walking Progress (for charts)
// ============================================

export interface MorningProgressPoint {
  date: string;
  value: number | null;
  cumulative: number;
}

export interface MorningProgressSeries {
  id: string;
  name: string;
  unit: string;
  dataPoints: MorningProgressPoint[];
  trend: 'improving' | 'maintaining' | 'declining' | 'insufficient_data';
  percentChange: number | null;
  periodTotal: number;
  periodAverage: number | null;
}

export async function getWalkingProgress(
  daysBack: number = 30
): Promise<MorningProgressSeries> {
  const startDate = getDateDaysAgo(daysBack);

  const entries = await db
    .select({
      date: fitnessEntries.date,
      walkDistance: fitnessEntries.walkDistance
    })
    .from(fitnessEntries)
    .where(gte(fitnessEntries.date, startDate))
    .orderBy(fitnessEntries.date);

  let cumulative = 0;
  const dataPoints: MorningProgressPoint[] = entries
    .filter(e => e.walkDistance != null)
    .map(e => {
      cumulative += e.walkDistance!;
      return {
        date: e.date,
        value: e.walkDistance,
        cumulative: Math.round(cumulative * 100) / 100
      };
    });

  // Calculate trend based on daily values
  const values = dataPoints.map(p => p.value).filter((v): v is number => v !== null);
  const { trend, percentChange } = calculateMorningTrend(values);

  const periodTotal = cumulative;
  const periodAverage = values.length > 0
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100
    : null;

  return {
    id: 'walking',
    name: 'Walking',
    unit: 'miles',
    dataPoints,
    trend,
    percentChange,
    periodTotal: Math.round(periodTotal * 100) / 100,
    periodAverage
  };
}

// ============================================
// Weight Progress (for charts)
// ============================================

export async function getWeightProgress(
  daysBack: number = 30
): Promise<MorningProgressSeries> {
  const startDate = getDateDaysAgo(daysBack);

  const entries = await db
    .select({
      date: fitnessEntries.date,
      weight: fitnessEntries.weight
    })
    .from(fitnessEntries)
    .where(gte(fitnessEntries.date, startDate))
    .orderBy(fitnessEntries.date);

  const dataPoints: MorningProgressPoint[] = entries
    .filter(e => e.weight != null)
    .map(e => ({
      date: e.date,
      value: e.weight,
      cumulative: e.weight! // For weight, cumulative doesn't make sense, so just use current
    }));

  // Calculate trend (for weight, declining might be good!)
  const values = dataPoints.map(p => p.value).filter((v): v is number => v !== null);
  const { trend, percentChange } = calculateMorningTrend(values);

  const periodAverage = values.length > 0
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10
    : null;

  return {
    id: 'weight',
    name: 'Body Weight',
    unit: 'lbs',
    dataPoints,
    trend,
    percentChange,
    periodTotal: 0, // Not applicable for weight
    periodAverage
  };
}

// Helper for morning tracker trends
function calculateMorningTrend(
  values: number[]
): { trend: 'improving' | 'maintaining' | 'declining' | 'insufficient_data'; percentChange: number | null } {
  if (values.length < 2) {
    return { trend: 'insufficient_data', percentChange: null };
  }

  const third = Math.max(1, Math.floor(values.length / 3));
  const firstValues = values.slice(0, third);
  const lastValues = values.slice(-third);

  const avgFirst = firstValues.reduce((a, b) => a + b, 0) / firstValues.length;
  const avgLast = lastValues.reduce((a, b) => a + b, 0) / lastValues.length;

  if (avgFirst === 0) {
    return { trend: 'insufficient_data', percentChange: null };
  }

  const percentChange = Math.round(((avgLast - avgFirst) / avgFirst) * 100);

  let trend: 'improving' | 'maintaining' | 'declining';
  if (Math.abs(percentChange) <= 2) {
    trend = 'maintaining';
  } else if (percentChange > 0) {
    trend = 'improving';
  } else {
    trend = 'declining';
  }

  return { trend, percentChange };
}
