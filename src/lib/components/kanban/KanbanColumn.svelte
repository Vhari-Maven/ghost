<script lang="ts" generics="T extends BaseItem">
  import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Snippet } from 'svelte';
  import type { BaseItem, ColumnConfig, DndEventDetail } from './types';

  type Props = {
    columnConfig: ColumnConfig;
    items: T[];
    flipDurationMs?: number;
    showAll?: boolean;
    previewCount?: number;
    onItemsChange: (items: T[]) => void;
    onDndConsider: (e: CustomEvent<DndEventDetail<T>>) => void;
    onDndFinalize: (e: CustomEvent<DndEventDetail<T>>) => void;
    onToggleShowAll?: () => void;
    renderCard: Snippet<[T]>;
    addForm?: Snippet;
  };

  let {
    columnConfig,
    items,
    flipDurationMs = 200,
    showAll = false,
    previewCount = 5,
    onItemsChange,
    onDndConsider,
    onDndFinalize,
    onToggleShowAll,
    renderCard,
    addForm,
  }: Props = $props();

  const isCompletedColumn = columnConfig.isCompletedColumn ?? false;

  let displayedItems = $derived(
    isCompletedColumn && !showAll ? items.slice(0, previewCount) : items
  );

  let hiddenCount = $derived(
    isCompletedColumn ? Math.max(0, items.length - previewCount) : 0
  );
</script>

<div class="flex-1 min-w-[300px] max-w-[400px] flex flex-col">
  <!-- Column Header -->
  <div class="flex items-center justify-between mb-3 px-1">
    <h2 class="font-semibold text-[var(--color-text-muted)] uppercase text-sm tracking-wide">
      {columnConfig.title}
    </h2>
    <span class="text-xs bg-[var(--color-surface)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full">
      {items.length}
    </span>
  </div>

  <!-- Add form snippet -->
  {#if addForm}
    {@render addForm()}
  {/if}

  <!-- Drag-and-drop zone -->
  <div
    class="flex-1 bg-[var(--color-surface)]/30 rounded-lg p-2 space-y-2 overflow-y-auto min-h-[100px]"
    use:dndzone={{ items, flipDurationMs, dropTargetStyle: {} }}
    onconsider={(e) => onDndConsider(e)}
    onfinalize={(e) => onDndFinalize(e)}
  >
    {#each displayedItems as item (item.id)}
      <div animate:flip={{ duration: flipDurationMs }}>
        {@render renderCard(item)}
      </div>
    {/each}

    <!-- Show All / Show Less toggle for completed column -->
    {#if isCompletedColumn && hiddenCount > 0 && onToggleShowAll}
      <button
        type="button"
        onclick={onToggleShowAll}
        class="w-full py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        {showAll ? 'Show less' : `Show all (${items.length})`}
      </button>
    {/if}

    <!-- Empty state -->
    {#if items.length === 0}
      <div class="text-center py-8 text-[var(--color-text-muted)] text-sm">
        {columnConfig.emptyMessage ?? 'No items'}
      </div>
    {/if}
  </div>
</div>
