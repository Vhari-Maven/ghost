<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';

  let { data }: { data: PageData } = $props();

  // Track optimistic updates
  let optimisticUpdates = $state<Record<string, Record<string, any>>>({});

  function getDisplayValue(row: typeof data.rows[0], field: string): any {
    // Check for optimistic update first
    if (optimisticUpdates[row.date]?.[field] !== undefined) {
      return optimisticUpdates[row.date][field];
    }
    // Fall back to actual data
    return row.entry?.[field as keyof typeof row.entry] ?? null;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function handleCheckbox(date: string, field: string, currentValue: boolean) {
    // Optimistic update
    if (!optimisticUpdates[date]) {
      optimisticUpdates[date] = {};
    }
    optimisticUpdates[date][field] = !currentValue;
  }

  function handleNumericBlur(
    event: Event,
    date: string,
    field: string
  ) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Optimistic update
    if (!optimisticUpdates[date]) {
      optimisticUpdates[date] = {};
    }
    optimisticUpdates[date][field] = value === '' ? null : parseFloat(value);

    // Submit the form
    const form = input.closest('form');
    if (form) {
      form.requestSubmit();
    }
  }

  const columns = [
    { key: 'weight', label: 'Weight', type: 'number', unit: 'lbs' },
    { key: 'walkDistance', label: 'Walk', type: 'number', unit: 'mi' },
    { key: 'walkIncline', label: 'Incline', type: 'number', unit: '%' },
    { key: 'breakfast', label: 'Brkfst', type: 'boolean' },
    { key: 'brush', label: 'Brush', type: 'boolean' },
    { key: 'floss', label: 'Floss', type: 'boolean' },
    { key: 'shower', label: 'Shower', type: 'boolean' },
    { key: 'shake', label: 'Shake', type: 'boolean' },
  ];
</script>

<div>
  <h1 class="text-2xl font-bold mb-6">Fitness & Morning Tracker</h1>

  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-[var(--color-border)]">
          <th class="text-left py-3 px-2 text-[var(--color-text-muted)] font-medium w-24">Date</th>
          {#each columns as col}
            <th class="text-center py-3 px-2 text-[var(--color-text-muted)] font-medium min-w-[70px]">
              {col.label}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each data.rows as row}
          {@const rowClass = row.isToday
            ? 'bg-[var(--color-accent)]/10 border-l-2 border-l-[var(--color-accent)]'
            : row.isFuture
              ? 'opacity-50'
              : ''}
          <tr class="border-b border-[var(--color-border)] {rowClass}">
            <td class="py-2 px-2 font-medium {row.isToday ? 'text-[var(--color-accent)]' : ''}">
              {#if row.isToday}
                <span class="text-xs uppercase tracking-wide">Today</span>
              {:else}
                {formatDate(row.date)}
              {/if}
            </td>

            {#each columns as col}
              <td class="py-2 px-2 text-center">
                {#if row.isFuture}
                  <span class="text-[var(--color-text-muted)]">—</span>
                {:else if col.type === 'boolean'}
                  <form
                    method="POST"
                    action="?/updateField"
                    use:enhance={() => {
                      return async ({ update }) => {
                        await update({ reset: false });
                      };
                    }}
                  >
                    <input type="hidden" name="date" value={row.date} />
                    <input type="hidden" name="field" value={col.key} />
                    <input type="hidden" name="value" value={!getDisplayValue(row, col.key)} />
                    <button
                      type="submit"
                      class="w-6 h-6 rounded border border-[var(--color-border)] flex items-center justify-center mx-auto hover:border-[var(--color-accent)] transition-colors {getDisplayValue(row, col.key) ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : ''}"
                      onclick={() => handleCheckbox(row.date, col.key, getDisplayValue(row, col.key))}
                    >
                      {#if getDisplayValue(row, col.key)}
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      {/if}
                    </button>
                  </form>
                {:else}
                  <form
                    method="POST"
                    action="?/updateField"
                    use:enhance={() => {
                      return async ({ update }) => {
                        await update({ reset: false });
                      };
                    }}
                  >
                    <input type="hidden" name="date" value={row.date} />
                    <input type="hidden" name="field" value={col.key} />
                    <input
                      type="number"
                      name="value"
                      step="0.1"
                      value={getDisplayValue(row, col.key) ?? ''}
                      placeholder="—"
                      onblur={(e) => handleNumericBlur(e, row.date, col.key)}
                      onkeydown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      class="w-full max-w-[70px] bg-transparent border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-accent)] rounded px-2 py-1 text-center outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </form>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="mt-4 text-sm text-[var(--color-text-muted)]">
    Click checkboxes to toggle • Click numbers to edit • Future dates are locked
  </p>
</div>
