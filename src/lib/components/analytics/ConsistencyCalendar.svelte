<script lang="ts">
  import type { WorkoutConsistencyDay } from '$lib/services/analytics';

  let { days }: { days: WorkoutConsistencyDay[] } = $props();

  // Workout type colors - using inline styles since Tailwind can't parse dynamic classes
  const workoutConfig: Record<string, { bg: string; border: string; text: string; label: string; abbrev: string }> = {
    upper_push: {
      bg: 'rgba(6, 182, 212, 0.2)',      // cyan
      border: 'rgba(6, 182, 212, 0.4)',
      text: 'rgb(6, 182, 212)',
      label: 'Upper Push',
      abbrev: 'UP'
    },
    lower: {
      bg: 'rgba(34, 197, 94, 0.2)',       // green
      border: 'rgba(34, 197, 94, 0.4)',
      text: 'rgb(34, 197, 94)',
      label: 'Lower',
      abbrev: 'LO'
    },
    upper_pull: {
      bg: 'rgba(168, 85, 247, 0.2)',      // purple
      border: 'rgba(168, 85, 247, 0.4)',
      text: 'rgb(168, 85, 247)',
      label: 'Upper Pull',
      abbrev: 'PL'
    },
    recovery: {
      bg: 'rgba(107, 114, 128, 0.2)',     // gray
      border: 'rgba(107, 114, 128, 0.4)',
      text: 'rgb(107, 114, 128)',
      label: 'Recovery',
      abbrev: 'RE'
    }
  };

  // Get day of week label
  function getDayLabel(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  }

  // Get day number
  function getDayNum(dateStr: string): number {
    const date = new Date(dateStr + 'T00:00:00');
    return date.getDate();
  }

  // Check if date is today
  function isToday(dateStr: string): boolean {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  }
</script>

<div class="flex flex-wrap gap-1.5">
  {#each days as day}
    {@const config = day.workoutType ? workoutConfig[day.workoutType] : null}
    <div
      class="group relative w-10 h-12 rounded-lg border flex flex-col items-center justify-center text-xs transition-all
             {!day.workoutType ? 'bg-[var(--color-surface)] border-[var(--color-border)] opacity-50' : ''}
             {isToday(day.date) ? 'ring-2 ring-[var(--color-accent)]' : ''}"
      style={config ? `background-color: ${config.bg}; border-color: ${config.border};` : ''}
      title="{getDayLabel(day.date)} - {config?.label || 'Rest'}{day.totalSets > 0 ? ` (${day.totalSets} sets)` : ''}"
    >
      <span class="text-[10px] text-[var(--color-text-muted)]">{getDayLabel(day.date)}</span>
      <span class="font-medium {day.workoutType ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}">
        {getDayNum(day.date)}
      </span>
      {#if config}
        <span class="text-[8px] font-bold" style="color: {config.text};">{config.abbrev}</span>
      {/if}
    </div>
  {/each}
</div>

<!-- Legend -->
<div class="mt-4 flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
  {#each Object.entries(workoutConfig) as [_, config]}
    <div class="flex items-center gap-1.5">
      <div class="w-3 h-3 rounded" style="background-color: {config.text};"></div>
      <span>{config.label}</span>
    </div>
  {/each}
</div>
