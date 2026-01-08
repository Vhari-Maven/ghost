import type { PageServerLoad, Actions } from './$types';
import {
	getMediaByTier,
	createMedia,
	updateMedia,
	deleteMedia,
	moveMedia,
	reorderTier,
	isValidTier,
	isValidMediaType,
	parseMediaId,
	parseYear,
} from '$lib/services/media';
import type { MediaType } from '$lib/db/schema';

export const load: PageServerLoad = async ({ url }) => {
	// Get media type from query param, default to 'tv'
	const mediaTypeParam = url.searchParams.get('type');
	const mediaType: MediaType =
		mediaTypeParam === 'movie' || mediaTypeParam === 'tv' ? mediaTypeParam : 'tv';

	const mediaByTier = await getMediaByTier(mediaType);

	return { mediaByTier, mediaType };
};

export const actions: Actions = {
	createMedia: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const mediaType = formData.get('mediaType') as string;
		const tier = formData.get('tier') as string;
		const genre = formData.get('genre') as string | null;
		const releaseYearStr = formData.get('releaseYear') as string | null;
		const comment = formData.get('comment') as string | null;
		const tmdbId = formData.get('tmdbId') as string | null;
		const posterUrl = formData.get('posterUrl') as string | null;

		if (!name?.trim()) {
			return { success: false, error: 'Name is required' };
		}

		if (!isValidMediaType(mediaType)) {
			return { success: false, error: 'Invalid media type' };
		}

		if (!isValidTier(tier)) {
			return { success: false, error: 'Invalid tier' };
		}

		const result = await createMedia({
			name,
			mediaType,
			tier,
			genre,
			releaseYear: parseYear(releaseYearStr),
			comment,
			tmdbId,
			posterUrl,
		});

		return {
			success: true,
			media: {
				id: result.mediaId,
				name,
				mediaType,
				tier,
				genre,
				releaseYear: parseYear(releaseYearStr),
				comment,
				tmdbId,
				posterUrl,
				sortOrder: 0,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
		};
	},

	updateMedia: async ({ request }) => {
		const formData = await request.formData();
		const mediaId = parseMediaId(formData.get('mediaId') as string);
		const name = formData.get('name') as string;
		const genre = formData.get('genre') as string | null;
		const releaseYearStr = formData.get('releaseYear') as string | null;
		const comment = formData.get('comment') as string | null;
		const tmdbId = formData.get('tmdbId') as string | null;
		const posterUrl = formData.get('posterUrl') as string | null;

		if (!mediaId) {
			return { success: false, error: 'Invalid media ID' };
		}

		if (!name?.trim()) {
			return { success: false, error: 'Name is required' };
		}

		await updateMedia({
			mediaId,
			name,
			genre,
			releaseYear: parseYear(releaseYearStr),
			comment,
			tmdbId,
			posterUrl,
		});

		return { success: true };
	},

	deleteMedia: async ({ request }) => {
		const formData = await request.formData();
		const mediaId = parseMediaId(formData.get('mediaId') as string);

		if (!mediaId) {
			return { success: false, error: 'Invalid media ID' };
		}

		await deleteMedia(mediaId);
		return { success: true };
	},

	moveMedia: async ({ request }) => {
		const formData = await request.formData();
		const mediaId = parseMediaId(formData.get('mediaId') as string);
		const tier = formData.get('tier') as string;
		const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

		if (!mediaId) {
			return { success: false, error: 'Invalid media ID' };
		}

		if (!isValidTier(tier)) {
			return { success: false, error: 'Invalid tier' };
		}

		await moveMedia({ mediaId, tier, sortOrder });
		return { success: true };
	},

	reorderTier: async ({ request }) => {
		const formData = await request.formData();
		const mediaIdsJson = formData.get('mediaIds') as string;

		if (!mediaIdsJson) {
			return { success: false, error: 'No media IDs provided' };
		}

		let mediaIds: number[];
		try {
			mediaIds = JSON.parse(mediaIdsJson);
		} catch {
			return { success: false, error: 'Invalid media IDs format' };
		}

		await reorderTier(mediaIds);
		return { success: true };
	},
};
