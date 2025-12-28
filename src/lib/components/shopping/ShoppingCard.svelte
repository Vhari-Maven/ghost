<script lang="ts">
  import { enhance } from '$app/forms';
  import { ChevronLeft, ChevronRight, Edit, Trash } from '$lib/components/kanban/icons';
  import type { ShoppingItem, ShoppingStatus } from './types';
  import { SHOPPING_COLUMNS } from './types';

  type Props = {
    item: ShoppingItem;
    columnId: ShoppingStatus;
    isEditing: boolean;
    editTitle: string;
    editNotes: string;
    onStartEdit: (item: ShoppingItem) => void;
    onCancelEdit: () => void;
    onEditTitleChange: (value: string) => void;
    onEditNotesChange: (value: string) => void;
    onRequestDelete: (item: ShoppingItem) => void;
    isOrdered?: boolean;
  };

  let {
    item,
    columnId,
    isEditing,
    editTitle,
    editNotes,
    onStartEdit,
    onCancelEdit,
    onEditTitleChange,
    onEditNotesChange,
    onRequestDelete,
    isOrdered = false,
  }: Props = $props();

  const config = $derived(SHOPPING_COLUMNS[columnId]);
</script>

{#if isEditing}
  <form
    method="POST"
    action="?/updateItem"
    class="bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-lg p-3"
    use:enhance={() => {
      return async ({ update }) => {
        await update({ reset: false });
        onCancelEdit();
      };
    }}
  >
    <input type="hidden" name="itemId" value={item.id} />
    <!-- svelte-ignore a11y_autofocus -->
    <input
      type="text"
      name="title"
      value={editTitle}
      oninput={(e) => onEditTitleChange(e.currentTarget.value)}
      class="w-full bg-transparent border-none outline-none text-[var(--color-text)] font-medium mb-2"
      autofocus
    />
    <textarea
      name="notes"
      value={editNotes}
      oninput={(e) => onEditNotesChange(e.currentTarget.value)}
      placeholder="Notes (optional)"
      rows="2"
      class="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 outline-none text-sm text-[var(--color-text-muted)] resize-none focus:border-[var(--color-accent)]"
    ></textarea>

    <div class="flex gap-2 mt-3">
      <button
        type="submit"
        class="px-2 py-1 bg-[var(--color-accent)] text-white rounded text-xs font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
      >
        Save
      </button>
      <button
        type="button"
        onclick={onCancelEdit}
        class="px-2 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs transition-colors"
      >
        Cancel
      </button>
    </div>
  </form>
{:else}
  <div
    class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 hover:border-[var(--color-accent)]/50 transition-colors group cursor-grab active:cursor-grabbing"
    class:opacity-75={isOrdered}
  >
    <h3 class="font-medium text-[var(--color-text)] mb-1" class:line-through={isOrdered}>
      {item.title}
    </h3>

    {#if item.notes}
      <p class="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-2">
        {item.notes}
      </p>
    {/if}

    <div class="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
      <!-- Move buttons -->
      <div class="flex gap-1">
        {#if config.canMoveLeft}
          <form method="POST" action="?/moveItem" use:enhance>
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="status" value={config.leftTarget} />
            <input type="hidden" name="sortOrder" value="0" />
            <button
              type="submit"
              class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              title="Move back to To Buy"
            >
              <ChevronLeft />
            </button>
          </form>
        {/if}
        {#if config.canMoveRight}
          <form method="POST" action="?/moveItem" use:enhance>
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="status" value={config.rightTarget} />
            <input type="hidden" name="sortOrder" value="0" />
            <button
              type="submit"
              class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              title="Mark as Ordered"
            >
              <ChevronRight />
            </button>
          </form>
        {/if}
      </div>

      <!-- Edit / Delete buttons -->
      <div class="flex gap-1">
        <button
          type="button"
          onclick={() => onStartEdit(item)}
          class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          title="Edit"
        >
          <Edit />
        </button>
        <button
          type="button"
          onclick={() => onRequestDelete(item)}
          class="p-1 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash />
        </button>
      </div>
    </div>
  </div>
{/if}
