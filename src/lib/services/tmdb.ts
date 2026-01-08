import { env } from '$env/dynamic/private';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TmdbSearchResult = {
	id: number;
	name: string;
	releaseYear: number | null;
	posterUrl: string | null;
	overview: string;
	genres: string[];
};

export type TmdbMediaDetails = {
	id: number;
	name: string;
	releaseYear: number | null;
	posterUrl: string | null;
	overview: string;
	genres: string[];
};

type TmdbTvResult = {
	id: number;
	name: string;
	first_air_date?: string;
	poster_path?: string | null;
	overview?: string;
	genre_ids?: number[];
};

type TmdbMovieResult = {
	id: number;
	title: string;
	release_date?: string;
	poster_path?: string | null;
	overview?: string;
	genre_ids?: number[];
};

type TmdbGenre = {
	id: number;
	name: string;
};

// TMDB genre mappings (cached to avoid extra API calls)
const TV_GENRES: Record<number, string> = {
	10759: 'Action & Adventure',
	16: 'Animation',
	35: 'Comedy',
	80: 'Crime',
	99: 'Documentary',
	18: 'Drama',
	10751: 'Family',
	10762: 'Kids',
	9648: 'Mystery',
	10763: 'News',
	10764: 'Reality',
	10765: 'Sci-Fi & Fantasy',
	10766: 'Soap',
	10767: 'Talk',
	10768: 'War & Politics',
	37: 'Western',
};

const MOVIE_GENRES: Record<number, string> = {
	28: 'Action',
	12: 'Adventure',
	16: 'Animation',
	35: 'Comedy',
	80: 'Crime',
	99: 'Documentary',
	18: 'Drama',
	10751: 'Family',
	14: 'Fantasy',
	36: 'History',
	27: 'Horror',
	10402: 'Music',
	9648: 'Mystery',
	10749: 'Romance',
	878: 'Science Fiction',
	10770: 'TV Movie',
	53: 'Thriller',
	10752: 'War',
	37: 'Western',
};

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w342';

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

function getApiKey(): string | null {
	return env.TMDB_API_KEY || null;
}

function extractYear(dateString?: string): number | null {
	if (!dateString) return null;
	const year = parseInt(dateString.substring(0, 4), 10);
	return isNaN(year) ? null : year;
}

function getPosterUrl(posterPath?: string | null): string | null {
	if (!posterPath) return null;
	return `${POSTER_BASE_URL}${posterPath}`;
}

function mapGenreIds(genreIds: number[] | undefined, genreMap: Record<number, string>): string[] {
	if (!genreIds) return [];
	return genreIds.map((id) => genreMap[id]).filter((name): name is string => !!name);
}

/**
 * Search for TV shows by title
 */
export async function searchTvShows(query: string): Promise<TmdbSearchResult[]> {
	const apiKey = getApiKey();
	if (!apiKey) {
		console.warn('TMDB_API_KEY not configured');
		return [];
	}

	try {
		const url = new URL('https://api.themoviedb.org/3/search/tv');
		url.searchParams.set('api_key', apiKey);
		url.searchParams.set('query', query);
		url.searchParams.set('include_adult', 'false');

		const response = await fetch(url.toString());
		if (!response.ok) {
			console.error('TMDB search failed:', response.status, response.statusText);
			return [];
		}

		const data = (await response.json()) as { results: TmdbTvResult[] };

		return data.results.slice(0, 10).map((result) => ({
			id: result.id,
			name: result.name,
			releaseYear: extractYear(result.first_air_date),
			posterUrl: getPosterUrl(result.poster_path),
			overview: result.overview || '',
			genres: mapGenreIds(result.genre_ids, TV_GENRES),
		}));
	} catch (error) {
		console.error('TMDB search error:', error);
		return [];
	}
}

/**
 * Search for movies by title
 */
export async function searchMovies(query: string): Promise<TmdbSearchResult[]> {
	const apiKey = getApiKey();
	if (!apiKey) {
		console.warn('TMDB_API_KEY not configured');
		return [];
	}

	try {
		const url = new URL('https://api.themoviedb.org/3/search/movie');
		url.searchParams.set('api_key', apiKey);
		url.searchParams.set('query', query);
		url.searchParams.set('include_adult', 'false');

		const response = await fetch(url.toString());
		if (!response.ok) {
			console.error('TMDB search failed:', response.status, response.statusText);
			return [];
		}

		const data = (await response.json()) as { results: TmdbMovieResult[] };

		return data.results.slice(0, 10).map((result) => ({
			id: result.id,
			name: result.title,
			releaseYear: extractYear(result.release_date),
			posterUrl: getPosterUrl(result.poster_path),
			overview: result.overview || '',
			genres: mapGenreIds(result.genre_ids, MOVIE_GENRES),
		}));
	} catch (error) {
		console.error('TMDB search error:', error);
		return [];
	}
}

/**
 * Get detailed info for a TV show by TMDB ID
 */
export async function getTvShowDetails(tmdbId: number): Promise<TmdbMediaDetails | null> {
	const apiKey = getApiKey();
	if (!apiKey) {
		console.warn('TMDB_API_KEY not configured');
		return null;
	}

	try {
		const url = new URL(`https://api.themoviedb.org/3/tv/${tmdbId}`);
		url.searchParams.set('api_key', apiKey);

		const response = await fetch(url.toString());
		if (!response.ok) {
			console.error('TMDB details failed:', response.status, response.statusText);
			return null;
		}

		const data = (await response.json()) as {
			id: number;
			name: string;
			first_air_date?: string;
			poster_path?: string | null;
			overview?: string;
			genres?: TmdbGenre[];
		};

		return {
			id: data.id,
			name: data.name,
			releaseYear: extractYear(data.first_air_date),
			posterUrl: getPosterUrl(data.poster_path),
			overview: data.overview || '',
			genres: data.genres?.map((g) => g.name) || [],
		};
	} catch (error) {
		console.error('TMDB details error:', error);
		return null;
	}
}

/**
 * Get detailed info for a movie by TMDB ID
 */
export async function getMovieDetails(tmdbId: number): Promise<TmdbMediaDetails | null> {
	const apiKey = getApiKey();
	if (!apiKey) {
		console.warn('TMDB_API_KEY not configured');
		return null;
	}

	try {
		const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbId}`);
		url.searchParams.set('api_key', apiKey);

		const response = await fetch(url.toString());
		if (!response.ok) {
			console.error('TMDB details failed:', response.status, response.statusText);
			return null;
		}

		const data = (await response.json()) as {
			id: number;
			title: string;
			release_date?: string;
			poster_path?: string | null;
			overview?: string;
			genres?: TmdbGenre[];
		};

		return {
			id: data.id,
			name: data.title,
			releaseYear: extractYear(data.release_date),
			posterUrl: getPosterUrl(data.poster_path),
			overview: data.overview || '',
			genres: data.genres?.map((g) => g.name) || [],
		};
	} catch (error) {
		console.error('TMDB details error:', error);
		return null;
	}
}
