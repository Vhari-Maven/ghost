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

  // Cover image URL: Steam header if available, otherwise custom coverUrl
  let coverImageUrl = $derived(
    game.steamAppId
      ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/header.jpg`
      : game.coverUrl
  );

  // IGDB covers are portrait - show top portion (usually has logo/title)
  let isPortraitCover = $derived(!game.steamAppId && game.coverUrl);

  // Track image load state
  let imageLoaded = $state(false);
  let imageError = $state(false);
</script>

<div
  class="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden hover:border-[var(--color-accent)]/50 transition-colors group cursor-grab active:cursor-grabbing"
>
  <!-- Edit / Delete buttons (top right, on hover) -->
  <div class="absolute top-1 right-1 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      type="button"
      onclick={() => onEdit(game)}
      class="p-1 bg-black/80 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      title="Edit"
    >
      <Edit />
    </button>
    <button
      type="button"
      onclick={() => onDelete(game)}
      class="p-1 bg-black/80 rounded text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
      title="Delete"
    >
      <Trash />
    </button>
  </div>

  <!-- Cover Image -->
  {#if coverImageUrl && !imageError}
    <div class="relative w-full aspect-[460/215] bg-[var(--color-bg)] overflow-hidden">
      <!-- Shimmer placeholder while loading -->
      {#if !imageLoaded}
        <div class="absolute inset-0 shimmer"></div>
      {/if}
      <img
        src={coverImageUrl}
        alt=""
        class="w-full h-full object-cover transition-opacity duration-200"
        class:opacity-0={!imageLoaded}
        class:opacity-100={imageLoaded}
        class:object-top={isPortraitCover}
        onload={() => (imageLoaded = true)}
        onerror={() => (imageError = true)}
      />
      {#if rank}
        <span class="absolute top-1 left-1 text-[10px] font-mono font-bold text-[var(--color-accent)] bg-black/90 border border-[var(--color-accent)]/50 px-1.5 py-0.5 rounded shadow-lg">
          {rank}
        </span>
      {/if}
    </div>
  {/if}

  <div class="p-2">
    <!-- Title row (with rank if no image) -->
    <div class="flex items-start gap-2">
      {#if rank && (!coverImageUrl || imageError)}
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
  </div>
</div>

<style>
  .shimmer {
    background: linear-gradient(
      90deg,
      var(--color-bg) 0%,
      var(--color-surface) 50%,
      var(--color-bg) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>
