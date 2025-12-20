import type { PageServerLoad, Actions } from './$types';
import {
  getLocalDateString,
  getWorkoutTypeForDate,
  buildWeekNavigation,
  getOrCreateSession,
  getExerciseLogsForSession,
  getAlwaysDoLogsForSession,
  getLastWorkoutOfType,
  upsertExerciseLog,
  upsertAlwaysDoLog,
  markSessionComplete,
  groupLogsByExercise,
  formatHistoricalSummary
} from '$lib/services/exercise';
import {
  getWorkoutForDay,
  getExercisesForWorkout,
  getAlwaysDoByCategory,
  EXERCISES
} from '$lib/data/exercises';

export const load: PageServerLoad = async ({ url }) => {
  const today = getLocalDateString(new Date());
  const selectedDate = url.searchParams.get('date') || today;

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const validDate = dateRegex.test(selectedDate) ? selectedDate : today;

  // Get workout info for selected date
  const date = new Date(validDate + 'T00:00:00');
  const dayOfWeek = date.getDay();
  const workoutInfo = getWorkoutForDay(dayOfWeek);
  const exercises = getExercisesForWorkout(workoutInfo.type);
  const alwaysDoByCategory = getAlwaysDoByCategory();

  // Get or create session for this date
  const session = await getOrCreateSession(validDate);

  // Get logs for this session
  const exerciseLogs = await getExerciseLogsForSession(session.id);
  const alwaysDoLogs = await getAlwaysDoLogsForSession(session.id);

  // Get historical data for comparison
  const history = await getLastWorkoutOfType(workoutInfo.type, validDate);
  const historyByExercise = history ? groupLogsByExercise(history.logs) : {};

  // Build historical summaries for each exercise
  const historicalSummaries: Record<string, string> = {};
  for (const exerciseId of Object.keys(historyByExercise)) {
    historicalSummaries[exerciseId] = formatHistoricalSummary(historyByExercise[exerciseId]);
  }

  // Build week navigation
  const weekDays = buildWeekNavigation(validDate);

  // Group current logs by exercise for easy lookup
  const logsByExercise = groupLogsByExercise(exerciseLogs);

  // Create always-do completion map
  const alwaysDoStatus: Record<string, boolean> = {};
  for (const log of alwaysDoLogs) {
    alwaysDoStatus[log.exerciseId] = log.completed;
  }

  return {
    selectedDate: validDate,
    today,
    isToday: validDate === today,
    isFuture: validDate > today,
    session,
    workoutInfo,
    exercises,
    allExercises: EXERCISES,
    alwaysDoByCategory,
    weekDays,
    logsByExercise,
    alwaysDoStatus,
    historicalSummaries,
    historyDate: history?.session.date || null
  };
};

export const actions: Actions = {
  logSet: async ({ request }) => {
    const formData = await request.formData();
    const sessionId = parseInt(formData.get('sessionId') as string);
    const exerciseId = formData.get('exerciseId') as string;
    const setNumber = parseInt(formData.get('setNumber') as string);
    const repsStr = formData.get('reps') as string;
    const weightStr = formData.get('weight') as string;
    const durationStr = formData.get('duration') as string;
    const completed = formData.get('completed') === 'true';

    const reps = repsStr ? parseInt(repsStr) : null;
    const weight = weightStr ? parseFloat(weightStr) : null;
    const duration = durationStr ? parseInt(durationStr) : null;

    await upsertExerciseLog({
      sessionId,
      exerciseId,
      setNumber,
      reps,
      weight,
      duration,
      completed
    });

    return { success: true };
  },

  toggleAlwaysDo: async ({ request }) => {
    const formData = await request.formData();
    const sessionId = parseInt(formData.get('sessionId') as string);
    const exerciseId = formData.get('exerciseId') as string;
    const completed = formData.get('completed') === 'true';

    await upsertAlwaysDoLog({
      sessionId,
      exerciseId,
      completed
    });

    return { success: true };
  },

  completeSession: async ({ request }) => {
    const formData = await request.formData();
    const sessionId = parseInt(formData.get('sessionId') as string);

    await markSessionComplete(sessionId);

    return { success: true };
  }
};
