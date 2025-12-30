<script lang="ts">
  import type { PageData } from './$types';
  import { SOURCES, TRIGGERS } from 'svelte-dnd-action';
  import { deserialize } from '$app/forms';
  import { ConfirmModal } from '$lib/components/kanban';
  import {
    TierColumn,
    UnrankedColumn,
    AddGameModal,
    EditGameModal,
    TIER_ORDER,
    isUnrankedGame,
    type Game,
    type GameTier,
  } from '$lib/components/games';

  let { data }: { data: PageData } = $props();

  // ─────────────────────────────────────────────────────────────────────────────
  // Game State (per tier + unranked)
  // ─────────────────────────────────────────────────────────────────────────────

  // Local state for each tier - initialized from server data
  // svelte-ignore state_referenced_locally
  let tierGames = $state<Record<GameTier, Game[]>>({
    S: [...data.gamesByTier.S] as Game[],
    'A+': [...data.gamesByTier['A+']] as Game[],
    A: [...data.gamesByTier.A] as Game[],
    'A-': [...data.gamesByTier['A-']] as Game[],
    'B+': [...data.gamesByTier['B+']] as Game[],
    B: [...data.gamesByTier.B] as Game[],
    'B-': [...data.gamesByTier['B-']] as Game[],
    'C+': [...data.gamesByTier['C+']] as Game[],
    C: [...data.gamesByTier.C] as Game[],
  });

  // Local state for unranked games (now Game[] with negative IDs)
  // svelte-ignore state_referenced_locally
  let unrankedGames = $state<Game[]>([...data.unrankedGames]);

  // Track last known data reference to detect actual page navigations/reloads
  // svelte-ignore state_referenced_locally
  let lastDataRef = data;

  // Only sync when the data object itself changes (navigation/reload)
  $effect.pre(() => {
    if (data !== lastDataRef) {
      lastDataRef = data;
      tierGames = {
        S: [...data.gamesByTier.S] as Game[],
        'A+': [...data.gamesByTier['A+']] as Game[],
        A: [...data.gamesByTier.A] as Game[],
        'A-': [...data.gamesByTier['A-']] as Game[],
        'B+': [...data.gamesByTier['B+']] as Game[],
        B: [...data.gamesByTier.B] as Game[],
        'B-': [...data.gamesByTier['B-']] as Game[],
        'C+': [...data.gamesByTier['C+']] as Game[],
        C: [...data.gamesByTier.C] as Game[],
      };
      unrankedGames = [...data.unrankedGames];
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UI State
  // ─────────────────────────────────────────────────────────────────────────────

  let showAddModal = $state(false);
  let addModalPrefill = $state<{ name: string; steamAppId: string } | null>(null);
  let editingGame = $state<Game | null>(null);
  let gameToDelete = $state<Game | null>(null);

  // Track games being created (to show loading state)
  let pendingGameIds = $state(new Set<number>());

  const flipDurationMs = 200;

  // Total game count (excludes unranked)
  let totalGames = $derived(
    Object.values(tierGames).reduce((sum, games) => sum + games.length, 0)
  );

  // Calculate rank offsets for each tier (cumulative count of games before each tier)
  let tierRankOffsets = $derived(() => {
    const offsets: Record<GameTier, number> = {} as Record<GameTier, number>;
    let cumulative = 0;
    for (const tier of TIER_ORDER) {
      offsets[tier] = cumulative;
      cumulative += tierGames[tier].length;
    }
    return offsets;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Edit/Delete Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  function handleEditGame(game: Game) {
    // Don't allow editing unranked games (not yet in DB)
    if (isUnrankedGame(game)) return;
    editingGame = game;
  }

  function handleDeleteGame(game: Game) {
    // Don't allow deleting unranked games (not yet in DB)
    if (isUnrankedGame(game)) return;
    gameToDelete = game;
  }

  function closeEditModal() {
    editingGame = null;
  }

  function closeDeleteModal() {
    gameToDelete = null;
  }

  function closeAddModal() {
    showAddModal = false;
    addModalPrefill = null;
  }

  function handleGameAdded(steamAppId: string | null) {
    // Remove the game from unranked list if it was added from there
    if (steamAppId) {
      unrankedGames = unrankedGames.filter((g) => g.steamAppId !== steamAppId);
    }
    closeAddModal();
  }

  // Click-to-add fallback for unranked games
  function handleAddFromUnranked(game: Game) {
    addModalPrefill = {
      name: game.name,
      steamAppId: game.steamAppId!,
    };
    showAddModal = true;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Drag and Drop Handlers (Tier Columns)
  // ─────────────────────────────────────────────────────────────────────────────

  function handleDndConsider(tierId: GameTier, e: CustomEvent<{ items: Game[] }>) {
    tierGames[tierId] = e.detail.items;
  }

  function handleDndFinalize(
    tierId: GameTier,
    e: CustomEvent<{ items: Game[]; info: { source: string; trigger: string } }>
  ) {
    const { items, info } = e.detail;
    tierGames[tierId] = items;

    // Only persist if this was a drop (not just a cancel)
    if (info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED_INTO_ZONE) {
      persistTierOrder(tierId, items);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Drag and Drop Handlers (Unranked Column)
  // ─────────────────────────────────────────────────────────────────────────────

  function handleUnrankedConsider(e: CustomEvent<{ items: Game[] }>) {
    unrankedGames = e.detail.items;
  }

  function handleUnrankedFinalize(
    e: CustomEvent<{ items: Game[]; info: { source: string; trigger: string } }>
  ) {
    const { items, info } = e.detail;

    // Check for ranked games dropped into unranked
    const rankedGamesDropped = items.filter((g) => !isUnrankedGame(g));

    if (rankedGamesDropped.length > 0 && info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED_INTO_ZONE) {
      // Process each ranked game dropped into unranked
      const transformedItems = items.map((game) => {
        if (!isUnrankedGame(game) && game.steamAppId) {
          // Delete from DB (fire and forget)
          const formData = new FormData();
          formData.append('gameId', String(game.id));
          fetch('?/deleteGame', { method: 'POST', body: formData });

          // Transform to unranked game (negative ID based on steamAppId)
          const appId = parseInt(game.steamAppId, 10);
          return {
            ...game,
            id: -appId,
            tier: 'unranked',
          };
        }
        return game;
      });

      // Filter out non-Steam ranked games (they can't become unranked)
      unrankedGames = transformedItems.filter((g) => isUnrankedGame(g));
    } else {
      unrankedGames = items;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Persistence
  // ─────────────────────────────────────────────────────────────────────────────

  async function persistTierOrder(tierId: GameTier, items: Game[]) {
    // Separate unranked (negative ID) and existing games
    const unranked = items.filter(isUnrankedGame);
    const existing = items.filter((g) => !isUnrankedGame(g));

    // Create unranked games first (they were dragged from Unranked column)
    for (const game of unranked) {
      // Skip if already being created
      if (pendingGameIds.has(game.id)) continue;
      pendingGameIds.add(game.id);
      pendingGameIds = new Set(pendingGameIds); // Trigger reactivity

      try {
        const formData = new FormData();
        formData.append('name', game.name);
        formData.append('tier', tierId);
        formData.append('steamAppId', game.steamAppId!);

        const response = await fetch('?/createGame', {
          method: 'POST',
          body: formData,
        });

        const result = deserialize(await response.text());
        const gameData = result.type === 'success' ? (result.data as { game?: Game })?.game : null;

        if (gameData) {
          // Replace the unranked game with the real game in tierGames
          const realGame: Game = {
            id: gameData.id,
            name: gameData.name,
            genre: gameData.genre,
            tier: tierId,
            releaseYear: gameData.releaseYear,
            comment: gameData.comment,
            steamAppId: gameData.steamAppId,
            coverUrl: gameData.coverUrl,
            sortOrder: items.indexOf(game),
            createdAt: gameData.createdAt,
            updatedAt: gameData.updatedAt,
          };

          tierGames[tierId] = tierGames[tierId].map((g) =>
            g.id === game.id ? realGame : g
          );
        }
      } catch (error) {
        console.error('Failed to create game:', error);
        // Restore to unranked on error
        tierGames[tierId] = tierGames[tierId].filter((g) => g.id !== game.id);
        unrankedGames = [...unrankedGames, game];
      } finally {
        pendingGameIds.delete(game.id);
        pendingGameIds = new Set(pendingGameIds);
      }
    }

    // Move existing games that changed tiers
    for (let i = 0; i < existing.length; i++) {
      const game = existing[i];
      if (game.tier !== tierId) {
        const formData = new FormData();
        formData.append('gameId', String(game.id));
        formData.append('tier', tierId);
        formData.append('sortOrder', String(i));

        await fetch('?/moveGame', {
          method: 'POST',
          body: formData,
        });

        // Update local tier
        game.tier = tierId;
      }
    }

    // Reorder all real games in the tier
    const realGames = tierGames[tierId].filter((g) => !isUnrankedGame(g));
    if (realGames.length > 0) {
      const formData = new FormData();
      formData.append('gameIds', JSON.stringify(realGames.map((g) => g.id)));

      await fetch('?/reorderTier', {
        method: 'POST',
        body: formData,
      });
    }
  }
</script>

<div class="h-[calc(100vh-120px)] flex flex-col">
  <!-- Header -->
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-bold flex items-center gap-3">
      <img src="/icon-games.svg" alt="" class="w-8 h-8" />
      Games
      <span class="text-sm font-normal text-[var(--color-text-muted)]">
        ({totalGames} games)
      </span>
    </h1>
    <button
      type="button"
      onclick={() => (showAddModal = true)}
      class="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-2"
    >
      <span class="text-lg">+</span>
      Add Game
    </button>
  </div>

  <!-- Tier Board -->
  <div class="flex-1 flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
    {#each TIER_ORDER as tierId}
      <TierColumn
        {tierId}
        games={tierGames[tierId]}
        rankOffset={tierRankOffsets()[tierId]}
        {flipDurationMs}
        pendingIds={pendingGameIds}
        onDndConsider={handleDndConsider}
        onDndFinalize={handleDndFinalize}
        onEditGame={handleEditGame}
        onDeleteGame={handleDeleteGame}
      />
    {/each}

    <!-- Separator -->
    <div class="flex-shrink-0 w-px bg-[var(--color-border)] mx-2"></div>

    <!-- Unranked games from Steam library -->
    <UnrankedColumn
      games={unrankedGames}
      {flipDurationMs}
      onDndConsider={handleUnrankedConsider}
      onDndFinalize={handleUnrankedFinalize}
      onAddGame={handleAddFromUnranked}
    />
  </div>

  <!-- Footer hint -->
  <div class="mt-2 text-xs text-[var(--color-text-muted)]">
    Drag games between tiers to change ratings • Drag from Unranked to add games
  </div>
</div>

<!-- Add Game Modal -->
<AddGameModal
  isOpen={showAddModal}
  onClose={closeAddModal}
  onSuccess={handleGameAdded}
  prefill={addModalPrefill}
/>

<!-- Edit Game Modal -->
<EditGameModal
  isOpen={editingGame !== null}
  game={editingGame}
  onClose={closeEditModal}
/>

<!-- Delete Confirmation Modal -->
<ConfirmModal
  isOpen={gameToDelete !== null}
  title="Delete Game"
  message="Are you sure you want to delete this game? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  formAction="?/deleteGame"
  formData={gameToDelete ? { gameId: gameToDelete.id } : undefined}
  onCancel={closeDeleteModal}
/>
