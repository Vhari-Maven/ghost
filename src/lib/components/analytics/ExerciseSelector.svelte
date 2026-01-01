<script lang="ts">
  import type { ExerciseProgressSeries } from '$lib/services/analytics';

  let {
    exercises,
    selected = $bindable<string | null>(null)
  }: {
    exercises: ExerciseProgressSeries[];
    selected?: string | null;
  } = $props();

  // Group exercises by category
  const grouped = $derived(() => {
    const groups: Record<string, ExerciseProgressSeries[]> = {};
    for (const ex of exercises) {
      if (!groups[ex.category]) {
        groups[ex.category] = [];
      }
      groups[ex.category].push(ex);
    }
    return groups;
  });

  const categoryLabels: Record<string, string> = {
    compound: 'Compound',
    isolation: 'Isolation',
    core: 'Core',
    mobility: 'Mobility',
    cardio: 'Cardio'
  };

  function handleChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selected = select.value || null;
  }
</script>

<select
  value={selected || ''}
  onchange={handleChange}
  class="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg
         text-[var(--color-text)] text-sm
         hover:border-[var(--color-border-hover)] focus:border-[var(--color-accent)]
         focus:outline-none transition-colors cursor-pointer"
>
  {#each Object.entries(grouped()) as [category, categoryExercises]}
    <optgroup label={categoryLabels[category] || category}>
      {#each categoryExercises as exercise}
        <option value={exercise.exerciseId}>{exercise.exerciseName}</option>
      {/each}
    </optgroup>
  {/each}
</select>
