<script lang="ts">
	import { CAMERAS, groupByHour, type CameraId, type Snapshot } from '$lib/cameras';

	let { snapshots }: { snapshots: Record<CameraId, Snapshot[]> } = $props();

	let cam = $state<CameraId>(CAMERAS[0].id);
	let openIndex = $state<number | null>(null);

	// Oldest-first list for the lightbox (left/right = earlier/later), grouped newest hour first for the grid.
	const chronological = $derived([...(snapshots[cam] ?? [])].sort((a, b) => a.ts - b.ts));
	const hours = $derived(groupByHour(snapshots[cam] ?? []));
	const current = $derived(openIndex === null ? null : chronological[openIndex]);

	const url = (s: Snapshot, thumb = false) => `/cameras/snapshots/${cam}/${s.file}${thumb ? '?thumb=1' : ''}`;
	const hourLabel = (ms: number) =>
		new Date(ms).toLocaleString([], { weekday: 'short', hour: 'numeric' });
	const timeLabel = (ms: number) =>
		new Date(ms).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });

	function open(s: Snapshot) {
		openIndex = chronological.findIndex((x) => x.file === s.file);
	}

	function step(delta: number) {
		if (openIndex === null) return;
		openIndex = Math.min(Math.max(openIndex + delta, 0), chronological.length - 1);
	}

	function onKey(e: KeyboardEvent) {
		if (openIndex === null) return;
		if (e.key === 'Escape') openIndex = null;
		else if (e.key === 'ArrowLeft') step(-1);
		else if (e.key === 'ArrowRight') step(1);
		else return;
		e.preventDefault();
	}
</script>

<svelte:window onkeydown={onKey} />

<section class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
	<header class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--color-border)]">
		<h2 class="font-semibold">Last 24 hours</h2>
		<div class="flex gap-1 text-sm" role="tablist">
			{#each CAMERAS as c (c.id)}
				<button
					role="tab"
					aria-selected={cam === c.id}
					class="px-3 py-1 rounded-md border transition-colors {cam === c.id
						? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-glow)]'
						: 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}"
					onclick={() => {
						cam = c.id;
						openIndex = null;
					}}
				>
					{c.name} <span class="text-xs opacity-70">({snapshots[c.id]?.length ?? 0})</span>
				</button>
			{/each}
		</div>
	</header>

	{#if hours.length === 0}
		<p class="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
			No photos yet. Kitten saves one from each camera every 5 minutes.
		</p>
	{:else}
		<div class="divide-y divide-[var(--color-border)]">
			{#each hours as h (h.hour)}
				<div class="flex gap-3 px-4 py-2 items-start">
					<div class="w-20 shrink-0 pt-1 text-xs text-[var(--color-text-muted)]">{hourLabel(h.hour)}</div>
					<div class="flex flex-wrap gap-1.5">
						{#each h.items as s (s.file)}
							<button
								class="block rounded overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-accent)] hover-glow transition-all"
								title={timeLabel(s.ts)}
								onclick={() => open(s)}
							>
								<img src={url(s, true)} alt={timeLabel(s.ts)} loading="lazy" class="w-24 h-[54px] object-cover bg-black" />
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

{#if current}
	<div
		class="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Photo viewer"
		tabindex="-1"
		onclick={(e) => e.target === e.currentTarget && (openIndex = null)}
		onkeydown={() => {}}
	>
		<img src={url(current)} alt={timeLabel(current.ts)} class="max-w-full max-h-[85vh] object-contain rounded" />
		<div class="mt-3 flex items-center gap-4 text-sm">
			<button class="px-3 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] disabled:opacity-30" disabled={openIndex === 0} onclick={() => step(-1)}>← Earlier</button>
			<span class="text-[var(--color-text)]">{timeLabel(current.ts)}</span>
			<button class="px-3 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] disabled:opacity-30" disabled={openIndex === chronological.length - 1} onclick={() => step(1)}>Later →</button>
			<a class="text-[var(--color-accent)] hover:underline" href={url(current)} target="_blank" rel="noopener">Full size</a>
			<button class="px-3 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)]" onclick={() => (openIndex = null)}>Close</button>
		</div>
	</div>
{/if}
