import type { PageServerLoad, Actions } from './$types';
import { env } from '$env/dynamic/private';
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
  getAllSteamAppIds,
} from '$lib/services/games';

export type UnrankedGame = {
  appid: number;
  name: string;
  playtimeHours: number;
  lastPlayed: number | null; // Unix timestamp
};

async function fetchUnrankedGames(): Promise<UnrankedGame[]> {
  const apiKey = env.STEAM_API_KEY;
  const steamId = env.STEAM_USER_ID;

  if (!apiKey || !steamId) {
    console.warn('Steam API key or user ID not configured');
    return [];
  }

  try {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.response?.games) {
      return [];
    }

    // Get existing Steam App IDs from our database
    const existingAppIds = await getAllSteamAppIds();
    const existingSet = new Set(existingAppIds);

    // Filter to games with >2 hours playtime that aren't in tier list
    const unranked = data.response.games
      .filter(
        (g: { appid: number; playtime_forever?: number }) =>
          !existingSet.has(String(g.appid)) && (g.playtime_forever || 0) > 120
      )
      .map(
        (g: {
          appid: number;
          name: string;
          playtime_forever?: number;
          rtime_last_played?: number;
        }) => ({
          appid: g.appid,
          name: g.name,
          playtimeHours: Math.round((g.playtime_forever || 0) / 60),
          lastPlayed: g.rtime_last_played || null,
        })
      )
      .sort((a: UnrankedGame, b: UnrankedGame) => b.playtimeHours - a.playtimeHours);

    return unranked;
  } catch (error) {
    console.error('Failed to fetch Steam library:', error);
    return [];
  }
}

export const load: PageServerLoad = async () => {
  const [gamesByTier, unrankedGames] = await Promise.all([
    getGamesByTier(),
    fetchUnrankedGames(),
  ]);
  return { gamesByTier, unrankedGames };
};

// Fetch game details from Steam Store API
async function fetchSteamGameDetails(
  appId: string
): Promise<{ releaseYear: number | null; genre: string | null }> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}`
    );
    const data = await res.json();

    if (!data[appId]?.success || !data[appId]?.data) {
      return { releaseYear: null, genre: null };
    }

    const gameData = data[appId].data;

    // Extract year from release_date (format: "Feb 25, 2016" or similar)
    let releaseYear: number | null = null;
    if (gameData.release_date?.date) {
      const yearMatch = gameData.release_date.date.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        releaseYear = parseInt(yearMatch[0], 10);
      }
    }

    // Extract first genre
    let genre: string | null = null;
    if (gameData.genres?.length > 0) {
      genre = gameData.genres[0].description;
    }

    return { releaseYear, genre };
  } catch (error) {
    console.error('Failed to fetch Steam game details:', error);
    return { releaseYear: null, genre: null };
  }
}

export const actions: Actions = {
  createGame: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    let genre = formData.get('genre') as string | null;
    const tier = formData.get('tier') as string;
    let releaseYearStr = formData.get('releaseYear') as string | null;
    const comment = formData.get('comment') as string | null;
    const steamAppId = formData.get('steamAppId') as string | null;

    if (!name?.trim()) {
      return { success: false, error: 'Name is required' };
    }

    if (!isValidTier(tier)) {
      return { success: false, error: 'Invalid tier' };
    }

    // Auto-fill from Steam if we have an app ID and fields are empty
    if (steamAppId && (!releaseYearStr || !genre)) {
      const steamDetails = await fetchSteamGameDetails(steamAppId);
      if (!releaseYearStr && steamDetails.releaseYear) {
        releaseYearStr = String(steamDetails.releaseYear);
      }
      if (!genre && steamDetails.genre) {
        genre = steamDetails.genre;
      }
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
