<script lang="ts">
  import type { WeekDay } from '$lib/services/exercise';

  let { weekDays, isFuture = false }: { weekDays: WeekDay[]; isFuture?: boolean } = $props();
</script>

<div class="flex justify-center gap-1 mb-6">
  {#each weekDays as day}
    <a
      href="/exercise?date={day.date}"
      class="flex flex-col items-center px-3 py-2 rounded-lg transition-all min-w-[52px]
        {day.isSelected
          ? 'bg-[var(--color-accent)] text-white'
          : day.isToday
            ? 'bg-[var(--color-surface)] text-[var(--color-text)] ring-2 ring-[var(--color-accent)]'
            : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'}"
    >
      <span class="text-xs font-medium">{day.label}</span>
      <span class="text-lg font-bold">{day.dayNum}</span>
    </a>
  {/each}
</div>

{#if isFuture}
  <div class="text-center mb-4 py-2 px-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
    This is a future date. You can view the planned workout but can't log exercises yet.
  </div>
{/if}
