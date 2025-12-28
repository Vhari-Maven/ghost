<script lang="ts">
  import type { PageData } from './$types';
  import type { UnrankedGame } from './+page.server';
  import { SOURCES, TRIGGERS } from 'svelte-dnd-action';
  import { ConfirmModal } from '$lib/components/kanban';
  import {
    TierColumn,
    UnrankedColumn,
    AddGameModal,
    EditGameModal,
    TIER_ORDER,
    type Game,
    type GameTier,
  } from '$lib/components/games';

  let { data }: { data: PageData } = $props();

  // ─────────────────────────────────────────────────────────────────────────────
  // Game State (per tier)
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

  // Local state for unranked games - allows optimistic removal when adding
  // svelte-ignore state_referenced_locally
  let unrankedGames = $state<UnrankedGame[]>([...data.unrankedGames]);

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

  const flipDurationMs = 200;

  // Total game count
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
    editingGame = game;
  }

  function handleDeleteGame(game: Game) {
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
      unrankedGames = unrankedGames.filter((g) => String(g.appid) !== steamAppId);
    }
    closeAddModal();
  }

  function handleAddFromUnranked(game: UnrankedGame) {
    addModalPrefill = {
      name: game.name,
      steamAppId: String(game.appid),
    };
    showAddModal = true;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Drag and Drop Handlers
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

  async function persistTierOrder(tierId: GameTier, items: Game[]) {
    // First, update tier for any games that changed tiers
    for (let i = 0; i < items.length; i++) {
      const game = items[i];
      if (game.tier !== tierId) {
        const formData = new FormData();
        formData.append('gameId', String(game.id));
        formData.append('tier', tierId);
        formData.append('sortOrder', String(i));

        await fetch('?/moveGame', {
          method: 'POST',
          body: formData,
        });

        // Update local tier so subsequent operations know the new tier
        game.tier = tierId;
      }
    }

    // Then persist the tier order
    const formData = new FormData();
    formData.append('gameIds', JSON.stringify(items.map((g) => g.id)));

    await fetch('?/reorderTier', {
      method: 'POST',
      body: formData,
    });
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
      onAddGame={handleAddFromUnranked}
    />
  </div>

  <!-- Footer hint -->
  <div class="mt-2 text-xs text-[var(--color-text-muted)]">
    Drag games between tiers to change ratings • Click + on unranked games to add them
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
