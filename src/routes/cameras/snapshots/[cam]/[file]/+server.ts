import type { RequestHandler } from './$types';
import { isCameraId, isSnapshotFile } from '$lib/cameras';
import { errorResponse, gatewayFetch, proxyResponse } from '$lib/services/cameras';

// A stored still (?thumb=1 for the 480px version). Filenames are timestamps, so they never change.
export const GET: RequestHandler = async ({ params, url, request }) => {
	if (!isCameraId(params.cam) || !isSnapshotFile(params.cam, params.file)) {
		return new Response('Not found', { status: 404 });
	}
	const thumb = url.searchParams.get('thumb') === '1' ? '?thumb=1' : '';
	try {
		const upstream = await gatewayFetch(`/snapshots/${params.cam}/${params.file}${thumb}`, { signal: request.signal });
		return proxyResponse(upstream, 'private, max-age=604800, immutable');
	} catch (e) {
		return errorResponse(e);
	}
};
