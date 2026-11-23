import type { PageServerLoad } from './$types';
import { CAMERAS, type CameraId, type Preset } from '$lib/cameras';
import { gatewayConfigured, listPresets, listSnapshots } from '$lib/services/cameras';

export const load: PageServerLoad = async () => {
	if (!gatewayConfigured()) {
		return { configured: false as const };
	}
	// Streamed, so the page (and the live players) render without waiting on kitten.
	const snapshots = listSnapshots(24).catch((e: Error) => ({ error: e.message }));
	const presets = Promise.all(
		CAMERAS.map(async (c) => [c.id, await listPresets(c.id).catch(() => [] as Preset[])] as const)
	).then((entries) => Object.fromEntries(entries) as Record<CameraId, Preset[]>);
	return { configured: true as const, snapshots, presets };
};
