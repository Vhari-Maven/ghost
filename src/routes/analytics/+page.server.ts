import type { PageServerLoad } from './$types';
import {
  getAllExerciseProgress,
  getWorkoutConsistency,
  getPeriodSummary,
  getMorningTrackerStats,
  getWalkingProgress,
  getWeightProgress,
  getHeartRateZonesProgress,
  getSleepProgress,
  getCaloriesProgress,
  getStepsProgress
} from '$lib/services/analytics';
import { EXERCISES } from '$lib/data/exercises';

export const load: PageServerLoad = async ({ url }) => {
  const daysBack = parseInt(url.searchParams.get('days') || '30');

  // Validate days parameter (allow 7, 14, 30, 90)
  const validDays = [7, 14, 30, 90];
  const days = validDays.includes(daysBack) ? daysBack : 30;

  try {
    const [
      exerciseProgress,
      consistency,
      summary,
      morningStats,
      walkingProgress,
      weightProgress,
      heartRateZones,
      sleepProgress,
      caloriesProgress,
      stepsProgress
    ] = await Promise.all([
      getAllExerciseProgress(days),
      getWorkoutConsistency(days),
      getPeriodSummary(days),
      getMorningTrackerStats(days),
      getWalkingProgress(days),
      getWeightProgress(days),
      getHeartRateZonesProgress(days),
      getSleepProgress(days),
      getCaloriesProgress(days),
      getStepsProgress(days)
    ]);

    // Get unique categories from exercises that have progress data
    const categories = [...new Set(exerciseProgress.map(p => p.category))].sort();

    return {
      exerciseProgress,
      consistency,
      summary,
      morningStats,
      walkingProgress,
      weightProgress,
      heartRateZones,
      sleepProgress,
      caloriesProgress,
      stepsProgress,
      days,
      categories,
      exerciseDefinitions: EXERCISES,
      error: null
    };
  } catch (error) {
    console.error('[Analytics] Failed to load data:', error);

    // Return empty data with error flag
    return {
      exerciseProgress: [],
      consistency: [],
      summary: {
        month: `${days} days`,
        totalWorkouts: 0,
        completedWorkouts: 0,
        workoutsByType: { upper_push: 0, lower: 0, upper_pull: 0, recovery: 0 },
        averageSetsPerWorkout: 0,
        topExercises: []
      },
      morningStats: { avgWeight: null, totalMiles: 0, daysWithWeight: 0, daysWithWalk: 0 },
      walkingProgress: { id: 'walking', name: 'Walking', unit: 'miles', dataPoints: [], trend: 'insufficient_data' as const, percentChange: null, periodTotal: 0, periodAverage: null },
      weightProgress: { id: 'weight', name: 'Body Weight', unit: 'lbs', dataPoints: [], trend: 'insufficient_data' as const, percentChange: null, periodTotal: 0, periodAverage: null },
      heartRateZones: { id: 'heart-rate-zones', name: 'Heart Rate Zones', dataPoints: [], trend: 'insufficient_data' as const, percentChange: null, periodAverage: { outOfRange: 0, fatBurn: 0, cardio: 0, peak: 0 } },
      sleepProgress: { id: 'sleep', name: 'Sleep', unit: 'hours', dataPoints: [], trend: 'insufficient_data' as const, percentChange: null, periodAverage: { duration: 0, efficiency: 0, deepPercent: 0 } },
      caloriesProgress: { id: 'calories', name: 'Calories Burned', unit: 'cal', dataPoints: [], trend: 'insufficient_data' as const, percentChange: null, periodTotal: 0, periodAverage: null },
      stepsProgress: { id: 'steps', name: 'Steps', unit: 'steps', dataPoints: [], trend: 'insufficient_data' as const, percentChange: null, periodTotal: 0, periodAverage: null },
      days,
      categories: [],
      exerciseDefinitions: EXERCISES,
      error: 'Failed to load analytics data. Please try again later.'
    };
  }
};
