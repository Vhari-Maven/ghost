<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import GameCard from './GameCard.svelte';
  import type { Game } from './types';

  type Props = {
    games: Game[];
    flipDurationMs?: number;
    onDndConsider: (e: CustomEvent<{ items: Game[] }>) => void;
    onDndFinalize: (e: CustomEvent<{ items: Game[]; info: { source: string; trigger: string } }>) => void;
    onAddGame: (game: Game) => void; // Fallback click-to-add
  };

  let { games, flipDurationMs = 200, onDndConsider, onDndFinalize, onAddGame }: Props = $props();
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

  <!-- Drag-and-drop zone -->
  <div
    class="flex-1 rounded-b-lg p-1.5 space-y-1.5 overflow-y-auto min-h-[200px] bg-[var(--color-surface)]/50"
    use:dndzone={{ items: games, flipDurationMs, dropTargetStyle: {} }}
    onconsider={(e) => onDndConsider(e)}
    onfinalize={(e) => onDndFinalize(e)}
  >
    {#each games as game (game.id)}
      <div animate:flip={{ duration: flipDurationMs }}>
        <GameCard
          {game}
          onAdd={onAddGame}
        />
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
