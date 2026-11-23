// Shared (client + server) camera definitions and pure helpers for the /cameras page.

export const CAMERAS = [
	{ id: 'cc86', name: 'Desk & cat tree' },
	{ id: 'c2e2', name: 'Table & bedroom door' }
] as const;

export type CameraId = (typeof CAMERAS)[number]['id'];

export function isCameraId(value: string): value is CameraId {
	return CAMERAS.some((c) => c.id === value);
}

export interface Snapshot {
	file: string;
	/** Capture time, epoch ms. */
	ts: number;
}

export interface Preset {
	token: string;
	name: string;
}

/** Snapshot filenames written by kitten's snap job: `<cam>_YYYY-MM-DD_HH-MM.jpg`. */
export const SNAPSHOT_FILE_RE = /^([a-z0-9]+)_\d{4}-\d\d-\d\d_\d\d-\d\d\.jpg$/;

export function isSnapshotFile(cam: CameraId, file: string): boolean {
	const m = SNAPSHOT_FILE_RE.exec(file);
	return !!m && m[1] === cam;
}

export interface HourGroup {
	/** Start of the hour, epoch ms (local time). */
	hour: number;
	/** Snapshots in this hour, oldest first. */
	items: Snapshot[];
}

/** Groups snapshots into local-time hours, newest hour first, items oldest first within an hour. */
export function groupByHour(snaps: Snapshot[]): HourGroup[] {
	const groups = new Map<number, Snapshot[]>();
	for (const s of snaps) {
		const d = new Date(s.ts);
		d.setMinutes(0, 0, 0);
		const key = d.getTime();
		let list = groups.get(key);
		if (!list) groups.set(key, (list = []));
		list.push(s);
	}
	return [...groups.entries()]
		.sort((a, b) => b[0] - a[0])
		.map(([hour, items]) => ({ hour, items: items.sort((a, b) => a.ts - b.ts) }));
}

export interface PtzMove {
	pan: -1 | 0 | 1;
	tilt: -1 | 0 | 1;
	duration: number;
}

/** Validates a PTZ request body. Returns null when it isn't a usable move. */
export function parsePtzMove(body: unknown): PtzMove | null {
	if (!body || typeof body !== 'object') return null;
	const { pan = 0, tilt = 0, duration = 0.5 } = body as Record<string, unknown>;
	const dir = (v: unknown) => (v === -1 || v === 0 || v === 1 ? v : null);
	const p = dir(pan);
	const t = dir(tilt);
	if (p === null || t === null || (p === 0 && t === 0)) return null;
	if (typeof duration !== 'number' || !Number.isFinite(duration)) return null;
	return { pan: p, tilt: t, duration: Math.min(Math.max(duration, 0.1), 2) };
}

/**
 * For a live <video> fed by an endless fMP4 stream: where to seek so playback stays near the live
 * edge, or null if it's close enough already. Browsers otherwise drift further behind over time.
 */
export function liveEdgeSeek(currentTime: number, bufferedEnd: number, maxLag = 2, target = 0.5): number | null {
	if (!Number.isFinite(bufferedEnd) || bufferedEnd - currentTime <= maxLag) return null;
	return Math.max(bufferedEnd - target, 0);
}
