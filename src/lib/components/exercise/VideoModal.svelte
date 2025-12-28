<script lang="ts">
  let {
    videoId,
    title,
    isOpen = $bindable(false),
    onclose
  }: {
    videoId: string;
    title: string;
    isOpen: boolean;
    onclose?: () => void;
  } = $props();

  function close() {
    isOpen = false;
    onclose?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === 'Escape' && close()}
    role="dialog"
    aria-modal="true"
    aria-label="{title} video"
    tabindex="-1"
  >
    <!-- Modal -->
    <div class="relative w-full max-w-3xl bg-[var(--color-surface)] rounded-lg overflow-hidden shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
        <h3 class="font-semibold text-[var(--color-text)]">{title}</h3>
        <button
          type="button"
          onclick={close}
          aria-label="Close video"
          class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Video embed -->
      <div class="relative aspect-video">
        <iframe
          src="https://www.youtube.com/embed/{videoId}?autoplay=1&rel=0"
          title="{title} - Tutorial Video"
          class="absolute inset-0 w-full h-full"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  </div>
{/if}
