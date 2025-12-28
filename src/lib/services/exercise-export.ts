import {
  EXERCISES,
  WORKOUT_TEMPLATES,
  WORKOUT_ROTATION,
  ALWAYS_DO_STACK,
  type Exercise
} from '$lib/data/exercises';

// ============================================
// Workout Export
// ============================================

function formatExerciseMarkdown(exercise: Exercise, prescription?: string): string[] {
  const lines: string[] = [];

  lines.push(`### ${exercise.name}`);
  lines.push('');
  lines.push(`- **Equipment:** ${exercise.equipment.join(', ')}`);
  if (prescription) {
    lines.push(`- **Prescription:** ${prescription}`);
  } else {
    lines.push(`- **Sets × Reps:** ${exercise.defaultSets} × ${exercise.defaultReps}`);
  }
  if (exercise.starterWeight) {
    lines.push(`- **Starter Weight:** ${exercise.starterWeight}`);
  }
  lines.push(`- **Muscles:** ${exercise.musclesWorked.join(', ')}`);
  if (exercise.videoId) {
    lines.push(`- **Video ID:** ${exercise.videoId}`);
  }
  lines.push('');

  lines.push('**Setup:**');
  lines.push(exercise.instructions.setup);
  lines.push('');

  lines.push('**Execution:**');
  for (const step of exercise.instructions.execution) {
    lines.push(`1. ${step}`);
  }
  lines.push('');

  lines.push('**Form Cues:**');
  for (const cue of exercise.instructions.formCues) {
    lines.push(`- ${cue}`);
  }
  lines.push('');

  lines.push('**Common Mistakes:**');
  for (const mistake of exercise.instructions.commonMistakes) {
    lines.push(`- ${mistake}`);
  }
  lines.push('');

  lines.push('**Tips:**');
  for (const tip of exercise.instructions.tips) {
    lines.push(`- ${tip}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  return lines;
}

export function generateWorkoutMarkdown(): string {
  const lines: string[] = [];

  lines.push('# Ghost Workout Plan');
  lines.push('');
  lines.push('A 7-day workout rotation focused on machine-based exercises for beginners.');
  lines.push('');

  // Weekly Schedule
  lines.push('## Weekly Schedule');
  lines.push('');
  lines.push('| Day | Workout | Focus |');
  lines.push('|-----|---------|-------|');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (let i = 0; i < 7; i++) {
    const dayIndex = i === 0 ? 0 : i;
    const rotation = WORKOUT_ROTATION[dayIndex];
    lines.push(`| ${dayNames[i]} | ${rotation.label} | ${rotation.focus} |`);
  }
  lines.push('');

  // Workout Details
  const workoutTypes = [
    { type: 'upper_push', title: 'Upper Push', description: 'Chest, Shoulders, Triceps' },
    { type: 'lower', title: 'Lower Body', description: 'Quads, Hamstrings, Glutes, Calves' },
    { type: 'upper_pull', title: 'Upper Pull', description: 'Back, Biceps, Rear Delts' },
  ] as const;

  for (const workout of workoutTypes) {
    lines.push(`## ${workout.title}`);
    lines.push('');
    lines.push(`*${workout.description}*`);
    lines.push('');

    const exerciseIds = WORKOUT_TEMPLATES[workout.type];
    for (const exerciseId of exerciseIds) {
      const exercise = EXERCISES[exerciseId];
      if (!exercise) continue;
      lines.push(...formatExerciseMarkdown(exercise));
    }
  }

  // Always-Do Stack
  lines.push('## Always-Do Stack (Daily)');
  lines.push('');
  lines.push('Complete these every workout day regardless of the main workout.');
  lines.push('');

  const categories = [
    { key: 'cardio', title: 'Cardio (Warm-Up)', emoji: '🏃' },
    { key: 'core', title: 'Core Work', emoji: '💪' },
    { key: 'mobility', title: 'Mobility/Stretching', emoji: '🧘' },
  ] as const;

  for (const cat of categories) {
    const items = ALWAYS_DO_STACK.filter(item => item.category === cat.key);
    if (items.length === 0) continue;

    lines.push(`### ${cat.emoji} ${cat.title}`);
    lines.push('');

    for (const item of items) {
      const exercise = EXERCISES[item.id];
      if (!exercise) continue;

      const prescription = item.duration || (item.sets ? `${item.sets} × ${item.reps}` : item.reps);
      lines.push(...formatExerciseMarkdown(exercise, prescription));
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('*Exported from Ghost Dashboard*');

  return lines.join('\n');
}
