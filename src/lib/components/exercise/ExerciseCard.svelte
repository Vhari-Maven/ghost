<script lang="ts">
  import type { Exercise } from '$lib/data/exercises';
  import type { ExerciseLog } from '$lib/db/schema';
  import SetRow from './SetRow.svelte';
  import ExerciseInstructions from './ExerciseInstructions.svelte';

  let {
    exercise,
    sessionId,
    existingLogs = [],
    historicalSummary = '',
    isFuture = false
  }: {
    exercise: Exercise;
    sessionId: number;
    existingLogs?: ExerciseLog[];
    historicalSummary?: string;
    isFuture?: boolean;
  } = $props();

  // Create a map of existing logs by set number
  const logsBySet = $derived(
    existingLogs.reduce((acc, log) => {
      acc[log.setNumber] = log;
      return acc;
    }, {} as Record<number, ExerciseLog>)
  );

  // Calculate completion status
  const completedSets = $derived(existingLogs.filter(l => l.completed).length);
  const isFullyCompleted = $derived(completedSets >= exercise.defaultSets);
</script>

<div
  class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 transition-all
    {isFullyCompleted ? 'border-green-500/30 bg-green-500/5' : ''}"
>
  <!-- Header -->
  <div class="flex items-start justify-between mb-3">
    <div>
      <h3 class="font-semibold text-[var(--color-text)] {isFullyCompleted ? 'text-green-400' : ''}">
        {exercise.name}
        {#if isFullyCompleted}
          <span class="ml-2 text-green-400">✓</span>
        {/if}
      </h3>
      <p class="text-sm text-[var(--color-text-muted)]">
        {exercise.musclesWorked.join(', ')}
      </p>
    </div>
    <div class="text-right">
      <div class="text-sm font-medium text-[var(--color-accent)]">
        {exercise.defaultSets} × {exercise.defaultReps}
      </div>
      {#if completedSets > 0}
        <div class="text-xs text-[var(--color-text-muted)]">
          {completedSets}/{exercise.defaultSets} complete
        </div>
      {/if}
    </div>
  </div>

  <!-- Set Rows -->
  <div class="space-y-1 border-t border-[var(--color-border)]/50 pt-3">
    {#each Array(exercise.defaultSets) as _, i}
      <SetRow
        {sessionId}
        exerciseId={exercise.id}
        setNumber={i + 1}
        existingLog={logsBySet[i + 1]}
        defaultReps={exercise.defaultReps}
        {isFuture}
      />
    {/each}
  </div>

  <!-- Historical Comparison -->
  {#if historicalSummary}
    <div class="mt-3 pt-3 border-t border-[var(--color-border)]/50">
      <div class="text-xs text-[var(--color-text-muted)]">
        <span class="text-[var(--color-accent)]">Last time:</span> {historicalSummary}
      </div>
    </div>
  {/if}

  <!-- Instructions -->
  <ExerciseInstructions
    instructions={exercise.instructions}
    equipment={exercise.equipment}
    starterWeight={exercise.starterWeight}
    videoId={exercise.videoId}
    exerciseName={exercise.name}
  />
</div>
