<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { SOURCES, TRIGGERS } from 'svelte-dnd-action';
	import { ConfirmModal } from '$lib/components/kanban';
	import {
		TierRow,
		AddMediaModal,
		EditMediaModal,
		TIER_ORDER,
		type Media,
		type MediaTier,
		type MediaType,
	} from '$lib/components/media';

	let { data }: { data: PageData } = $props();

	// ─────────────────────────────────────────────────────────────────────────────
	// Media Type State
	// ─────────────────────────────────────────────────────────────────────────────

	let currentMediaType = $state<MediaType>(data.mediaType as MediaType);

	// When media type changes, navigate to update URL and reload data
	async function handleMediaTypeChange(newType: MediaType) {
		if (newType === currentMediaType) return;
		currentMediaType = newType;
		await goto(`/media?type=${newType}`, { invalidateAll: true });
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Media State (per tier)
	// ─────────────────────────────────────────────────────────────────────────────

	// Local state for each tier - initialized from server data
	// svelte-ignore state_referenced_locally
	let tierMedia = $state<Record<MediaTier, Media[]>>({
		S: [...data.mediaByTier.S] as Media[],
		'A+': [...data.mediaByTier['A+']] as Media[],
		A: [...data.mediaByTier.A] as Media[],
		'A-': [...data.mediaByTier['A-']] as Media[],
		'B+': [...data.mediaByTier['B+']] as Media[],
		B: [...data.mediaByTier.B] as Media[],
		'B-': [...data.mediaByTier['B-']] as Media[],
		'C+': [...data.mediaByTier['C+']] as Media[],
		C: [...data.mediaByTier.C] as Media[],
	});

	// Track last known data reference to detect actual page navigations/reloads
	// svelte-ignore state_referenced_locally
	let lastDataRef = data;

	// Only sync when the data object itself changes (navigation/reload)
	$effect.pre(() => {
		if (data !== lastDataRef) {
			lastDataRef = data;
			currentMediaType = data.mediaType as MediaType;
			tierMedia = {
				S: [...data.mediaByTier.S] as Media[],
				'A+': [...data.mediaByTier['A+']] as Media[],
				A: [...data.mediaByTier.A] as Media[],
				'A-': [...data.mediaByTier['A-']] as Media[],
				'B+': [...data.mediaByTier['B+']] as Media[],
				B: [...data.mediaByTier.B] as Media[],
				'B-': [...data.mediaByTier['B-']] as Media[],
				'C+': [...data.mediaByTier['C+']] as Media[],
				C: [...data.mediaByTier.C] as Media[],
			};
		}
	});

	// ─────────────────────────────────────────────────────────────────────────────
	// UI State
	// ─────────────────────────────────────────────────────────────────────────────

	let showAddModal = $state(false);
	let editingMedia = $state<Media | null>(null);
	let mediaToDelete = $state<Media | null>(null);

	const flipDurationMs = 200;

	// Total count
	let totalItems = $derived(
		Object.values(tierMedia).reduce((sum, items) => sum + items.length, 0)
	);

	// Calculate rank offsets for each tier
	let tierRankOffsets = $derived(() => {
		const offsets: Record<MediaTier, number> = {} as Record<MediaTier, number>;
		let cumulative = 0;
		for (const tier of TIER_ORDER) {
			offsets[tier] = cumulative;
			cumulative += tierMedia[tier].length;
		}
		return offsets;
	});

	let mediaTypeLabel = $derived(currentMediaType === 'tv' ? 'Series' : 'Movies');
	let mediaTypeSingular = $derived(currentMediaType === 'tv' ? 'Series' : 'Movie');

	// ─────────────────────────────────────────────────────────────────────────────
	// Edit/Delete Handlers
	// ─────────────────────────────────────────────────────────────────────────────

	function handleEditMedia(item: Media) {
		editingMedia = item;
	}

	function handleDeleteMedia(item: Media) {
		mediaToDelete = item;
	}

	function closeEditModal() {
		editingMedia = null;
	}

	function closeDeleteModal() {
		mediaToDelete = null;
	}

	function closeAddModal() {
		showAddModal = false;
	}

	function handleMediaAdded() {
		// Invalidate to reload data
		goto(`/media?type=${currentMediaType}`, { invalidateAll: true });
		closeAddModal();
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Drag and Drop Handlers
	// ─────────────────────────────────────────────────────────────────────────────

	function handleDndConsider(tierId: MediaTier, e: CustomEvent<{ items: Media[] }>) {
		tierMedia[tierId] = e.detail.items;
	}

	function handleDndFinalize(
		tierId: MediaTier,
		e: CustomEvent<{ items: Media[]; info: { source: string; trigger: string } }>
	) {
		const { items, info } = e.detail;
		tierMedia[tierId] = items;

		// Only persist if this was a drop (not just a cancel)
		if (info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED_INTO_ZONE) {
			persistTierOrder(tierId, items);
		}
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Persistence
	// ─────────────────────────────────────────────────────────────────────────────

	async function persistTierOrder(tierId: MediaTier, items: Media[]) {
		// Move items that changed tiers
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item.tier !== tierId) {
				const formData = new FormData();
				formData.append('mediaId', String(item.id));
				formData.append('tier', tierId);
				formData.append('sortOrder', String(i));

				await fetch('?/moveMedia', {
					method: 'POST',
					body: formData,
				});

				// Update local tier
				item.tier = tierId;
			}
		}

		// Reorder all items in the tier
		if (items.length > 0) {
			const formData = new FormData();
			formData.append('mediaIds', JSON.stringify(items.map((item) => item.id)));

			await fetch('?/reorderTier', {
				method: 'POST',
				body: formData,
			});
		}
	}
</script>

<div class="h-[calc(100vh-120px)] flex flex-col">
	<!-- Header -->
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-4">
			<h1 class="text-2xl font-bold flex items-center gap-3">
				<img src="/icon-media.svg" alt="" class="w-7 h-7" />
				Media
			</h1>

			<!-- Media Type Toggle -->
			<div class="flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
				<button
					type="button"
					onclick={() => handleMediaTypeChange('tv')}
					class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
					class:bg-[var(--color-accent)]={currentMediaType === 'tv'}
					class:text-white={currentMediaType === 'tv'}
					class:text-[var(--color-text-muted)]={currentMediaType !== 'tv'}
					class:hover:text-[var(--color-text)]={currentMediaType !== 'tv'}
				>
					Series
				</button>
				<button
					type="button"
					onclick={() => handleMediaTypeChange('movie')}
					class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
					class:bg-[var(--color-accent)]={currentMediaType === 'movie'}
					class:text-white={currentMediaType === 'movie'}
					class:text-[var(--color-text-muted)]={currentMediaType !== 'movie'}
					class:hover:text-[var(--color-text)]={currentMediaType !== 'movie'}
				>
					Movies
				</button>
			</div>

			<span class="text-sm text-[var(--color-text-muted)]">
				({totalItems} {totalItems === 1 ? mediaTypeSingular.toLowerCase() : mediaTypeLabel.toLowerCase()})
			</span>
		</div>

		<button
			type="button"
			onclick={() => (showAddModal = true)}
			class="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-2"
		>
			<span class="text-lg">+</span>
			Add {mediaTypeSingular}
		</button>
	</div>

	<!-- Tier Board (vertical stack of horizontal rows) -->
	<div class="flex-1 flex flex-col gap-2 overflow-y-auto pb-4">
		{#each TIER_ORDER as tierId}
			<TierRow
				{tierId}
				items={tierMedia[tierId]}
				rankOffset={tierRankOffsets()[tierId]}
				{flipDurationMs}
				onDndConsider={handleDndConsider}
				onDndFinalize={handleDndFinalize}
				onEditMedia={handleEditMedia}
				onDeleteMedia={handleDeleteMedia}
			/>
		{/each}
	</div>

	<!-- Footer hint -->
	<div class="text-xs text-[var(--color-text-muted)]">
		Drag {mediaTypeLabel.toLowerCase()} between tiers to change ratings
	</div>
</div>

<!-- Add Media Modal -->
<AddMediaModal
	isOpen={showAddModal}
	mediaType={currentMediaType}
	onClose={closeAddModal}
	onSuccess={handleMediaAdded}
/>

<!-- Edit Media Modal -->
<EditMediaModal
	isOpen={editingMedia !== null}
	media={editingMedia}
	onClose={closeEditModal}
/>

<!-- Delete Confirmation Modal -->
<ConfirmModal
	isOpen={mediaToDelete !== null}
	title="Delete {mediaTypeSingular}"
	message="Are you sure you want to delete this {mediaTypeSingular.toLowerCase()}? This action cannot be undone."
	confirmText="Delete"
	cancelText="Cancel"
	formAction="?/deleteMedia"
	formData={mediaToDelete ? { mediaId: mediaToDelete.id } : undefined}
	onCancel={closeDeleteModal}
/>
