import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { isCameraId } from '$lib/cameras';
import { errorResponse, gatewayFetch } from '$lib/services/cameras';

// Move a camera to one of its saved positions.
export const POST: RequestHandler = async ({ params }) => {
	if (!isCameraId(params.cam)) return json({ error: 'Unknown camera' }, { status: 404 });
	if (!/^[A-Za-z0-9_.-]{1,64}$/.test(params.token)) return json({ error: 'Bad preset' }, { status: 400 });
	try {
		await gatewayFetch(`/presets/${params.cam}/${encodeURIComponent(params.token)}`, { method: 'POST', timeoutMs: 15000 });
		return json({ ok: true });
	} catch (e) {
		return errorResponse(e);
	}
};
