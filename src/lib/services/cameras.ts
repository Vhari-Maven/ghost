// Server-side access to kitten's cam-gateway (reached over Tailscale; see deploy/fly-start.sh).
// The gateway is token-protected and only exposes live view, stills, PTZ and presets.
import { env } from '$env/dynamic/private';
import { CAMERAS, type CameraId, type Preset, type Snapshot } from '$lib/cameras';

export class GatewayError extends Error {
	constructor(
		message: string,
		readonly status = 502
	) {
		super(message);
	}
}

export function gatewayConfigured(): boolean {
	return !!env.CAMERA_GATEWAY_URL && !!env.CAMERA_GATEWAY_TOKEN;
}

/**
 * Fetch from the gateway. `timeoutMs` bounds the time to response headers only, so it is safe for
 * long-running streams; `signal` (e.g. the browser request's) cancels the whole thing.
 */
export async function gatewayFetch(
	path: string,
	{ timeoutMs = 8000, signal, ...init }: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
	if (!gatewayConfigured()) throw new GatewayError('Camera gateway is not configured', 503);
	const base = env.CAMERA_GATEWAY_URL!.replace(/\/+$/, '');
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
	const onAbort = () => controller.abort(signal?.reason);
	signal?.addEventListener('abort', onAbort, { once: true });
	let res: Response;
	try {
		res = await fetch(`${base}${path}`, {
			...init,
			signal: controller.signal,
			headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${env.CAMERA_GATEWAY_TOKEN}` }
		});
	} catch (e) {
		signal?.removeEventListener('abort', onAbort);
		throw new GatewayError(controller.signal.aborted && !signal?.aborted ? 'Camera gateway timed out' : `Camera gateway unreachable: ${(e as Error).message}`);
	} finally {
		clearTimeout(timer);
	}
	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		throw new GatewayError(`Camera gateway ${res.status}: ${detail.slice(0, 200)}`, res.status === 404 ? 404 : 502);
	}
	return res;
}

export async function listSnapshots(hours = 24): Promise<Record<CameraId, Snapshot[]>> {
	const res = await gatewayFetch(`/snapshots?hours=${hours}`);
	const data = (await res.json()) as Record<string, Snapshot[]>;
	return Object.fromEntries(CAMERAS.map((c) => [c.id, data[c.id] ?? []])) as Record<CameraId, Snapshot[]>;
}

export async function listPresets(cam: CameraId): Promise<Preset[]> {
	const res = await gatewayFetch(`/presets/${cam}`);
	return (await res.json()) as Preset[];
}

/** Turns a gateway response into a streamed proxy response (no buffering, never cached). */
export function proxyResponse(upstream: Response, cacheControl = 'no-store'): Response {
	return new Response(upstream.body, {
		headers: {
			'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
			'Cache-Control': cacheControl,
			'X-Content-Type-Options': 'nosniff'
		}
	});
}

export function errorResponse(e: unknown): Response {
	const status = e instanceof GatewayError ? e.status : 502;
	return new Response(JSON.stringify({ error: (e as Error).message }), {
		status,
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	});
}
