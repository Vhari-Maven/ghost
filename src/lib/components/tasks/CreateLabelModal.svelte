<script lang="ts">
  import { enhance } from '$app/forms';

  type Props = {
    isOpen: boolean;
    labelName: string;
    labelColor: string;
    onClose: () => void;
    onNameChange: (value: string) => void;
    onColorChange: (value: string) => void;
  };

  let {
    isOpen,
    labelName,
    labelColor,
    onClose,
    onNameChange,
    onColorChange,
  }: Props = $props();

  const LABEL_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
  ];
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onclick={onClose}
    role="dialog"
    aria-modal="true"
  >
    <form
      method="POST"
      action="?/createLabel"
      class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 w-80"
      onclick={(e) => e.stopPropagation()}
      use:enhance={() => {
        return async ({ update, result }) => {
          await update({ reset: false });
          if (result.type === 'success') {
            onClose();
          }
        };
      }}
    >
      <h3 class="font-semibold mb-3">Create New Label</h3>

      <input
        type="text"
        name="name"
        value={labelName}
        oninput={(e) => onNameChange(e.currentTarget.value)}
        placeholder="Label name"
        class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-3 py-2 mb-3 outline-none focus:border-[var(--color-accent)]"
        autofocus
      />

      <div class="mb-3">
        <p class="text-xs text-[var(--color-text-muted)] mb-2">Color</p>
        <div class="flex flex-wrap gap-2">
          {#each LABEL_COLORS as color}
            <button
              type="button"
              onclick={() => onColorChange(color)}
              class="w-6 h-6 rounded-full border-2 transition-transform {labelColor === color ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}"
              style="background-color: {color}"
            ></button>
          {/each}
        </div>
      </div>

      <input type="hidden" name="color" value={labelColor} />

      <div class="flex gap-2 justify-end">
        <button
          type="button"
          onclick={onClose}
          class="px-3 py-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!labelName.trim()}
          class="px-3 py-1.5 bg-[var(--color-accent)] text-white rounded text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Create
        </button>
      </div>
    </form>
  </div>
{/if}
