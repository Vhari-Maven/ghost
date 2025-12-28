<script lang="ts">
  import { Edit, Trash } from '$lib/components/kanban/icons';
  import type { Game } from './types';

  type Props = {
    game: Game;
    rank?: number;
    onEdit: (game: Game) => void;
    onDelete: (game: Game) => void;
  };

  let { game, rank, onEdit, onDelete }: Props = $props();
</script>

<div
  class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-2 hover:border-[var(--color-accent)]/50 transition-colors group cursor-grab active:cursor-grabbing"
>
  <div class="flex items-start gap-2">
    {#if rank}
      <span class="text-[10px] font-mono font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/15 px-1.5 py-0.5 rounded shrink-0">
        {rank}
      </span>
    {/if}
    <h3 class="font-medium text-[var(--color-text)] text-sm leading-tight">
      {game.name}
    </h3>
  </div>

  {#if game.genre || game.releaseYear}
    <p class="text-xs text-[var(--color-text-muted)] mt-1">
      {#if game.genre}{game.genre}{/if}
      {#if game.genre && game.releaseYear} &middot; {/if}
      {#if game.releaseYear}{game.releaseYear}{/if}
    </p>
  {/if}

  {#if game.comment}
    <p class="text-xs text-[var(--color-accent)] mt-1 italic">
      {game.comment}
    </p>
  {/if}

  <!-- Edit / Delete buttons (on hover) -->
  <div class="flex justify-end gap-1 mt-2 pt-1 border-t border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      type="button"
      onclick={() => onEdit(game)}
      class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      title="Edit"
    >
      <Edit />
    </button>
    <button
      type="button"
      onclick={() => onDelete(game)}
      class="p-1 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
      title="Delete"
    >
      <Trash />
    </button>
  </div>
</div>
