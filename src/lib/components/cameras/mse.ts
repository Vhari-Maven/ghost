// Plays an endless fragmented-MP4 HTTP stream in a <video> via Media Source Extensions.
// Chrome stalls on a plain <video src> pointing at a never-ending fMP4 response, so we read the
// response ourselves and append it to a SourceBuffer (the same approach as go2rtc's own player).

type MSCtor = typeof MediaSource;

function mediaSourceCtor(): MSCtor | undefined {
	const w = window as unknown as { ManagedMediaSource?: MSCtor; MediaSource?: MSCtor };
	return w.ManagedMediaSource ?? w.MediaSource; // ManagedMediaSource: iOS 17.1+ Safari
}

export function mseSupported(): boolean {
	return !!mediaSourceCtor();
}

function once(target: EventTarget, event: string, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const onAbort = () => reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
		target.addEventListener(
			event,
			() => {
				signal.removeEventListener('abort', onAbort);
				resolve();
			},
			{ once: true }
		);
		signal.addEventListener('abort', onAbort, { once: true });
	});
}

/** Resolves when the stream ends, rejects on error or abort. Keeps at most ~20 s of back-buffer. */
export async function playLive(video: HTMLVideoElement, url: string, signal: AbortSignal): Promise<void> {
	const MS = mediaSourceCtor();
	if (!MS) throw new Error('Media Source Extensions not supported');

	const res = await fetch(url, { signal });
	if (!res.ok || !res.body) throw new Error(`Stream HTTP ${res.status}`);
	const type = res.headers.get('Content-Type') ?? 'video/mp4; codecs="avc1.64001F"';
	if (!MS.isTypeSupported(type)) throw new Error(`Unsupported stream type: ${type}`);

	const ms = new MS();
	const objectUrl = URL.createObjectURL(ms);
	(video as HTMLVideoElement & { disableRemotePlayback: boolean }).disableRemotePlayback = true;
	video.src = objectUrl;
	const reader = res.body.getReader();

	try {
		await once(ms, 'sourceopen', signal);
		const sb = ms.addSourceBuffer(type);
		sb.mode = 'segments';

		for (;;) {
			const { done, value } = await reader.read();
			if (done) return;
			if (sb.updating) await once(sb, 'updateend', signal);
			sb.appendBuffer(value);
			await once(sb, 'updateend', signal);

			// Trim old media so a long-running tab doesn't hit the SourceBuffer quota.
			const b = sb.buffered;
			if (b.length && video.currentTime - b.start(0) > 30) {
				sb.remove(0, video.currentTime - 10);
				await once(sb, 'updateend', signal);
			}
		}
	} finally {
		reader.cancel().catch(() => {});
		URL.revokeObjectURL(objectUrl);
		video.removeAttribute('src');
		video.load();
	}
}
