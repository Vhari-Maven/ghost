<script lang="ts">
  import type { UnrankedGame } from '../../../routes/games/+page.server';

  type Props = {
    games: UnrankedGame[];
    onAddGame: (game: UnrankedGame) => void;
  };

  let { games, onAddGame }: Props = $props();

  // Track image load state per game
  let imageStates = $state<Record<number, { loaded: boolean; error: boolean }>>({});

  // Return existing state or default - don't mutate during render
  function getImageState(appid: number) {
    return imageStates[appid] ?? { loaded: false, error: false };
  }

  // Format Unix timestamp as relative time
  function formatLastPlayed(timestamp: number | null): string {
    if (!timestamp) return '';
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60);
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
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }
</script>

<div class="flex-shrink-0 w-[180px] flex flex-col h-full">
  <!-- Column Header -->
  <div
    class="flex items-center justify-between mb-2 px-2 py-1.5 rounded-t-lg bg-[var(--color-surface)]"
  >
    <h2 class="font-bold text-lg text-[var(--color-text-muted)]">
      Unranked
    </h2>
    <span
      class="text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--color-text-muted)]/20 text-[var(--color-text-muted)]"
    >
      {games.length}
    </span>
  </div>

  <!-- Games list -->
  <div
    class="flex-1 rounded-b-lg p-1.5 space-y-1.5 overflow-y-auto min-h-[200px] custom-scrollbar bg-[var(--color-surface)]/50"
  >
    {#each games as game (game.appid)}
      {@const imgState = getImageState(game.appid)}
      <div
        class="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden hover:border-[var(--color-accent)]/50 transition-colors group"
      >
        <!-- Add button (on hover) -->
        <button
          type="button"
          onclick={() => onAddGame(game)}
          class="absolute top-1 right-1 z-10 p-1 bg-[var(--color-accent)] rounded text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
          title="Add to tier list"
        >
          +
        </button>

        <!-- Cover Image -->
        <div class="relative w-full aspect-[460/215] bg-[var(--color-bg)] overflow-hidden">
          {#if !imgState.loaded}
            <div class="absolute inset-0 shimmer"></div>
          {/if}
          {#if !imgState.error}
            <img
              src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{game.appid}/header.jpg"
              alt=""
              class="w-full h-full object-cover transition-opacity duration-200"
              class:opacity-0={!imgState.loaded}
              class:opacity-100={imgState.loaded}
              onload={() => (imageStates[game.appid] = { loaded: true, error: false })}
              onerror={() => (imageStates[game.appid] = { loaded: true, error: true })}
            />
          {/if}
          <!-- Playtime badge -->
          <span class="absolute top-1 left-1 text-[10px] font-mono font-bold text-[var(--color-text-muted)] bg-black/80 px-1.5 py-0.5 rounded">
            {game.playtimeHours}h
          </span>
        </div>

        <div class="p-2">
          <h3 class="font-medium text-[var(--color-text)] text-sm leading-tight">
            {game.name}
          </h3>
          {#if game.lastPlayed}
            <p class="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              {formatLastPlayed(game.lastPlayed)}
            </p>
          {/if}
        </div>
      </div>
    {/each}

    <!-- Empty state -->
    {#if games.length === 0}
      <div class="text-center py-6 text-[var(--color-text-muted)] text-xs">
        All caught up!
      </div>
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
