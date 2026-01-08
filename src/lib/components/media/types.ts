import { type Tier, type TierConfig, TIER_CONFIGS, TIER_ORDER } from '../shared/tiers';

// Re-export shared tier types
export type MediaTier = Tier;
export type { TierConfig };
export { TIER_CONFIGS, TIER_ORDER };

export type MediaType = 'tv' | 'movie';

export type Media = {
	id: number;
	name: string;
	mediaType: string;
	tier: string;
	genre: string | null;
	releaseYear: number | null;
	tmdbId: string | null;
	posterUrl: string | null;
	comment: string | null;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
};

export type MediaByTier = Record<MediaTier, Media[]>;
