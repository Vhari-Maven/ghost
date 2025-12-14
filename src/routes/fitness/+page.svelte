<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';
  import { tick } from 'svelte';

  let { data }: { data: PageData } = $props();

  // Track optimistic updates
  let optimisticUpdates = $state<Record<string, Record<string, any>>>({});

  // Track where to restore focus after form submission
  let restoreFocus = $state<{ row: number; col: number } | null>(null);

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

  function setOptimisticValue(date: string, field: string, value: string) {
    if (!optimisticUpdates[date]) {
      optimisticUpdates[date] = {};
    }
    optimisticUpdates[date][field] = value === '' ? null : parseFloat(value);
  }

  async function focusCell(row: number, col: number) {
    await tick();
    // Try numeric input first
    let targetEl = document.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    ) as HTMLElement;

    // If not found, try checkbox button
    if (!targetEl) {
      targetEl = document.querySelector(
        `[data-checkbox-row="${row}"][data-checkbox-col="${col}"]`
      ) as HTMLElement;
    }

    if (targetEl) {
      targetEl.focus();
      if (targetEl instanceof HTMLInputElement) {
        targetEl.select();
      }
    }
  }

  async function handleNumericKeyNav(event: KeyboardEvent, rowIndex: number, colIndex: number) {
    const key = event.key;
    let targetRow = rowIndex;
    let targetCol = colIndex;

    if (key === 'ArrowDown') {
      event.preventDefault();
      targetRow = Math.min(rowIndex + 1, data.rows.length - 1);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      targetRow = Math.max(rowIndex - 1, 0);
    } else if (key === 'Enter') {
      event.preventDefault();
      targetRow = Math.min(rowIndex + 1, data.rows.length - 1);
    } else if (key === 'Tab') {
      event.preventDefault();

      // Find the last non-future row index
      const lastEditableRow = data.rows.findIndex(r => r.isFuture) - 1;
      const firstEditableRow = 0;

      if (event.shiftKey) {
        // Shift+Tab: go to previous column, or previous row's last column
        if (colIndex > 0) {
          targetCol = colIndex - 1;
        } else if (rowIndex > firstEditableRow) {
          targetRow = rowIndex - 1;
          targetCol = columns.length - 1;
        } else {
          // Wrap to last editable row's last column
          targetRow = lastEditableRow >= 0 ? lastEditableRow : rowIndex;
          targetCol = columns.length - 1;
        }
      } else {
        // Tab: go to next column, or next row's first column
        if (colIndex < columns.length - 1) {
          targetCol = colIndex + 1;
        } else if (rowIndex < lastEditableRow) {
          targetRow = rowIndex + 1;
          targetCol = 0;
        } else {
          // Wrap to first row's first column
          targetRow = firstEditableRow;
          targetCol = 0;
        }
      }
    } else {
      return;
    }

    // If not moving, do nothing
    if (targetRow === rowIndex && targetCol === colIndex) return;

    // Skip future rows (they don't have inputs)
    while (targetRow >= 0 && targetRow < data.rows.length && data.rows[targetRow].isFuture) {
      if (key === 'ArrowUp' || (key === 'Tab' && event.shiftKey)) {
        targetRow--;
      } else {
        targetRow++;
      }
    }

    // If we've gone out of bounds, don't navigate
    if (targetRow < 0 || targetRow >= data.rows.length || data.rows[targetRow].isFuture) {
      return;
    }

    // Save current value
    const input = event.target as HTMLInputElement;
    setOptimisticValue(data.rows[rowIndex].date, columns[colIndex].key, input.value);

    // Set restore focus for after form submission
    restoreFocus = { row: targetRow, col: targetCol };

    // Submit form and focus will be restored in enhance callback
    input.form?.requestSubmit();
  }

  function handleCheckboxKeyNav(event: KeyboardEvent, rowIndex: number, colIndex: number) {
    const key = event.key;
    let targetRow = rowIndex;
    let targetCol = colIndex;

    if (key === 'ArrowDown') {
      event.preventDefault();
      targetRow = Math.min(rowIndex + 1, data.rows.length - 1);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      targetRow = Math.max(rowIndex - 1, 0);
    } else if (key === 'ArrowRight') {
      event.preventDefault();
      // Move to next column, wrap to next row
      if (colIndex < columns.length - 1) {
        targetCol = colIndex + 1;
      } else if (rowIndex < data.rows.length - 1) {
        targetRow = rowIndex + 1;
        targetCol = 0;
      }
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      // Move to previous column, wrap to previous row
      if (colIndex > 0) {
        targetCol = colIndex - 1;
      } else if (rowIndex > 0) {
        targetRow = rowIndex - 1;
        targetCol = columns.length - 1;
      }
    } else if (key === 'Tab') {
      event.preventDefault();

      if (event.shiftKey) {
        // Shift+Tab: go to previous column, or previous row's last column
        if (colIndex > 0) {
          targetCol = colIndex - 1;
        } else if (rowIndex > 0) {
          targetRow = rowIndex - 1;
          targetCol = columns.length - 1;
        }
      } else {
        // Tab: go to next column, or next row's first column
        if (colIndex < columns.length - 1) {
          targetCol = colIndex + 1;
        } else if (rowIndex < data.rows.length - 1) {
          targetRow = rowIndex + 1;
          targetCol = 0;
        }
      }
    } else {
      // Let Space and Enter do default button behavior (submit)
      return;
    }

    // If not moving, do nothing
    if (targetRow === rowIndex && targetCol === colIndex) return;

    // Focus the target cell directly (no form submission needed for navigation)
    focusCellByCoords(targetRow, targetCol);
  }

  async function focusCellByCoords(row: number, col: number) {
    await tick();
    // Try numeric input first
    let targetEl = document.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    ) as HTMLElement;

    // If not found, try checkbox button
    if (!targetEl) {
      targetEl = document.querySelector(
        `[data-checkbox-row="${row}"][data-checkbox-col="${col}"]`
      ) as HTMLElement;
    }

    if (targetEl) {
      targetEl.focus();
      if (targetEl instanceof HTMLInputElement) {
        targetEl.select();
      }
    }
  }

  function handleCopyYesterday(date: string) {
    if (!data.yesterdayWalk) return;

    // Optimistic update
    if (!optimisticUpdates[date]) {
      optimisticUpdates[date] = {};
    }
    optimisticUpdates[date].walkDistance = data.yesterdayWalk.walkDistance;
    optimisticUpdates[date].walkIncline = data.yesterdayWalk.walkIncline;
  }

  const columns = [
    { key: 'weight', label: 'Weight', type: 'number', unit: 'lbs', step: '0.1' },
    { key: 'walkDistance', label: 'Walk', type: 'number', unit: 'mi', step: '0.01' },
    { key: 'walkIncline', label: 'Incline', type: 'number', unit: '%', step: '0.1' },
    { key: 'breakfast', label: 'Brkfst', type: 'boolean' },
    { key: 'brush', label: 'Brush', type: 'boolean' },
    { key: 'floss', label: 'Floss', type: 'boolean' },
    { key: 'shower', label: 'Shower', type: 'boolean' },
    { key: 'shake', label: 'Shake', type: 'boolean' },
  ];

  const habitColumns = columns.filter(c => c.type === 'boolean');

  // Get the column indices for numeric fields only (for tab navigation)
  const numericColIndices = columns
    .map((col, idx) => col.type === 'number' ? idx : -1)
    .filter(idx => idx !== -1);
