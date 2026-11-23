<script lang="ts">
	import { onMount } from 'svelte';
	import { liveEdgeSeek, type CameraId, type Preset } from '$lib/cameras';
	import { mseSupported, playLive } from './mse';

	let { id, name, presets = [] }: { id: CameraId; name: string; presets?: Preset[] } = $props();

	type Mode = 'mp4' | 'mjpeg';
	let mode = $state<Mode>('mp4');
	let paused = $state(false);
	let pageVisible = $state(true);
	let status = $state<'connecting' | 'live' | 'error'>('connecting');
	let attempt = $state(0); // bumped to force a fresh connection
	let ptzError = $state<string | null>(null);
	let ptzBusy = $state(false);
	let video = $state<HTMLVideoElement>();
	let container: HTMLDivElement;
	let retryTimer: ReturnType<typeof setTimeout> | undefined;

	const active = $derived(!paused && pageVisible);
	const src = $derived(`/cameras/live/${id}?format=${mode}&n=${attempt}`);

	function reconnectSoon() {
		status = 'error';
		clearTimeout(retryTimer);
		retryTimer = setTimeout(() => {
			status = 'connecting';
			attempt++;
		}, 5000);
	}

	// MP4 mode: feed the stream to the <video> through Media Source Extensions. Re-runs (reconnects)
	// whenever the element, source or `attempt` changes; aborting closes the HTTP stream.
	$effect(() => {
		if (!active || mode !== 'mp4' || !video) return;
		if (!mseSupported()) {
			mode = 'mjpeg';
			return;
		}
		const v = video;
		const ac = new AbortController();
		playLive(v, src, ac.signal)
			.then(() => !ac.signal.aborted && reconnectSoon())
			.catch(() => !ac.signal.aborted && reconnectSoon());
		return () => ac.abort();
	});

	onMount(() => {
		const onVis = () => (pageVisible = !document.hidden);
		document.addEventListener('visibilitychange', onVis);
		// Keep the fMP4 player at the live edge; browsers otherwise fall further behind over time.
		const tick = setInterval(() => {
			const v = video;
			if (!v || v.buffered.length === 0) return;
			const seek = liveEdgeSeek(v.currentTime, v.buffered.end(v.buffered.length - 1));
			if (seek !== null) v.currentTime = seek;
			if (v.paused && active) v.play().catch(() => {});
		}, 1000);
		return () => {
			document.removeEventListener('visibilitychange', onVis);
			clearInterval(tick);
			clearTimeout(retryTimer);
		};
	});

	// ── Pan / tilt ───────────────────────────────────────────────────────────
	let holdTimer: ReturnType<typeof setInterval> | undefined;

	async function nudge(pan: number, tilt: number) {
		if (ptzBusy) return;
		ptzBusy = true;
		try {
			const res = await fetch(`/cameras/ptz/${id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pan, tilt, duration: 0.4 })
			});
			ptzError = res.ok ? null : ((await res.json().catch(() => ({}))).error ?? `Move failed (${res.status})`);
		} catch {
			ptzError = 'Move failed (network)';
		} finally {
			ptzBusy = false;
		}
	}

	function startHold(pan: number, tilt: number, e: PointerEvent) {
		(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
		stopHold();
		nudge(pan, tilt);
		holdTimer = setInterval(() => nudge(pan, tilt), 450);
	}

	function stopHold() {
		clearInterval(holdTimer);
		holdTimer = undefined;
	}

	async function gotoPreset(p: Preset) {
		try {
			const res = await fetch(`/cameras/presets/${id}/${encodeURIComponent(p.token)}`, { method: 'POST' });
			ptzError = res.ok ? null : ((await res.json().catch(() => ({}))).error ?? 'Preset failed');
		} catch {
			ptzError = 'Preset failed (network)';
		}
	}

	function fullscreen() {
		container.requestFullscreen?.().catch(() => {});
	}

	const DIRS = [
		{ pan: 0, tilt: 1, label: 'Tilt up', cls: 'col-start-2 row-start-1', rot: 0 },
		{ pan: -1, tilt: 0, label: 'Pan left', cls: 'col-start-1 row-start-2', rot: -90 },
		{ pan: 1, tilt: 0, label: 'Pan right', cls: 'col-start-3 row-start-2', rot: 90 },
		{ pan: 0, tilt: -1, label: 'Tilt down', cls: 'col-start-2 row-start-3', rot: 180 }
	];
</script>

<section class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
	<header class="flex items-center justify-between gap-2 px-4 py-2 border-b border-[var(--color-border)]">
		<h2 class="font-semibold flex items-center gap-2">
			<span
				class="w-2 h-2 rounded-full {status === 'live' && active
					? 'bg-[var(--color-success)]'
					: status === 'error'
						? 'bg-[var(--color-error)]'
						: 'bg-[var(--color-text-muted)]'}"
				title={active ? status : 'paused'}
			></span>
			{name}
		</h2>
		<div class="flex items-center gap-1 text-xs">
			<button
				class="px-2 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
				title="Fallback: about one still per second, for browsers that can't play the MP4 stream"
				onclick={() => {
					mode = mode === 'mp4' ? 'mjpeg' : 'mp4';
					status = 'connecting';
				}}
			>
				{mode === 'mp4' ? 'Video' : 'Stills'}
			</button>
			<button
				class="px-2 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
				onclick={() => {
					paused = !paused;
					status = 'connecting';
				}}
			>
				{paused ? 'Play' : 'Pause'}
			</button>
			<button
				class="px-2 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
				onclick={fullscreen}
				aria-label="Fullscreen"
			>
				⛶
			</button>
		</div>
	</header>

	<div bind:this={container} class="relative bg-black aspect-video group">
		{#if active}
			{#key src}
				{#if mode === 'mp4'}
					<video
						bind:this={video}
						poster="/cameras/frame/{id}"
						class="w-full h-full object-contain"
						autoplay
						muted
						playsinline
						onplaying={() => (status = 'live')}
					></video>
				{:else}
					<img
						{src}
						alt="{name} live"
						class="w-full h-full object-contain"
						onload={() => (status = 'live')}
						onerror={reconnectSoon}
					/>
				{/if}
			{/key}
		{:else}
			<div class="absolute inset-0 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
				{paused ? 'Paused' : 'Paused while the tab is hidden'}
			</div>
		{/if}

		{#if status === 'error' && active}
			<div class="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 text-xs text-[var(--color-error)]">
				Stream lost, reconnecting…
			</div>
		{/if}

		<!-- Pan / tilt pad: tap to nudge, hold to keep moving -->
		<div
			class="absolute bottom-3 right-3 grid grid-cols-3 grid-rows-3 gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
		>
			{#each DIRS as d (d.label)}
				<button
					class="{d.cls} w-10 h-10 rounded-md bg-black/60 border border-[var(--color-accent-muted)] text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:bg-black/80 active:bg-[var(--color-accent-muted)] flex items-center justify-center touch-none select-none"
					aria-label={d.label}
					title={d.label}
					onpointerdown={(e) => startHold(d.pan, d.tilt, e)}
					onpointerup={stopHold}
					onpointercancel={stopHold}
					onlostpointercapture={stopHold}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), nudge(d.pan, d.tilt))}
				>
					<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transform: rotate({d.rot}deg)">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 15l6-6 6 6" />
					</svg>
				</button>
			{/each}
			<div class="col-start-2 row-start-2 flex items-center justify-center">
				<span class="w-2 h-2 rounded-full {ptzBusy ? 'bg-[var(--color-accent)] animate-pulse' : 'bg-[var(--color-accent-muted)]'}"></span>
			</div>
		</div>
	</div>

	{#if presets.length > 0 || ptzError}
		<footer class="flex flex-wrap items-center gap-2 px-4 py-2 border-t border-[var(--color-border)] text-sm">
			{#each presets as p (p.token)}
				<button
					class="px-3 py-1 rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
					onclick={() => gotoPreset(p)}
				>
					{p.name}
				</button>
			{/each}
			{#if ptzError}
				<span class="text-xs text-[var(--color-error)]">{ptzError}</span>
			{/if}
		</footer>
	{/if}
</section>
