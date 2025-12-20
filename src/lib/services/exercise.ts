import { db } from '$lib/db';
import { exerciseSessions, exerciseLogs, alwaysDoLogs } from '$lib/db/schema';
import type { ExerciseSession, ExerciseLog, AlwaysDoLog, WorkoutType } from '$lib/db/schema';
import { eq, and, lt, desc } from 'drizzle-orm';
import { getWorkoutForDay } from '$lib/data/exercises';

// ============================================
// Date Utilities
// ============================================

export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWorkoutTypeForDate(dateStr: string): WorkoutType {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  return getWorkoutForDay(dayOfWeek).type;
}

export interface WeekDay {
  date: string;
  dayOfWeek: number;
  label: string;
  dayNum: number;
  isToday: boolean;
  isSelected: boolean;
  workoutType: WorkoutType;
  workoutLabel: string;
}

export function buildWeekNavigation(selectedDate: string): WeekDay[] {
  const today = getLocalDateString(new Date());
  const selected = new Date(selectedDate + 'T00:00:00');

  // Find the Monday of the week containing the selected date
  const dayOfWeek = selected.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(selected);
  monday.setDate(selected.getDate() + mondayOffset);

  const days: WeekDay[] = [];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = getLocalDateString(date);
    const dow = date.getDay();
    const workout = getWorkoutForDay(dow);

    days.push({
      date: dateStr,
      dayOfWeek: dow,
      label: dayLabels[i],
      dayNum: date.getDate(),
      isToday: dateStr === today,
      isSelected: dateStr === selectedDate,
      workoutType: workout.type,
      workoutLabel: workout.label
    });
  }

  return days;
}

// ============================================
// Session Operations
// ============================================

export async function getOrCreateSession(date: string): Promise<ExerciseSession> {
  const workoutType = getWorkoutTypeForDate(date);

  let session = await db.select()
    .from(exerciseSessions)
    .where(eq(exerciseSessions.date, date))
    .get();

  if (!session) {
    const result = await db.insert(exerciseSessions)
      .values({ date, workoutType })
      .returning();
    session = result[0];
  }

  return session;
}

export async function getSessionByDate(date: string): Promise<ExerciseSession | undefined> {
  return db.select()
    .from(exerciseSessions)
    .where(eq(exerciseSessions.date, date))
    .get();
}

