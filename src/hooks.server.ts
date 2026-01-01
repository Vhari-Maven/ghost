import type { Handle } from '@sveltejs/kit';
import { initScheduler } from '$lib/scheduler';
import { env } from '$env/dynamic/private';

// Validate environment variables on startup
function validateEnvironment() {
	const warnings: string[] = [];

	// Fitbit integration is optional, but if any Fitbit env vars are set, all must be set
	const hasFitbitClientId = !!env.FITBIT_CLIENT_ID;
	const hasFitbitClientSecret = !!env.FITBIT_CLIENT_SECRET;

	if (hasFitbitClientId || hasFitbitClientSecret) {
		if (!hasFitbitClientId) {
			warnings.push('FITBIT_CLIENT_SECRET is set but FITBIT_CLIENT_ID is missing');
		}
		if (!hasFitbitClientSecret) {
			warnings.push('FITBIT_CLIENT_ID is set but FITBIT_CLIENT_SECRET is missing');
		}
	}

	if (warnings.length > 0) {
		console.warn('[Environment] Configuration warnings:');
		warnings.forEach(w => console.warn(`  - ${w}`));
		console.warn('[Environment] Fitbit integration will be disabled');
	} else if (hasFitbitClientId && hasFitbitClientSecret) {
		console.log('[Environment] Fitbit integration enabled');
	}
}

// Validate environment and initialize scheduler on server startup
validateEnvironment();
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
