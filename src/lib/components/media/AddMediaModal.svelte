<script lang="ts">
	import { enhance } from '$app/forms';
	import type { MediaTier, MediaType } from './types';
	import { TIER_ORDER, TIER_CONFIGS } from './types';

	type SearchResult = {
		id: number;
		name: string;
		releaseYear: number | null;
		posterUrl: string | null;
		overview: string;
		genres: string[];
	};

	type Props = {
		isOpen: boolean;
		mediaType: MediaType;
		onClose: () => void;
		onSuccess?: () => void;
	};

	let { isOpen, mediaType, onClose, onSuccess }: Props = $props();

	// Search state
	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let isSearching = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;

	// Form state
	let selectedResult = $state<SearchResult | null>(null);
	let name = $state('');
	let genre = $state('');
	let tier = $state<MediaTier>('B');
	let releaseYear = $state('');
	let comment = $state('');
	let tmdbId = $state('');
	let posterUrl = $state('');

	// Debounced search
	function handleSearchInput() {
		if (searchTimeout) clearTimeout(searchTimeout);

		if (searchQuery.length < 2) {
			searchResults = [];
			return;
		}

		searchTimeout = setTimeout(async () => {
			isSearching = true;
			try {
				const endpoint = mediaType === 'tv' ? '/api/tmdb/search/tv' : '/api/tmdb/search/movie';
				const response = await fetch(`${endpoint}?query=${encodeURIComponent(searchQuery)}`);
				if (response.ok) {
					searchResults = await response.json();
				}
			} catch (error) {
				console.error('Search error:', error);
			} finally {
				isSearching = false;
			}
		}, 300);
	}

	function selectResult(result: SearchResult) {
		selectedResult = result;
		name = result.name;
		releaseYear = result.releaseYear?.toString() ?? '';
		genre = result.genres[0] ?? '';
		tmdbId = result.id.toString();
		posterUrl = result.posterUrl ?? '';
		searchQuery = '';
		searchResults = [];
	}

	function clearSelection() {
		selectedResult = null;
		name = '';
		genre = '';
		releaseYear = '';
		tmdbId = '';
		posterUrl = '';
	}

	function resetForm() {
		searchQuery = '';
		searchResults = [];
		selectedResult = null;
		name = '';
		genre = '';
		tier = 'B';
		releaseYear = '';
		comment = '';
		tmdbId = '';
		posterUrl = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	// Reset form when modal opens/closes
	$effect(() => {
		if (!isOpen) {
			resetForm();
		}
	});

	let mediaTypeLabel = $derived(mediaType === 'tv' ? 'Series' : 'Movie');
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') onClose();
		}}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<div
			class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in"
		>
			<h3 id="modal-title" class="text-lg font-semibold text-[var(--color-text)] mb-4">
				Add {mediaTypeLabel}
			</h3>

			<form
				method="POST"
				action="?/createMedia"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update({ reset: false });
						if (result.type === 'success') {
							resetForm();
							if (onSuccess) {
								onSuccess();
							} else {
								onClose();
							}
						}
					};
				}}
			>
				<input type="hidden" name="mediaType" value={mediaType} />
				<input type="hidden" name="tmdbId" value={tmdbId} />
				<input type="hidden" name="posterUrl" value={posterUrl} />

				<!-- TMDB Search -->
				<div class="mb-4 relative">
					<label for="search" class="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
						Search
						<a
							href="https://www.themoviedb.org/"
							target="_blank"
							rel="noopener noreferrer"
							class="text-[var(--color-accent)] hover:underline"
						>TMDB</a>
					</label>
					<div class="relative">
						<input
							type="text"
							id="search"
							bind:value={searchQuery}
							oninput={handleSearchInput}
							class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
							placeholder="Search for {mediaTypeLabel.toLowerCase()}..."
							autocomplete="off"
						/>
						{#if isSearching}
							<div class="absolute right-3 top-1/2 -translate-y-1/2">
								<div
									class="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"
								></div>
							</div>
						{/if}

						<!-- Search Results Dropdown -->
						{#if searchResults.length > 0}
							<div
								class="absolute left-0 right-0 z-20 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl max-h-64 overflow-y-auto"
							>
							{#each searchResults as result}
								<button
									type="button"
									onclick={() => selectResult(result)}
									class="w-full flex items-start gap-3 p-2 hover:bg-[var(--color-bg)] transition-colors text-left"
								>
									{#if result.posterUrl}
										<img
											src={result.posterUrl}
											alt=""
											class="w-10 h-15 object-cover rounded shrink-0"
										/>
									{:else}
										<div
											class="w-10 h-15 bg-[var(--color-bg)] rounded shrink-0 flex items-center justify-center"
										>
											<span class="text-[var(--color-text-muted)] text-xs">?</span>
										</div>
									{/if}
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium text-[var(--color-text)] truncate">
											{result.name}
										</p>
										<p class="text-xs text-[var(--color-text-muted)]">
											{result.releaseYear ?? 'Unknown year'}
											{#if result.genres.length > 0}
												&middot; {result.genres[0]}
											{/if}
										</p>
									</div>
								</button>
							{/each}
						</div>
					{/if}
					</div>
				</div>

				<!-- Selected Result Preview -->
				{#if selectedResult}
					<div
						class="mb-4 p-3 bg-[var(--color-bg)] border border-[var(--color-accent)]/30 rounded-lg flex items-start gap-3"
					>
						{#if selectedResult.posterUrl}
							<img
								src={selectedResult.posterUrl}
								alt=""
								class="w-16 h-24 object-cover rounded shrink-0"
							/>
						{/if}
						<div class="flex-1 min-w-0">
							<p class="font-medium text-[var(--color-text)]">{selectedResult.name}</p>
							<p class="text-xs text-[var(--color-text-muted)] mt-0.5">
								{selectedResult.releaseYear ?? 'Unknown'}
								{#if selectedResult.genres.length > 0}
									&middot; {selectedResult.genres.join(', ')}
								{/if}
							</p>
							{#if selectedResult.overview}
								<p class="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
									{selectedResult.overview}
								</p>
							{/if}
						</div>
						<button
							type="button"
							onclick={clearSelection}
							class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1"
							title="Clear selection"
						>
							&times;
						</button>
					</div>
				{/if}

				<!-- Name (required) -->
				<div class="mb-4">
					<label for="name" class="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
						Name <span class="text-red-400">*</span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						bind:value={name}
						required
						class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
						placeholder="{mediaTypeLabel} name"
					/>
				</div>

				<!-- Tier -->
				<div class="mb-4">
					<label for="tier" class="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
						Tier
					</label>
					<select
						id="tier"
						name="tier"
						bind:value={tier}
						class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
					>
						{#each TIER_ORDER as t}
							<option value={t} style="color: {TIER_CONFIGS[t].color}">
								{t} tier
							</option>
						{/each}
					</select>
				</div>

				<!-- Genre -->
				<div class="mb-4">
					<label for="genre" class="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
						Genre
					</label>
					<input
						type="text"
						id="genre"
						name="genre"
						bind:value={genre}
						class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
						placeholder="e.g., Drama"
					/>
				</div>

				<!-- Release Year -->
				<div class="mb-4">
					<label
						for="releaseYear"
						class="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
					>
						Release Year
					</label>
					<input
						type="number"
						id="releaseYear"
						name="releaseYear"
						bind:value={releaseYear}
						min="1900"
						max="2100"
						class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
						placeholder="e.g., 2023"
					/>
				</div>

				<!-- Comment -->
				<div class="mb-6">
					<label for="comment" class="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
						Comment
					</label>
					<input
						type="text"
						id="comment"
						name="comment"
						bind:value={comment}
						class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
						placeholder="Optional notes"
					/>
				</div>

				<!-- Actions -->
				<div class="flex gap-3">
					<button
						type="button"
						onclick={onClose}
						class="flex-1 px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded-lg text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="flex-1 px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
					>
						Add {mediaTypeLabel}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes scale-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.15s ease-out;
	}

	.animate-scale-in {
		animation: scale-in 0.15s ease-out;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
