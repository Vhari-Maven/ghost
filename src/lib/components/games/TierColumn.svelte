<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import GameCard from './GameCard.svelte';
  import type { Game, GameTier, TierConfig } from './types';
  import { TIER_CONFIGS } from './types';

  type Props = {
    tierId: GameTier;
    games: Game[];
    rankOffset?: number; // Number of games before this tier (for global rank display)
    flipDurationMs?: number;
    onDndConsider: (tierId: GameTier, e: CustomEvent<{ items: Game[] }>) => void;
    onDndFinalize: (tierId: GameTier, e: CustomEvent<{ items: Game[]; info: { source: string; trigger: string } }>) => void;
    onEditGame: (game: Game) => void;
    onDeleteGame: (game: Game) => void;
  };

  let {
    tierId,
    games,
    rankOffset = 0,
    flipDurationMs = 200,
    onDndConsider,
    onDndFinalize,
    onEditGame,
    onDeleteGame,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const config: TierConfig = TIER_CONFIGS[tierId];
</script>

<div class="flex-shrink-0 w-[180px] flex flex-col h-full">
  <!-- Column Header -->
  <div
    class="flex items-center justify-between mb-2 px-2 py-1.5 rounded-t-lg"
    style="background-color: {config.bgColor}"
  >
    <h2
      class="font-bold text-lg"
      style="color: {config.color}"
    >
      {config.title}
    </h2>
    <span
      class="text-xs px-2 py-0.5 rounded-full font-medium"
      style="background-color: {config.color}30; color: {config.color}"
    >
      {games.length}
    </span>
  </div>

  <!-- Drag-and-drop zone -->
  <div
    class="flex-1 rounded-b-lg p-1.5 space-y-1.5 overflow-y-auto min-h-[200px] custom-scrollbar"
    style="background-color: {config.bgColor}"
    use:dndzone={{ items: games, flipDurationMs, dropTargetStyle: {} }}
    onconsider={(e) => onDndConsider(tierId, e)}
    onfinalize={(e) => onDndFinalize(tierId, e)}
  >
    {#each games as game, index (game.id)}
      <div animate:flip={{ duration: flipDurationMs }}>
        <GameCard
          {game}
          rank={rankOffset + index + 1}
          onEdit={onEditGame}
          onDelete={onDeleteGame}
        />
      </div>
    {/each}

    <!-- Empty state -->
    {#if games.length === 0}
      <div class="text-center py-6 text-[var(--color-text-muted)] text-xs">
        No games
      </div>
    {/if}
  </div>
</div>
