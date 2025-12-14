<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';

  let { children } = $props();

  const navItems = [
    { href: '/fitness', label: 'Fitness', enabled: true },
    { href: '/shopping', label: 'Shopping', enabled: false },
    { href: '/media', label: 'Media', enabled: false },
    { href: '/tasks', label: 'Tasks', enabled: true },
  ];

  function isActive(href: string, currentPath: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  }
</script>

<div class="min-h-screen">
  <nav class="border-b border-[var(--color-border)] px-6 py-4">
    <div class="flex items-center gap-8">
      <a
        href="/"
        class="text-xl font-bold transition-colors {$page.url.pathname === '/' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}"
      >
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
  </nav>

  <main class="p-6">
    {@render children()}
  </main>
</div>
