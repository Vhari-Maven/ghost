import type { RequestHandler } from './$types';
import { isCameraId } from '$lib/cameras';
import { errorResponse, gatewayFetch, proxyResponse } from '$lib/services/cameras';

// The camera's current frame (used as the live player's poster).
export const GET: RequestHandler = async ({ params, request }) => {
	if (!isCameraId(params.cam)) return new Response('Unknown camera', { status: 404 });
	try {
		return proxyResponse(await gatewayFetch(`/frame/${params.cam}.jpg`, { signal: request.signal }));
	} catch (e) {
		return errorResponse(e);
	}
};
