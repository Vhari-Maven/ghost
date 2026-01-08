import { db } from '$lib/db';
import { media, MEDIA_TIERS, MEDIA_TYPES, type MediaTier, type MediaType } from '$lib/db/schema';
import { eq, and, asc, max } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type MediaData = {
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

export type MediaByTier = Record<MediaTier, MediaData[]>;

export type CreateMediaInput = {
	name: string;
	mediaType: MediaType;
	tier: MediaTier;
	genre?: string | null;
	releaseYear?: number | null;
	tmdbId?: string | null;
	posterUrl?: string | null;
	comment?: string | null;
};

export type UpdateMediaInput = {
	mediaId: number;
	name: string;
	genre?: string | null;
	releaseYear?: number | null;
	tmdbId?: string | null;
	posterUrl?: string | null;
	comment?: string | null;
};

export type MoveMediaInput = {
	mediaId: number;
	tier: MediaTier;
	sortOrder: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Query Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all media of a specific type grouped by tier, sorted by sortOrder within each tier
 */
export async function getMediaByTier(mediaType: MediaType): Promise<MediaByTier> {
	const allMedia = await db
		.select()
		.from(media)
		.where(eq(media.mediaType, mediaType))
		.orderBy(asc(media.sortOrder));

	// Initialize empty arrays for each tier
	const result: MediaByTier = {
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

	// Group media by tier
	for (const item of allMedia) {
		const tier = item.tier as MediaTier;
		if (tier in result) {
			result[tier].push(item);
		}
	}

	return result;
}

/**
 * Get a single media item by ID
 */
export async function getMediaById(mediaId: number): Promise<MediaData | null> {
	const item = await db.select().from(media).where(eq(media.id, mediaId)).get();

	return item ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Media Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new media item (appends to end of specified tier)
 */
export async function createMedia(input: CreateMediaInput): Promise<{ mediaId: number }> {
	const { name, mediaType, tier, genre, releaseYear, tmdbId, posterUrl, comment } = input;

	// Get the max sortOrder for the target tier AND mediaType
	const maxOrder = await db
		.select({ max: max(media.sortOrder) })
		.from(media)
		.where(and(eq(media.tier, tier), eq(media.mediaType, mediaType)))
		.get();

	const newSortOrder = (maxOrder?.max ?? -1) + 1;

	const result = await db
		.insert(media)
		.values({
			name: name.trim(),
			mediaType,
			tier,
			genre: genre?.trim() || null,
			releaseYear: releaseYear ?? null,
			tmdbId: tmdbId?.trim() || null,
			posterUrl: posterUrl?.trim() || null,
			comment: comment?.trim() || null,
			sortOrder: newSortOrder,
		})
		.returning({ id: media.id });

	return { mediaId: result[0].id };
}

/**
 * Update a media item's details (not tier or order - use moveMedia for that)
 */
export async function updateMedia(input: UpdateMediaInput): Promise<void> {
	const { mediaId, name, genre, releaseYear, tmdbId, posterUrl, comment } = input;

	await db
		.update(media)
		.set({
			name: name.trim(),
			genre: genre?.trim() || null,
			releaseYear: releaseYear ?? null,
			tmdbId: tmdbId?.trim() || null,
			posterUrl: posterUrl?.trim() || null,
			comment: comment?.trim() || null,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(media.id, mediaId));
}

/**
 * Delete a media item
 */
export async function deleteMedia(mediaId: number): Promise<void> {
	await db.delete(media).where(eq(media.id, mediaId));
}

/**
 * Move a media item to a different tier and/or position
 */
export async function moveMedia(input: MoveMediaInput): Promise<void> {
	const { mediaId, tier, sortOrder } = input;

	await db
		.update(media)
		.set({
			tier,
			sortOrder,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(media.id, mediaId));
}

/**
 * Reorder media within a tier (updates sortOrder for all items in the list)
 */
export async function reorderTier(mediaIds: number[]): Promise<void> {
	for (let i = 0; i < mediaIds.length; i++) {
		await db
			.update(media)
			.set({ sortOrder: i, updatedAt: new Date().toISOString() })
			.where(eq(media.id, mediaIds[i]));
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function isValidTier(tier: string): tier is MediaTier {
	return MEDIA_TIERS.includes(tier as MediaTier);
}

export function isValidMediaType(type: string): type is MediaType {
	return MEDIA_TYPES.includes(type as MediaType);
}

export function parseMediaId(value: string | null): number | null {
	if (!value) return null;
	const parsed = parseInt(value, 10);
	return isNaN(parsed) ? null : parsed;
}

export function parseYear(value: string | null): number | null {
	if (!value) return null;
	const parsed = parseInt(value, 10);
	if (isNaN(parsed)) return null;
	// Sanity check: valid year range
	if (parsed < 1900 || parsed > 2100) return null;
	return parsed;
}
