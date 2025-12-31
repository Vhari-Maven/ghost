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
  getCaloriesProgress
} from '$lib/services/analytics';
import { EXERCISES } from '$lib/data/exercises';

export const load: PageServerLoad = async ({ url }) => {
  const daysBack = parseInt(url.searchParams.get('days') || '30');

  // Validate days parameter (allow 7, 14, 30, 90)
  const validDays = [7, 14, 30, 90];
  const days = validDays.includes(daysBack) ? daysBack : 30;

  const [
    exerciseProgress,
    consistency,
    summary,
    morningStats,
    walkingProgress,
    weightProgress,
    heartRateZones,
    sleepProgress,
    caloriesProgress
  ] = await Promise.all([
    getAllExerciseProgress(days),
    getWorkoutConsistency(days),
    getPeriodSummary(days),
    getMorningTrackerStats(days),
    getWalkingProgress(days),
    getWeightProgress(days),
    getHeartRateZonesProgress(days),
    getSleepProgress(days),
    getCaloriesProgress(days)
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
    days,
    categories,
    exerciseDefinitions: EXERCISES
  };
};
