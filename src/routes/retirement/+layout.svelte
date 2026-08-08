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

<div class="argent">
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

<style>
  /* Argent's pages and chart are styled against these tokens (see the
     original argent +layout.svelte). Scoped to this section, remapped to
     argent's dark palette so they sit inside ghost's dark theme. */
  .argent {
    --page: transparent;
    --card: #1a1a19;
    --ink: #ffffff;
    --ink-secondary: #c3c2b7;
    --muted: #898781;
    --border: #2c2c2a;
    --axis: #383835;
    --error: #e66767;
    --success: #0ca30c;
    --viz-1: #3987e5;
    --viz-2: #d95926;
    --viz-3: #199e70;
    --viz-4: #c98500;
    --viz-5: #d55181;

    max-width: 72rem;
    margin: 0 auto;
    color: var(--ink);
  }

  .argent :global(input),
  .argent :global(select),
  .argent :global(button) {
    background: var(--card);
    color: var(--ink);
    border: 1px solid var(--axis);
    border-radius: 0.3rem;
  }

  .argent :global(button) {
    cursor: pointer;
  }
</style>
