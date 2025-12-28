<script lang="ts">
  import { enhance } from '$app/forms';
  import type { GameTier } from './types';
  import { TIER_ORDER, TIER_CONFIGS } from './types';

  type Prefill = {
    name?: string;
    steamAppId?: string;
  };

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    prefill?: Prefill | null;
  };

  let { isOpen, onClose, prefill = null }: Props = $props();

  let name = $state('');
  let genre = $state('');
  let tier = $state<GameTier>('B');
  let releaseYear = $state('');
  let comment = $state('');
  let steamAppId = $state('');

  // Apply prefill values when modal opens with prefill data
  $effect(() => {
    if (isOpen && prefill) {
      name = prefill.name ?? '';
      steamAppId = prefill.steamAppId ?? '';
    }
  });

  function resetForm() {
    name = '';
    genre = '';
    tier = 'B';
    releaseYear = '';
    comment = '';
    steamAppId = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
    onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 w-[450px] shadow-2xl animate-scale-in">
      <h3 id="modal-title" class="text-lg font-semibold text-[var(--color-text)] mb-4">
        Add Game
      </h3>

      <form
        method="POST"
        action="?/createGame"
        use:enhance={() => {
          return async ({ update, result }) => {
            await update({ reset: false });
            if (result.type === 'success') {
              resetForm();
              onClose();
            }
          };
        }}
      >
        <!-- Name (required) -->
        <div class="mb-4">
          <label for="name" class="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Name <span class="text-red-400">*</span>
          </label>
          <!-- svelte-ignore a11y_autofocus -->
          <input
            type="text"
            id="name"
            name="name"
            bind:value={name}
            required
            autofocus
            class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
            placeholder="Game name"
          />
        </div>

        <!-- Tier -->
        <div class="mb-4">
          <label for="tier" class="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Tier
          </label>
          <select
            id="tier"
            name="tier"
            bind:value={tier}
            class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            {#each TIER_ORDER as t}
              <option value={t} style="color: {TIER_CONFIGS[t].color}">
                {t} tier
              </option>
            {/each}
          </select>
        </div>

        <!-- Genre -->
        <div class="mb-4">
          <label for="genre" class="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Genre
          </label>
          <input
            type="text"
            id="genre"
            name="genre"
            bind:value={genre}
            class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
            placeholder="e.g., Action RPG"
          />
        </div>

        <!-- Release Year -->
        <div class="mb-4">
          <label for="releaseYear" class="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Release Year
          </label>
          <input
            type="number"
            id="releaseYear"
            name="releaseYear"
            bind:value={releaseYear}
            min="1970"
            max="2100"
            class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
            placeholder="e.g., 2023"
          />
        </div>

        <!-- Comment -->
        <div class="mb-4">
          <label for="comment" class="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Comment
          </label>
          <input
            type="text"
            id="comment"
            name="comment"
            bind:value={comment}
            class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
            placeholder="Optional notes"
          />
        </div>

        <!-- Steam App ID -->
        <div class="mb-6">
          <label for="steamAppId" class="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Steam App ID
          </label>
          <input
            type="text"
            id="steamAppId"
            name="steamAppId"
            bind:value={steamAppId}
            class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
            placeholder="e.g., 427520"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="button"
            onclick={onClose}
            class="flex-1 px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded-lg text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="flex-1 px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Add Game
          </button>
        </div>
      </form>
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
