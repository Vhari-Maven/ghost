import { db } from '$lib/db';
import { videoGames, GAME_TIERS, type GameTier } from '$lib/db/schema';
import { eq, asc, max, isNotNull } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GameData = {
  id: number;
  name: string;
  genre: string | null;
  tier: string;
  releaseYear: number | null;
  comment: string | null;
  steamAppId: string | null;
  coverUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GamesByTier = Record<GameTier, GameData[]>;

export type CreateGameInput = {
  name: string;
  genre?: string | null;
  tier: GameTier;
  releaseYear?: number | null;
  comment?: string | null;
  steamAppId?: string | null;
};

export type UpdateGameInput = {
  gameId: number;
  name: string;
  genre?: string | null;
  releaseYear?: number | null;
  comment?: string | null;
  steamAppId?: string | null;
};

export type MoveGameInput = {
  gameId: number;
  tier: GameTier;
  sortOrder: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Query Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all games grouped by tier, sorted by sortOrder within each tier
 */
export async function getGamesByTier(): Promise<GamesByTier> {
  const allGames = await db
    .select()
    .from(videoGames)
    .orderBy(asc(videoGames.sortOrder));

  // Initialize empty arrays for each tier
  const result: GamesByTier = {
    S: [],
    'A+': [],
    A: [],
    'A-': [],
    'B+': [],
    B: [],
    'B-': [],
    'C+': [],
    C: [],
  };

  // Group games by tier
  for (const game of allGames) {
    const tier = game.tier as GameTier;
    if (tier in result) {
      result[tier].push(game);
    }
  }

  return result;
}

/**
 * Get a single game by ID
 */
export async function getGameById(gameId: number): Promise<GameData | null> {
  const game = await db
    .select()
    .from(videoGames)
    .where(eq(videoGames.id, gameId))
    .get();

  return game ?? null;
}

/**
 * Get all Steam App IDs in the database (for filtering unranked games)
 */
export async function getAllSteamAppIds(): Promise<string[]> {
  const games = await db
    .select({ steamAppId: videoGames.steamAppId })
    .from(videoGames)
    .where(isNotNull(videoGames.steamAppId));

  return games
    .map((g) => g.steamAppId)
    .filter((id): id is string => id !== null);
}

// ─────────────────────────────────────────────────────────────────────────────
// Game Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new game (appends to end of specified tier)
 */
export async function createGame(input: CreateGameInput): Promise<{ gameId: number }> {
  const { name, genre, tier, releaseYear, comment, steamAppId } = input;

  // Get the max sortOrder for the target tier
  const maxOrder = await db
    .select({ max: max(videoGames.sortOrder) })
    .from(videoGames)
    .where(eq(videoGames.tier, tier))
    .get();

  const newSortOrder = (maxOrder?.max ?? -1) + 1;

  const result = await db
    .insert(videoGames)
    .values({
      name: name.trim(),
      genre: genre?.trim() || null,
      tier,
      releaseYear: releaseYear ?? null,
      comment: comment?.trim() || null,
      steamAppId: steamAppId?.trim() || null,
      sortOrder: newSortOrder,
    })
    .returning({ id: videoGames.id });

  return { gameId: result[0].id };
}

/**
 * Update a game's details (not tier or order - use moveGame for that)
 */
export async function updateGame(input: UpdateGameInput): Promise<void> {
  const { gameId, name, genre, releaseYear, comment, steamAppId } = input;

  await db
    .update(videoGames)
    .set({
      name: name.trim(),
      genre: genre?.trim() || null,
      releaseYear: releaseYear ?? null,
      comment: comment?.trim() || null,
      steamAppId: steamAppId?.trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(videoGames.id, gameId));
}

/**
 * Delete a game
 */
export async function deleteGame(gameId: number): Promise<void> {
  await db.delete(videoGames).where(eq(videoGames.id, gameId));
}

/**
 * Move a game to a different tier and/or position
 */
export async function moveGame(input: MoveGameInput): Promise<void> {
  const { gameId, tier, sortOrder } = input;

  await db
    .update(videoGames)
    .set({
      tier,
      sortOrder,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(videoGames.id, gameId));
}

/**
 * Reorder games within a tier (updates sortOrder for all games in the list)
 */
export async function reorderTier(gameIds: number[]): Promise<void> {
  for (let i = 0; i < gameIds.length; i++) {
    await db
      .update(videoGames)
      .set({ sortOrder: i, updatedAt: new Date().toISOString() })
      .where(eq(videoGames.id, gameIds[i]));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function isValidTier(tier: string): tier is GameTier {
  return GAME_TIERS.includes(tier as GameTier);
}

export function parseGameId(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

export function parseYear(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return null;
  // Sanity check: valid year range
  if (parsed < 1970 || parsed > 2100) return null;
  return parsed;
}
