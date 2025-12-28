<script lang="ts">
  import { enhance } from '$app/forms';
  import { Plus } from '$lib/components/kanban/icons';

  type Props = {
    isOpen: boolean;
    title: string;
    notes: string;
    onToggleForm: () => void;
    onTitleChange: (value: string) => void;
    onNotesChange: (value: string) => void;
    onReset: () => void;
    onItemCreated?: () => void;
  };

  let {
    isOpen,
    title,
    notes,
    onToggleForm,
    onTitleChange,
    onNotesChange,
    onReset,
    onItemCreated,
  }: Props = $props();

  let titleInput: HTMLInputElement | undefined = $state();
</script>

<div class="mb-2">
  {#if isOpen}
    <form
      method="POST"
      action="?/createItem"
      class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3"
      use:enhance={() => {
        return async ({ update }) => {
          await update({ reset: false });
          if (onItemCreated) {
            onItemCreated();
            // Refocus the title input for rapid entry
            setTimeout(() => titleInput?.focus(), 0);
          } else {
            onReset();
          }
        };
      }}
    >
      <!-- svelte-ignore a11y_autofocus -->
      <input
        bind:this={titleInput}
        type="text"
        name="title"
        value={title}
        oninput={(e) => onTitleChange(e.currentTarget.value)}
        placeholder="Item name..."
        class="w-full bg-transparent border-none outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] font-medium mb-2"
        autofocus
      />

      <textarea
        name="notes"
        value={notes}
        oninput={(e) => onNotesChange(e.currentTarget.value)}
        placeholder="Notes (brand, size, link...)"
        rows="2"
        class="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 outline-none text-sm text-[var(--color-text-muted)] placeholder-[var(--color-border)] resize-none focus:border-[var(--color-accent)]"
      ></textarea>

      <div class="flex gap-2 mt-3">
        <button
          type="submit"
          disabled={!title.trim()}
          class="px-3 py-1 bg-[var(--color-accent)] text-white rounded text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onclick={onReset}
          class="px-3 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  {:else}
    <button
      onclick={onToggleForm}
      class="w-full p-3 border border-dashed border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors text-sm flex items-center justify-center gap-2"
    >
      <Plus />
      Add item
    </button>
  {/if}
</div>
