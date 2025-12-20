<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ExerciseLog } from '$lib/db/schema';

  let {
    sessionId,
    exerciseId,
    setNumber,
    existingLog,
    defaultReps,
    isFuture = false,
    onUpdate
  }: {
    sessionId: number;
    exerciseId: string;
    setNumber: number;
    existingLog?: ExerciseLog;
    defaultReps: string;
    isFuture?: boolean;
    onUpdate?: (log: Partial<ExerciseLog>) => void;
  } = $props();

  // Derived values from props
  const initialReps = $derived(existingLog?.reps?.toString() ?? '');
  const initialWeight = $derived(existingLog?.weight?.toString() ?? '');
  const initialCompleted = $derived(existingLog?.completed ?? false);
  const defaultRepsNum = $derived(defaultReps.split('-')[0]);

  // Local state for form inputs (synced from derived when props change)
  let reps = $state<string>('');
  let weight = $state<string>('');
  let completed = $state(false);

  // Sync local state from props
  $effect(() => {
    reps = initialReps;
  });
  $effect(() => {
    weight = initialWeight;
  });
  $effect(() => {
    completed = initialCompleted;
  });
</script>

<form
  method="POST"
  action="?/logSet"
  use:enhance={() => {
    // Optimistic update
    const newCompleted = !completed;
    completed = newCompleted;
    onUpdate?.({ reps: reps ? parseInt(reps) : null, weight: weight ? parseFloat(weight) : null, completed: newCompleted });

    return async ({ update }) => {
      await update({ reset: false });
    };
  }}
  class="flex items-center gap-2 py-2"
>
  <input type="hidden" name="sessionId" value={sessionId} />
  <input type="hidden" name="exerciseId" value={exerciseId} />
  <input type="hidden" name="setNumber" value={setNumber} />
  <input type="hidden" name="completed" value={!completed} />

  <!-- Set number -->
  <span class="w-12 text-sm text-[var(--color-text-muted)]">Set {setNumber}</span>

  <!-- Reps input -->
  <input
    type="number"
    name="reps"
    bind:value={reps}
    placeholder={defaultRepsNum}
    disabled={isFuture}
    class="w-16 px-2 py-1.5 text-sm text-center rounded border bg-[var(--color-surface)] border-[var(--color-border)]
      text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]
      focus:outline-none focus:border-[var(--color-accent)]
      disabled:opacity-50 disabled:cursor-not-allowed"
  />
  <span class="text-sm text-[var(--color-text-muted)]">reps</span>

  <!-- Weight input -->
  <span class="text-sm text-[var(--color-text-muted)]">@</span>
  <input
    type="number"
    name="weight"
    bind:value={weight}
    placeholder="—"
    step="2.5"
    disabled={isFuture}
    class="w-20 px-2 py-1.5 text-sm text-center rounded border bg-[var(--color-surface)] border-[var(--color-border)]
      text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]
      focus:outline-none focus:border-[var(--color-accent)]
      disabled:opacity-50 disabled:cursor-not-allowed"
  />
  <span class="text-sm text-[var(--color-text-muted)]">lbs</span>

  <!-- Complete button -->
  <button
    type="submit"
    disabled={isFuture}
    class="ml-auto p-1.5 rounded-lg transition-colors
      {completed
        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'}
      disabled:opacity-50 disabled:cursor-not-allowed"
    title={completed ? 'Mark incomplete' : 'Mark complete'}
  >
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {#if completed}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      {:else}
        <circle cx="12" cy="12" r="10" stroke-width="2" />
      {/if}
    </svg>
  </button>
</form>
