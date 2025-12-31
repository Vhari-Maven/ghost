<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import CircuitPulse from '$lib/components/CircuitPulse.svelte';

  let { children } = $props();

  const navItems = [
    { href: '/morning', label: 'Morning', enabled: true },
    { href: '/exercise', label: 'Exercise', enabled: true },
    { href: '/analytics', label: 'Analytics', enabled: true },
    { href: '/meal-prep', label: 'Meal Prep', enabled: true },
    { href: '/shopping', label: 'Shopping', enabled: true },
    { href: '/games', label: 'Games', enabled: true },
    { href: '/media', label: 'Media', enabled: false },
    { href: '/tasks', label: 'Tasks', enabled: true },
  ];

  function isActive(href: string, currentPath: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  }
</script>

<CircuitPulse />

<div class="min-h-screen relative z-10">
  <nav class="border-b border-[var(--color-border)] px-6 py-4">
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center gap-8">
        <a
          href="/"
          class="flex items-center gap-2 text-xl font-bold transition-colors {$page.url.pathname === '/' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}"
        >
          <img src="/favicon.svg" alt="" class="w-6 h-6" />
          Ghost
        </a>
        <div class="flex gap-1">
          {#each navItems as item}
            {#if item.enabled}
              <a
                href={item.href}
                class="px-4 py-2 rounded-md transition-colors {isActive(item.href, $page.url.pathname)
                  ? 'bg-[var(--color-accent)] text-white font-medium'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'}"
              >
                {item.label}
              </a>
            {:else}
              <span class="px-4 py-2 text-[var(--color-border)] cursor-not-allowed">
                {item.label}
              </span>
            {/if}
          {/each}
        </div>
      </div>
      <a
        href="/settings"
        class="p-2 rounded-md transition-colors {isActive('/settings', $page.url.pathname)
          ? 'bg-[var(--color-accent)] text-white'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'}"
        title="Settings"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </a>
    </div>
  </nav>

  <main class="p-6">
    {@render children()}
  </main>
</div>
