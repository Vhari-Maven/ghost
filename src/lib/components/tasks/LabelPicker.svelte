<script lang="ts">
  import { Tag } from './icons';
  import type { TaskLabel } from './types';

  type Props = {
    labels: TaskLabel[];
    selectedIds: number[];
    isOpen: boolean;
    onToggle: () => void;
    onSelectLabel: (labelId: number) => void;
    onCreateNew: () => void;
  };

  let {
    labels,
    selectedIds,
    isOpen,
    onToggle,
    onSelectLabel,
    onCreateNew,
  }: Props = $props();
</script>

<div class="mt-2">
  <button
    type="button"
    onclick={onToggle}
    class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1"
  >
    <Tag />
    Labels
    {#if selectedIds.length > 0}
      <span class="bg-[var(--color-accent)] text-white text-[10px] px-1.5 rounded-full">
        {selectedIds.length}
      </span>
    {/if}
  </button>

  {#if isOpen}
    <div class="mt-2 p-2 bg-[var(--color-bg)] rounded border border-[var(--color-border)]">
      <div class="flex flex-wrap gap-1 mb-2">
        {#each labels as label}
          <button
            type="button"
            onclick={() => onSelectLabel(label.id)}
            class="px-2 py-0.5 text-xs rounded-full border transition-colors {selectedIds.includes(label.id)
              ? 'border-transparent'
              : 'border-[var(--color-border)] opacity-60 hover:opacity-100'}"
            style="background-color: {label.color}20; color: {label.color}; {selectedIds.includes(label.id) ? `background-color: ${label.color}40` : ''}"
          >
            {label.name}
          </button>
        {/each}
      </div>
      <button
        type="button"
        onclick={onCreateNew}
        class="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
      >
        + New label
      </button>
    </div>
  {/if}
</div>
