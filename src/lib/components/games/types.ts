import { type Tier, type TierConfig, TIER_CONFIGS, TIER_ORDER } from '../shared/tiers';

// Re-export shared tier types for backwards compatibility
export type GameTier = Tier;
export type { TierConfig };
export { TIER_CONFIGS, TIER_ORDER };

export type Game = {
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
	// Optional fields for unranked games (from Steam API)
	playtimeHours?: number;
	lastPlayed?: number | null; // Unix timestamp
};

// Unranked games from Steam have negative IDs (based on -appid)
export function isUnrankedGame(game: Game): boolean {
	return game.id < 0;
}
