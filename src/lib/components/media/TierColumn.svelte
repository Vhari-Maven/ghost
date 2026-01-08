<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import MediaCard from './MediaCard.svelte';
	import type { Media, MediaTier, TierConfig } from './types';
	import { TIER_CONFIGS } from './types';

	type Props = {
		tierId: MediaTier;
		items: Media[];
		rankOffset?: number;
		flipDurationMs?: number;
		onDndConsider: (
			tierId: MediaTier,
			e: CustomEvent<{ items: Media[] }>
		) => void;
		onDndFinalize: (
			tierId: MediaTier,
			e: CustomEvent<{ items: Media[]; info: { source: string; trigger: string } }>
		) => void;
		onEditMedia: (media: Media) => void;
		onDeleteMedia: (media: Media) => void;
	};

	let {
		tierId,
		items,
		rankOffset = 0,
		flipDurationMs = 200,
		onDndConsider,
		onDndFinalize,
		onEditMedia,
		onDeleteMedia,
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	const config: TierConfig = TIER_CONFIGS[tierId];
</script>

<div class="flex-shrink-0 w-[140px] flex flex-col h-full">
	<!-- Column Header -->
	<div
		class="flex items-center justify-between mb-2 px-2 py-1.5 rounded-t-lg"
		style="background-color: {config.bgColor}"
	>
		<h2 class="font-bold text-lg" style="color: {config.color}">
			{config.title}
		</h2>
		<span
			class="text-xs px-2 py-0.5 rounded-full font-medium"
			style="background-color: {config.color}30; color: {config.color}"
		>
			{items.length}
		</span>
	</div>

	<!-- Drag-and-drop zone -->
	<div
		class="flex-1 rounded-b-lg p-1.5 space-y-1.5 overflow-y-auto min-h-[200px]"
		style="background-color: {config.bgColor}"
		use:dndzone={{ items, flipDurationMs, dropTargetStyle: {} }}
		onconsider={(e) => onDndConsider(tierId, e)}
		onfinalize={(e) => onDndFinalize(tierId, e)}
	>
		{#each items as item, index (item.id)}
			<div animate:flip={{ duration: flipDurationMs }}>
				<MediaCard
					media={item}
					rank={rankOffset + index + 1}
					onEdit={onEditMedia}
					onDelete={onDeleteMedia}
				/>
			</div>
		{/each}

		<!-- Empty state -->
		{#if items.length === 0}
			<div class="text-center py-6 text-[var(--color-text-muted)] text-xs">
				No items
			</div>
		{/if}
	</div>
</div>
