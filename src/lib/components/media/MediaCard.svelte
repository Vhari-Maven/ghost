<script lang="ts">
	import { Edit, Trash } from '$lib/components/kanban/icons';
	import type { Media } from './types';

	type Props = {
		media: Media;
		rank?: number;
		onEdit?: (media: Media) => void;
		onDelete?: (media: Media) => void;
	};

	let { media, rank, onEdit, onDelete }: Props = $props();

	// Track image load state
	let imageLoaded = $state(false);
	let imageError = $state(false);
</script>

<div
	class="relative w-[100px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden hover:border-[var(--color-accent)]/50 transition-colors group cursor-grab active:cursor-grabbing"
>
	<!-- Action buttons (top right, on hover) -->
	<div
		class="absolute top-1 right-1 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
	>
		{#if onEdit && onDelete}
			<button
				type="button"
				onclick={() => onEdit(media)}
				class="p-1 bg-black/80 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
				title="Edit"
			>
				<Edit />
			</button>
			<button
				type="button"
				onclick={() => onDelete(media)}
				class="p-1 bg-black/80 rounded text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
				title="Delete"
			>
				<Trash />
			</button>
		{/if}
	</div>

	<!-- Poster Image (portrait aspect ratio) -->
	{#if media.posterUrl && !imageError}
		<div class="relative w-full aspect-[2/3] bg-[var(--color-bg)] overflow-hidden">
			<!-- Shimmer placeholder while loading -->
			{#if !imageLoaded}
				<div class="absolute inset-0 shimmer"></div>
			{/if}
			<img
				src={media.posterUrl}
				alt=""
				class="w-full h-full object-cover transition-opacity duration-200"
				class:opacity-0={!imageLoaded}
				class:opacity-100={imageLoaded}
				onload={() => (imageLoaded = true)}
				onerror={() => (imageError = true)}
			/>
			{#if rank}
				<span
					class="absolute top-1 left-1 text-[10px] font-mono font-bold text-[var(--color-accent)] bg-black/90 border border-[var(--color-accent)]/50 px-1.5 py-0.5 rounded shadow-lg"
				>
					{rank}
				</span>
			{/if}

			<!-- Hover overlay with title and metadata -->
			<div
				class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity"
			>
				<h3 class="font-medium text-white text-xs leading-tight line-clamp-2">
					{media.name}
				</h3>
				{#if media.genre || media.releaseYear}
					<p class="text-[10px] text-white/70 mt-0.5">
						{#if media.genre}{media.genre}{/if}
						{#if media.genre && media.releaseYear} · {/if}
						{#if media.releaseYear}{media.releaseYear}{/if}
					</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Title (shown on hover or if no poster) -->
	{#if !media.posterUrl || imageError}
		<div class="p-2">
			<div class="flex items-start gap-2">
				{#if rank}
					<span
						class="text-[10px] font-mono font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/15 px-1.5 py-0.5 rounded shrink-0"
					>
						{rank}
					</span>
				{/if}
				<h3 class="font-medium text-[var(--color-text)] text-xs leading-tight line-clamp-2">
					{media.name}
				</h3>
			</div>
		</div>
	{/if}
</div>

<style>
	.shimmer {
		background: linear-gradient(
			90deg,
			var(--color-bg) 0%,
			var(--color-surface) 50%,
			var(--color-bg) 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
