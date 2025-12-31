import type { Handle } from '@sveltejs/kit';
import { initScheduler } from '$lib/scheduler';

// Initialize scheduler on server startup
initScheduler();

export const handle: Handle = async ({ event, resolve }) => {
	// In production, only allow requests through Cloudflare (blocks direct fly.dev access)
	if (process.env.NODE_ENV === 'production') {
		const cfConnectingIp = event.request.headers.get('cf-connecting-ip');

		// If no Cloudflare header, reject the request
		if (!cfConnectingIp) {
			return new Response('Access denied', { status: 403 });
		}
	}

	return resolve(event);
};
