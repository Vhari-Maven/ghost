<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import CircuitPulse from '$lib/components/CircuitPulse.svelte';
  import { MODULES, MOBILE_TABS, isActive } from '$lib/nav';

  let { children } = $props();

  let collapsed = $state(browser && localStorage.getItem('ghost-nav-collapsed') === '1');

  $effect(() => {
    localStorage.setItem('ghost-nav-collapsed', collapsed ? '1' : '0');
  });

  const mobileTabs = MOBILE_TABS.map((href) => MODULES.find((m) => m.href === href)!);
</script>

{#snippet settingsIcon()}
  <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
{/snippet}

<CircuitPulse />

<div class="min-h-screen relative z-10 md:flex">
  <!-- Desktop sidebar -->
  <aside
    class="hidden md:flex flex-col sticky top-0 h-screen shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-sm transition-[width] duration-200 {collapsed ? 'w-16' : 'w-52'}"
  >
    <a
      href="/"
      title="Home"
      class="flex items-center gap-2 px-4 py-4 text-xl font-bold transition-colors {collapsed ? 'justify-center px-0' : ''} {$page.url.pathname === '/' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}"
    >
      <img src="/favicon.svg" alt="" class="w-6 h-6 shrink-0" />
      {#if !collapsed}<span>Ghost</span>{/if}
    </a>

    <nav class="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
      {#each MODULES as item}
        <a
          href={item.href}
          title={collapsed ? item.label : undefined}
          class="flex items-center gap-3 rounded-md px-3 py-2 transition-colors {collapsed ? 'justify-center px-0' : ''} {isActive(item.href, $page.url.pathname)
            ? 'bg-[var(--color-accent)] text-white font-medium'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'}"
        >
          <img src={item.icon} alt="" class="w-5 h-5 shrink-0" />
          {#if !collapsed}<span class="truncate">{item.label}</span>{/if}
        </a>
      {/each}
    </nav>

    <div class="px-2 py-3 border-t border-[var(--color-border)] flex flex-col gap-1">
      <a
        href="/settings"
        title={collapsed ? 'Settings' : undefined}
        class="flex items-center gap-3 rounded-md px-3 py-2 transition-colors {collapsed ? 'justify-center px-0' : ''} {isActive('/settings', $page.url.pathname)
          ? 'bg-[var(--color-accent)] text-white font-medium'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'}"
      >
        {@render settingsIcon()}
        {#if !collapsed}<span>Settings</span>{/if}
      </a>
      <button
        onclick={() => (collapsed = !collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        class="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors {collapsed ? 'justify-center px-0' : ''}"
      >
        <svg class="w-5 h-5 shrink-0 transition-transform {collapsed ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        {#if !collapsed}<span>Collapse</span>{/if}
      </button>
    </div>
  </aside>

  <div class="flex-1 min-w-0">
    <!-- Mobile top bar -->
    <header class="md:hidden flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
      <a
        href="/"
        class="flex items-center gap-2 text-lg font-bold transition-colors {$page.url.pathname === '/' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}"
      >
        <img src="/favicon.svg" alt="" class="w-5 h-5" />
        Ghost
      </a>
      <a
        href="/settings"
        title="Settings"
        class="p-2 rounded-md transition-colors {isActive('/settings', $page.url.pathname)
          ? 'bg-[var(--color-accent)] text-white'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}"
      >
        {@render settingsIcon()}
      </a>
    </header>

    <main class="p-4 pb-24 md:p-6">
      {@render children()}
    </main>
  </div>
</div>

<!-- Mobile bottom tab bar -->
<nav
  class="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
>
  <div class="grid grid-cols-4">
    <a
      href="/"
      class="flex flex-col items-center gap-1 py-2 text-xs transition-colors {$page.url.pathname === '/' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}"
    >
      <img src="/favicon.svg" alt="" class="w-6 h-6 {$page.url.pathname === '/' ? '' : 'opacity-60 grayscale'}" />
      Home
    </a>
    {#each mobileTabs as tab}
      <a
        href={tab.href}
        class="flex flex-col items-center gap-1 py-2 text-xs transition-colors {isActive(tab.href, $page.url.pathname) ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}"
      >
        <img src={tab.icon} alt="" class="w-6 h-6 {isActive(tab.href, $page.url.pathname) ? '' : 'opacity-60 grayscale'}" />
        {tab.label}
      </a>
    {/each}
  </div>
</nav>
