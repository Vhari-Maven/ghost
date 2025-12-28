import type { PageServerLoad, Actions } from './$types';
import {
  getGamesByTier,
  createGame,
  updateGame,
  deleteGame,
  moveGame,
  reorderTier,
  isValidTier,
  parseGameId,
  parseYear,
} from '$lib/services/games';

export const load: PageServerLoad = async () => {
  const gamesByTier = await getGamesByTier();
  return { gamesByTier };
};

export const actions: Actions = {
  createGame: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const genre = formData.get('genre') as string | null;
    const tier = formData.get('tier') as string;
    const releaseYearStr = formData.get('releaseYear') as string | null;
    const comment = formData.get('comment') as string | null;
    const steamAppId = formData.get('steamAppId') as string | null;

    if (!name?.trim()) {
      return { success: false, error: 'Name is required' };
    }

    if (!isValidTier(tier)) {
      return { success: false, error: 'Invalid tier' };
    }

    const result = await createGame({
      name,
      genre,
      tier,
      releaseYear: parseYear(releaseYearStr),
      comment,
      steamAppId,
    });

    return { success: true, gameId: result.gameId };
  },

  updateGame: async ({ request }) => {
    const formData = await request.formData();
    const gameId = parseGameId(formData.get('gameId') as string);
    const name = formData.get('name') as string;
    const genre = formData.get('genre') as string | null;
    const releaseYearStr = formData.get('releaseYear') as string | null;
    const comment = formData.get('comment') as string | null;
    const steamAppId = formData.get('steamAppId') as string | null;

    if (!gameId) {
      return { success: false, error: 'Invalid game ID' };
    }

    if (!name?.trim()) {
      return { success: false, error: 'Name is required' };
    }

    await updateGame({
      gameId,
      name,
      genre,
      releaseYear: parseYear(releaseYearStr),
      comment,
      steamAppId,
    });

    return { success: true };
  },

  deleteGame: async ({ request }) => {
    const formData = await request.formData();
    const gameId = parseGameId(formData.get('gameId') as string);

    if (!gameId) {
      return { success: false, error: 'Invalid game ID' };
    }

    await deleteGame(gameId);
    return { success: true };
  },

  moveGame: async ({ request }) => {
    const formData = await request.formData();
    const gameId = parseGameId(formData.get('gameId') as string);
    const tier = formData.get('tier') as string;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

    if (!gameId) {
      return { success: false, error: 'Invalid game ID' };
    }

    if (!isValidTier(tier)) {
      return { success: false, error: 'Invalid tier' };
    }

    await moveGame({ gameId, tier, sortOrder });
    return { success: true };
  },

  reorderTier: async ({ request }) => {
    const formData = await request.formData();
    const gameIdsJson = formData.get('gameIds') as string;

    if (!gameIdsJson) {
      return { success: false, error: 'No game IDs provided' };
    }

    let gameIds: number[];
    try {
      gameIds = JSON.parse(gameIdsJson);
    } catch {
      return { success: false, error: 'Invalid game IDs format' };
    }

    await reorderTier(gameIds);
    return { success: true };
  },
};