</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold">Fitness & Morning Tracker</h1>

  </div>

  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-[var(--color-border)]">
          <th class="text-left py-3 px-2 text-[var(--color-text-muted)] font-medium w-24">Date</th>
          {#each columns as col}
            {@const streakKey = col.key === 'walkDistance' ? 'walk' : col.key}
            {@const streak = data.streaks[streakKey] || 0}
            <th class="text-center py-3 px-2 text-[var(--color-text-muted)] font-medium min-w-[70px]">
              <div class="flex flex-col items-center gap-0.5">
                <span>{col.label}</span>
                {#if streak > 0}
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded-full font-bold
                      {streak >= 7
                        ? 'bg-green-500/20 text-green-400'
                        : streak >= 3
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}"
                    title="{streak} day streak"
                  >
                    {col.key === 'walkDistance' ? '🚶' : '🔥'}{streak}
                  </span>
                {/if}
              </div>
            </th>
          {/each}
          <th class="w-10"></th>
        </tr>
      </thead>
      <tbody>
        {#each data.rows as row, rowIndex}
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

            {#each columns as col, colIndex}
              <td class="py-2 px-2 text-center">
                {#if row.isFuture}
                  <span class="text-[var(--color-text-muted)]">—</span>
                {:else if col.type === 'boolean'}
                  <form
                    method="POST"
                    action="?/updateField"
                    use:enhance={({ formData }) => {
                      // Capture the new value BEFORE optimistic update changes things
                      const currentValue = getDisplayValue(row, col.key);
                      const newValue = !currentValue;

                      // Override the form data with the correct value
                      formData.set('value', String(newValue));

                      // Now do optimistic update
                      if (!optimisticUpdates[row.date]) {
                        optimisticUpdates[row.date] = {};
                      }
                      optimisticUpdates[row.date][col.key] = newValue;

                      const currentRow = rowIndex;
                      const currentCol = colIndex;
                      return async ({ update }) => {
                        await update({ reset: false });
                        // Restore focus to same checkbox after toggle
                        await focusCell(currentRow, currentCol);
                      };
                    }}
                  >
                    <input type="hidden" name="date" value={row.date} />
                    <input type="hidden" name="field" value={col.key} />
                    <input type="hidden" name="value" value="" />
                    <button
                      type="submit"
                      data-checkbox-row={rowIndex}
                      data-checkbox-col={colIndex}
                      class="w-6 h-6 rounded border border-[var(--color-border)] flex items-center justify-center mx-auto hover:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1 focus:ring-offset-[var(--color-bg)] transition-colors {getDisplayValue(row, col.key) ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : ''}"
                      onkeydown={(e) => handleCheckboxKeyNav(e, rowIndex, colIndex)}
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
                        // Restore focus after update if we were navigating
                        if (restoreFocus) {
                          await focusCell(restoreFocus.row, restoreFocus.col);
                          restoreFocus = null;
                        }
                      };
                    }}
                  >
                    <input type="hidden" name="date" value={row.date} />
                    <input type="hidden" name="field" value={col.key} />
                    <input
                      type="number"
                      name="value"
                      step={col.step}
                      value={getDisplayValue(row, col.key) ?? ''}
                      placeholder="—"
                      data-row={rowIndex}
                      data-col={colIndex}
                      onblur={(e) => {
                        // Don't double-submit if keydown already handled it
                        if (restoreFocus) return;
                        const input = e.target as HTMLInputElement;
                        setOptimisticValue(row.date, col.key, input.value);
                        input.form?.requestSubmit();
                      }}
                      onkeydown={(e) => handleNumericKeyNav(e, rowIndex, colIndex)}
                      class="w-full max-w-[70px] bg-transparent border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-accent)] rounded px-2 py-1 text-center outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </form>
                {/if}
              </td>
            {/each}

            <!-- Copy yesterday button for today's row -->
            <td class="py-2 px-1">
              {#if row.isToday && data.yesterdayWalk && (data.yesterdayWalk.walkDistance || data.yesterdayWalk.walkIncline)}
                <form
                  method="POST"
                  action="?/copyYesterdayWalk"
                  use:enhance={() => {
                    handleCopyYesterday(row.date);
                    return async ({ update }) => {
                      await update({ reset: false });
                    };
                  }}
                >
                  <input type="hidden" name="date" value={row.date} />
                  <input type="hidden" name="walkDistance" value={data.yesterdayWalk.walkDistance ?? ''} />
                  <input type="hidden" name="walkIncline" value={data.yesterdayWalk.walkIncline ?? ''} />
                  <button
                    type="submit"
                    class="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
                    title="Copy yesterday's walk data ({data.yesterdayWalk.walkDistance}mi @ {data.yesterdayWalk.walkIncline}%)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </form>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="mt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
    <p>
      Click checkboxes to toggle • Click numbers to edit • ↑↓ to navigate • Future dates locked
    </p>
    {#if data.yesterdayWalk}
      <p class="text-xs">
        Yesterday: {data.yesterdayWalk.walkDistance}mi @ {data.yesterdayWalk.walkIncline}%
      </p>
    {/if}
  </div>
</div>
