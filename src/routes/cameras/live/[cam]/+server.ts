import type { RequestHandler } from './$types';
import { isCameraId } from '$lib/cameras';
import { errorResponse, gatewayFetch, proxyResponse } from '$lib/services/cameras';

// Live view: endless fMP4 (default) or MJPEG (?format=mjpeg) from the 720p sub stream.
// The browser closing the connection aborts request.signal, which closes the gateway stream too.
export const GET: RequestHandler = async ({ params, url, request }) => {
	if (!isCameraId(params.cam)) return new Response('Unknown camera', { status: 404 });
	const format = url.searchParams.get('format') === 'mjpeg' ? 'mjpeg' : 'mp4';
	try {
		const upstream = await gatewayFetch(`/live/${params.cam}.${format}`, { signal: request.signal, timeoutMs: 15000 });
		return proxyResponse(upstream);
	} catch (e) {
		return errorResponse(e);
	}
};
