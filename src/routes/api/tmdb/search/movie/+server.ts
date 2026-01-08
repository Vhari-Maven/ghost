import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchMovies } from '$lib/services/tmdb';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('query');

	if (!query || query.length < 2) {
		return json([]);
	}

	const results = await searchMovies(query);
	return json(results);
};
