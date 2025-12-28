<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    icon = '',
    defaultOpen = false,
    children
  }: {
    title: string;
    icon?: string;
    defaultOpen?: boolean;
    children: Snippet;
  } = $props();

  // svelte-ignore state_referenced_locally
  let isOpen = $state.raw(defaultOpen);
</script>

<div class="border border-[var(--color-border)] rounded-lg overflow-hidden mb-3">
  <button
    type="button"
    onclick={() => isOpen = !isOpen}
    class="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors text-left"
  >
    <div class="flex items-center gap-3">
      {#if icon}
        <span class="text-xl">{icon}</span>
      {/if}
      <span class="font-semibold text-[var(--color-text)]">{title}</span>
    </div>
    <svg
      class="w-5 h-5 text-[var(--color-text-muted)] transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if isOpen}
    <div class="px-4 py-4 bg-[var(--color-bg)] border-t border-[var(--color-border)]">
      {@render children()}
    </div>
  {/if}
</div>
