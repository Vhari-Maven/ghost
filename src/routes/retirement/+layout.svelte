<script lang="ts">
  import { page } from '$app/stores';

  let { children } = $props();

  const tabs = [
    { href: '/retirement', label: 'Projection' },
    { href: '/retirement/job', label: 'Job' },
    { href: '/retirement/accounts', label: 'Accounts' },
    { href: '/retirement/expenses', label: 'Expenses' },
  ];

  function isActive(href: string, currentPath: string): boolean {
    if (href === '/retirement') return currentPath === '/retirement';
    return currentPath.startsWith(href);
  }
</script>

<svelte:head>
  <title>Ghost — Retirement</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-bold flex items-center gap-3">
      <img src="/icon-retirement.svg" alt="" class="w-8 h-8" />
      Retirement
    </h1>
  </div>

  <nav class="flex gap-1 mb-6">
    {#each tabs as tab}
      <a
        href={tab.href}
        class="px-4 py-2 rounded-md transition-colors {isActive(tab.href, $page.url.pathname)
          ? 'bg-[var(--color-accent)] text-white font-medium'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'}"
      >
        {tab.label}
      </a>
    {/each}
  </nav>

  {@render children()}
</div>
