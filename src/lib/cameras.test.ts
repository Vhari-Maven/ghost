import { describe, expect, it } from 'vitest';
import { groupByHour, isCameraId, isSnapshotFile, liveEdgeSeek, parsePtzMove } from './cameras';

const at = (h: number, m: number) => new Date(2026, 10, 23, h, m).getTime();

describe('isCameraId / isSnapshotFile', () => {
	it('accepts only known cameras', () => {
		expect(isCameraId('cc86')).toBe(true);
		expect(isCameraId('c2e2')).toBe(true);
		expect(isCameraId('nope')).toBe(false);
		expect(isCameraId('../etc')).toBe(false);
	});

	it('accepts only that camera’s snapshot filenames', () => {
		expect(isSnapshotFile('cc86', 'cc86_2026-11-23_14-05.jpg')).toBe(true);
		expect(isSnapshotFile('cc86', 'c2e2_2026-11-23_14-05.jpg')).toBe(false);
		expect(isSnapshotFile('cc86', 'cc86_2026-11-23_14-05.jpg/../x')).toBe(false);
		expect(isSnapshotFile('cc86', '../cc86_2026-11-23_14-05.jpg')).toBe(false);
		expect(isSnapshotFile('cc86', 'cc86_2026-11-23_14-05-00.jpg')).toBe(false);
	});
});

describe('groupByHour', () => {
	it('groups by local hour, newest hour first, oldest item first', () => {
		const snaps = [
			{ file: 'a', ts: at(13, 55) },
			{ file: 'b', ts: at(14, 10) },
			{ file: 'c', ts: at(14, 0) },
			{ file: 'd', ts: at(12, 5) }
		];
		const groups = groupByHour(snaps);
		expect(groups.map((g) => g.hour)).toEqual([at(14, 0), at(13, 0), at(12, 0)]);
		expect(groups[0].items.map((s) => s.file)).toEqual(['c', 'b']);
	});

	it('handles no snapshots', () => {
		expect(groupByHour([])).toEqual([]);
	});
});

describe('parsePtzMove', () => {
	it('accepts single-axis and diagonal moves and clamps duration', () => {
		expect(parsePtzMove({ pan: -1, tilt: 0, duration: 0.4 })).toEqual({ pan: -1, tilt: 0, duration: 0.4 });
		expect(parsePtzMove({ pan: 1, tilt: 1, duration: 10 })).toEqual({ pan: 1, tilt: 1, duration: 2 });
		expect(parsePtzMove({ tilt: -1 })).toEqual({ pan: 0, tilt: -1, duration: 0.5 });
	});

	it('rejects no-ops and bad values', () => {
		expect(parsePtzMove({ pan: 0, tilt: 0 })).toBeNull();
		expect(parsePtzMove({ pan: 2 })).toBeNull();
		expect(parsePtzMove({ pan: '1' })).toBeNull();
		expect(parsePtzMove({ pan: 1, duration: 'long' })).toBeNull();
		expect(parsePtzMove(null)).toBeNull();
	});
});

describe('liveEdgeSeek', () => {
	it('leaves playback alone when close to live', () => {
		expect(liveEdgeSeek(10, 11.5)).toBeNull();
	});

	it('jumps near the live edge when lagging', () => {
		expect(liveEdgeSeek(10, 15)).toBe(14.5);
	});

	it('ignores an empty buffer', () => {
		expect(liveEdgeSeek(0, Number.NaN)).toBeNull();
	});
});
