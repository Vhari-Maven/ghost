<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Media } from './types';

	type Props = {
		isOpen: boolean;
		media: Media | null;
		onClose: () => void;
	};

	let { isOpen, media, onClose }: Props = $props();

	// Form state derived from media prop
	let name = $state('');
	let genre = $state('');
	let releaseYear = $state('');
	let comment = $state('');
	let tmdbId = $state('');
	let posterUrl = $state('');

	// Update form when media changes
	$effect(() => {
		if (media) {
			name = media.name;
			genre = media.genre ?? '';
			releaseYear = media.releaseYear?.toString() ?? '';
			comment = media.comment ?? '';
			tmdbId = media.tmdbId ?? '';
			posterUrl = media.posterUrl ?? '';
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	let mediaTypeLabel = $derived(media?.mediaType === 'tv' ? 'Series' : 'Movie');
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && media}
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
			class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 w-[450px] shadow-2xl animate-scale-in"
		>
			<h3 id="modal-title" class="text-lg font-semibold text-[var(--color-text)] mb-4">
				Edit {mediaTypeLabel}
			</h3>

			<form
				method="POST"
				action="?/updateMedia"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update({ reset: false });
						if (result.type === 'success') {
							onClose();
						}
					};
				}}
			>
				<input type="hidden" name="mediaId" value={media.id} />
				<input type="hidden" name="tmdbId" value={tmdbId} />
				<input type="hidden" name="posterUrl" value={posterUrl} />

				<!-- Poster preview if available -->
				{#if media.posterUrl}
					<div class="mb-4 flex justify-center">
						<img src={media.posterUrl} alt="" class="w-24 h-36 object-cover rounded-lg shadow-lg" />
					</div>
				{/if}

				<!-- Name (required) -->
				<div class="mb-4">
					<label
						for="edit-name"
						class="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
					>
						Name <span class="text-red-400">*</span>
					</label>
					<!-- svelte-ignore a11y_autofocus -->
					<input
						type="text"
						id="edit-name"
						name="name"
						bind:value={name}
						required
						autofocus
						class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
					/>
				</div>

				<!-- Genre -->
				<div class="mb-4">
					<label
						for="edit-genre"
						class="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
					>
						Genre
					</label>
					<input
						type="text"
						id="edit-genre"
						name="genre"
						bind:value={genre}
						class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
						placeholder="e.g., Drama"
					/>
				</div>

				<!-- Release Year -->
				<div class="mb-4">
					<label
						for="edit-releaseYear"
						class="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
					>
						Release Year
					</label>
					<input
						type="number"
						id="edit-releaseYear"
						name="releaseYear"
						bind:value={releaseYear}
						min="1900"
						max="2100"
						class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
					/>
				</div>

				<!-- Comment -->
				<div class="mb-6">
					<label
						for="edit-comment"
						class="block text-sm font-medium text-[var(--color-text-muted)] mb-1"
					>
						Comment
					</label>
					<input
						type="text"
						id="edit-comment"
						name="comment"
						bind:value={comment}
						class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
					/>
				</div>

				<!-- Current Tier (read-only info) -->
				<p class="text-xs text-[var(--color-text-muted)] mb-4">
					Current tier: <span class="font-medium text-[var(--color-text)]">{media.tier}</span>
					<span class="opacity-60">(drag to change)</span>
				</p>

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
						Save Changes
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
</style>
