<script lang="ts">
	import type { PageData } from './$types';
	import { CAMERAS, type CameraId, type Preset } from '$lib/cameras';
	import LivePlayer from '$lib/components/cameras/LivePlayer.svelte';
	import SnapshotGallery from '$lib/components/cameras/SnapshotGallery.svelte';

	let { data }: { data: PageData } = $props();

	// Presets arrive after the page renders; filled in place so the live players don't remount.
	let presets = $state<Partial<Record<CameraId, Preset[]>>>({});
	$effect(() => {
		if (data.configured) data.presets.then((p) => (presets = p)).catch(() => {});
	});
</script>

<svelte:head>
	<title>Cameras · Ghost</title>
</svelte:head>

<div class="max-w-7xl space-y-6">
	<h1 class="text-2xl font-bold flex items-center gap-3">
		<img src="/icon-cameras.svg" alt="" class="w-8 h-8" />
		Cameras
	</h1>

	{#if !data.configured}
		<div class="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-muted)]">
			The camera gateway isn't configured. Set <code>CAMERA_GATEWAY_URL</code> and
			<code>CAMERA_GATEWAY_TOKEN</code> (and <code>TS_AUTHKEY</code> on Fly) to enable this page.
		</div>
	{:else}
		<div class="grid gap-4 xl:grid-cols-2">
			{#each CAMERAS as c (c.id)}
				<LivePlayer id={c.id} name={c.name} presets={presets[c.id] ?? []} />
			{/each}
		</div>

		{#await data.snapshots}
			<div class="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-muted)]">
				Loading photos…
			</div>
		{:then snapshots}
			{#if 'error' in snapshots}
				<div class="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm">
					<span class="text-[var(--color-error)]">Couldn't reach the cameras.</span>
					<span class="text-[var(--color-text-muted)]">{snapshots.error}</span>
				</div>
			{:else}
				<SnapshotGallery {snapshots} />
			{/if}
		{/await}
	{/if}
</div>
