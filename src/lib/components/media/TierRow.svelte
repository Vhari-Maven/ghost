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
		onDndConsider: (tierId: MediaTier, e: CustomEvent<{ items: Media[] }>) => void;
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

<div class="flex gap-2">
	<!-- Tier Badge -->
	<div
		class="flex-shrink-0 w-16 flex items-center justify-center rounded-lg"
		style="background-color: {config.bgColor}"
	>
		<div class="text-center">
			<span class="text-2xl font-bold" style="color: {config.color}">
				{config.title}
			</span>
			<div
				class="text-xs mt-1 px-2 py-0.5 rounded-full font-medium"
				style="background-color: {config.color}30; color: {config.color}"
			>
				{items.length}
			</div>
		</div>
	</div>

	<!-- Drag-and-drop zone (horizontal) -->
	<div
		class="flex-1 flex gap-2 items-start p-2 rounded-lg overflow-x-auto"
		style="background-color: {config.bgColor}"
		use:dndzone={{ items, flipDurationMs, dropTargetStyle: {}, type: 'media' }}
		onconsider={(e) => onDndConsider(tierId, e)}
		onfinalize={(e) => onDndFinalize(tierId, e)}
	>
		{#each items as item, index (item.id)}
			<div animate:flip={{ duration: flipDurationMs }} class="flex-shrink-0">
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
			<div
				class="flex-1 flex items-center justify-center text-[var(--color-text-muted)] text-sm py-4"
			>
				Drop here
			</div>
		{/if}
	</div>
</div>
