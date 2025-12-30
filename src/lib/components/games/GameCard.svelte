<script lang="ts">
  import { Edit, Trash } from '$lib/components/kanban/icons';
  import type { Game } from './types';
  import { isUnrankedGame } from './types';

  type Props = {
    game: Game;
    rank?: number;
    loading?: boolean; // Show shimmer for metadata while creating
    onEdit?: (game: Game) => void;
    onDelete?: (game: Game) => void;
    onAdd?: (game: Game) => void; // For unranked games - click to add
  };

  let { game, rank, loading = false, onEdit, onDelete, onAdd }: Props = $props();

  // Unranked games have negative IDs and shouldn't show edit/delete
  let isUnranked = $derived(isUnrankedGame(game));

  // Format Unix timestamp as relative time
  function formatLastPlayed(timestamp: number | null): string {
    if (!timestamp) return '';
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    const hours = Math.floor(diff / 3600);
    const days = Math.floor(diff / 86400);
    const weeks = Math.floor(diff / 604800);
    const months = Math.floor(diff / 2592000);
    const years = Math.floor(diff / 31536000);

    if (years > 0) return `${years}y ago`;
    if (months > 0) return `${months}mo ago`;
    if (weeks > 0) return `${weeks}w ago`;
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'just now';
  }

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
  <!-- Action buttons (top right, on hover) - hidden while loading -->
  {#if !loading}
    <div class="absolute top-1 right-1 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      {#if isUnranked && onAdd}
        <!-- Add button for unranked games -->
        <button
          type="button"
          onclick={() => onAdd(game)}
          class="p-1 bg-[var(--color-accent)] rounded text-white text-xs font-bold"
          title="Add to tier list"
        >
          +
        </button>
      {:else if !isUnranked && onEdit && onDelete}
        <!-- Edit / Delete buttons for ranked games -->
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
      {/if}
    </div>
  {/if}

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
      {#if isUnranked && game.playtimeHours}
        <!-- Playtime badge for unranked games -->
        <span class="absolute top-1 left-1 text-[10px] font-mono font-bold text-[var(--color-text-muted)] bg-black/80 px-1.5 py-0.5 rounded">
          {game.playtimeHours}h
        </span>
      {:else if rank}
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

    {#if loading}
      <!-- Shimmer placeholder for metadata while creating -->
      <div class="mt-1 h-4 w-24 rounded shimmer"></div>
    {:else if isUnranked && game.lastPlayed}
      <!-- Last played for unranked games -->
      <p class="text-[10px] text-[var(--color-text-muted)] mt-0.5">
        {formatLastPlayed(game.lastPlayed)}
      </p>
    {:else if game.genre || game.releaseYear}
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
