import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { isCameraId, parsePtzMove } from '$lib/cameras';
import { errorResponse, gatewayFetch } from '$lib/services/cameras';

// Nudge a camera: body {pan, tilt: -1|0|1, duration: seconds}. The gateway moves, then stops.
export const POST: RequestHandler = async ({ params, request }) => {
	if (!isCameraId(params.cam)) return json({ error: 'Unknown camera' }, { status: 404 });
	const move = parsePtzMove(await request.json().catch(() => null));
	if (!move) return json({ error: 'Expected {pan, tilt} in -1, 0, 1 and a numeric duration' }, { status: 400 });
	try {
		await gatewayFetch(`/ptz/${params.cam}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(move),
			timeoutMs: 15000
		});
		return json({ ok: true });
	} catch (e) {
		return errorResponse(e);
	}
};
