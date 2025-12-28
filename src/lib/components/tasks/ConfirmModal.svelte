<script lang="ts">
  import { enhance } from '$app/forms';
  import { Trash } from '$lib/components/kanban/icons';

  type Props = {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning';
    formAction?: string;
    formData?: Record<string, string | number>;
    onConfirm?: () => void;
    onCancel: () => void;
  };

  let {
    isOpen,
    title,
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    variant = 'danger',
    formAction,
    formData,
    onConfirm,
    onCancel,
  }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
    onclick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    onkeydown={(e) => { if (e.key === 'Escape') onCancel(); }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <div
      class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 w-[400px] shadow-2xl animate-scale-in"
    >
      <!-- Icon -->
      <div class="flex justify-center mb-4">
        <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          <Trash class="w-6 h-6 text-red-400" />
        </div>
      </div>

      <!-- Title -->
      <h3
        id="modal-title"
        class="text-lg font-semibold text-center text-[var(--color-text)] mb-2"
      >
        {title}
      </h3>

      <!-- Message -->
      <p class="text-sm text-[var(--color-text-muted)] text-center mb-6">
        {message}
      </p>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          type="button"
          onclick={onCancel}
          class="flex-1 px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded-lg text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
        >
          {cancelText}
        </button>

        {#if formAction}
          <form
            method="POST"
            action={formAction}
            class="flex-1"
            use:enhance={() => {
              return async ({ update }) => {
                await update({ reset: false });
                onCancel();
              };
            }}
          >
            {#if formData}
              {#each Object.entries(formData) as [key, value]}
                <input type="hidden" name={key} {value} />
              {/each}
            {/if}
            <button
              type="submit"
              class="w-full px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              {confirmText}
            </button>
          </form>
        {:else}
          <button
            type="button"
            onclick={onConfirm}
            class="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            {confirmText}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.15s ease-out;
  }

  .animate-scale-in {
    animation: scale-in 0.15s ease-out;
  }
</style>