export async function markSessionComplete(sessionId: number): Promise<void> {
  await db.update(exerciseSessions)
    .set({
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .where(eq(exerciseSessions.id, sessionId));
}

export async function updateSessionNotes(sessionId: number, notes: string): Promise<void> {
  await db.update(exerciseSessions)
    .set({
      notes,
      updatedAt: new Date().toISOString()
    })
    .where(eq(exerciseSessions.id, sessionId));
}

// ============================================
// Exercise Log Operations
// ============================================

export async function getExerciseLogsForSession(sessionId: number): Promise<ExerciseLog[]> {
  return db.select()
    .from(exerciseLogs)
    .where(eq(exerciseLogs.sessionId, sessionId));
}

export interface LogSetInput {
  sessionId: number;
  exerciseId: string;
  setNumber: number;
  reps?: number | null;
  weight?: number | null;
  duration?: number | null;
  completed: boolean;
}

export async function upsertExerciseLog(input: LogSetInput): Promise<ExerciseLog> {
  // Check if log exists for this session + exercise + set
  const existing = await db.select()
    .from(exerciseLogs)
    .where(and(
      eq(exerciseLogs.sessionId, input.sessionId),
      eq(exerciseLogs.exerciseId, input.exerciseId),
      eq(exerciseLogs.setNumber, input.setNumber)
    ))
    .get();

  if (existing) {
    await db.update(exerciseLogs)
      .set({
        reps: input.reps,
        weight: input.weight,
        duration: input.duration,
        completed: input.completed
      })
      .where(eq(exerciseLogs.id, existing.id));

    return { ...existing, ...input };
  } else {
    const result = await db.insert(exerciseLogs)
      .values({
        sessionId: input.sessionId,
        exerciseId: input.exerciseId,
        setNumber: input.setNumber,
        reps: input.reps,
        weight: input.weight,
        duration: input.duration,
        completed: input.completed
      })
      .returning();

    return result[0];
  }
}

export async function deleteExerciseLog(logId: number): Promise<void> {
  await db.delete(exerciseLogs).where(eq(exerciseLogs.id, logId));
}

// ============================================
// Always-Do Log Operations
// ============================================

export async function getAlwaysDoLogsForSession(sessionId: number): Promise<AlwaysDoLog[]> {
  return db.select()
    .from(alwaysDoLogs)
    .where(eq(alwaysDoLogs.sessionId, sessionId));
}

export interface ToggleAlwaysDoInput {
  sessionId: number;
  exerciseId: string;
  completed: boolean;
  duration?: number | null;
  reps?: number | null;
}

export async function upsertAlwaysDoLog(input: ToggleAlwaysDoInput): Promise<AlwaysDoLog> {
  const existing = await db.select()
    .from(alwaysDoLogs)
    .where(and(
      eq(alwaysDoLogs.sessionId, input.sessionId),
      eq(alwaysDoLogs.exerciseId, input.exerciseId)
    ))
    .get();

  if (existing) {
    await db.update(alwaysDoLogs)
      .set({
        completed: input.completed,
        duration: input.duration,
        reps: input.reps
      })
      .where(eq(alwaysDoLogs.id, existing.id));

    return { ...existing, ...input };
  } else {
    const result = await db.insert(alwaysDoLogs)
      .values({
        sessionId: input.sessionId,
        exerciseId: input.exerciseId,
        completed: input.completed,
        duration: input.duration,
        reps: input.reps
      })
      .returning();

    return result[0];
  }
}

// ============================================
// Historical Data
// ============================================

export interface HistoricalWorkout {
  session: ExerciseSession;
  logs: ExerciseLog[];
}

export async function getLastWorkoutOfType(
  workoutType: WorkoutType,
  beforeDate: string
): Promise<HistoricalWorkout | null> {
  const lastSession = await db.select()
    .from(exerciseSessions)
    .where(and(
      eq(exerciseSessions.workoutType, workoutType),
      lt(exerciseSessions.date, beforeDate)
    ))
    .orderBy(desc(exerciseSessions.date))
    .limit(1)
    .get();

  if (!lastSession) return null;

  const logs = await db.select()
    .from(exerciseLogs)
    .where(eq(exerciseLogs.sessionId, lastSession.id));

  return { session: lastSession, logs };
}

// Group exercise logs by exercise ID for easy lookup
export function groupLogsByExercise(logs: ExerciseLog[]): Record<string, ExerciseLog[]> {
  return logs.reduce((acc, log) => {
    if (!acc[log.exerciseId]) {
      acc[log.exerciseId] = [];
    }
    acc[log.exerciseId].push(log);
    return acc;
  }, {} as Record<string, ExerciseLog[]>);
}

// Format historical data for display
export function formatHistoricalSummary(logs: ExerciseLog[]): string {
  if (logs.length === 0) return '';

  const sortedLogs = [...logs].sort((a, b) => a.setNumber - b.setNumber);
  const setCount = sortedLogs.length;

  // Get average reps and typical weight
  const reps = sortedLogs.filter(l => l.reps != null).map(l => l.reps!);
  const weights = sortedLogs.filter(l => l.weight != null).map(l => l.weight!);

  if (reps.length === 0 && weights.length === 0) {
    return `${setCount} sets completed`;
  }

  const avgReps = reps.length > 0 ? Math.round(reps.reduce((a, b) => a + b, 0) / reps.length) : null;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;

  if (avgReps && maxWeight) {
    return `${setCount}×${avgReps} @ ${maxWeight} lbs`;
  } else if (avgReps) {
    return `${setCount}×${avgReps} reps`;
  } else if (maxWeight) {
    return `${setCount} sets @ ${maxWeight} lbs`;
  }

  return `${setCount} sets`;
}
