<script lang="ts">
  import { generateWorkoutMarkdown } from '$lib/services/exercise-export';
  import { MODULES } from '$lib/nav';

  function triggerPulse(event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    window.dispatchEvent(
      new CustomEvent('circuit-pulse', { detail: { x, y } })
    );
  }

  function exportWorkoutPlan(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const md = generateWorkoutMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workout-plan.md';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="max-w-5xl">
  <div class="flex items-center gap-4 mb-4">
    <button
      onclick={triggerPulse}
      class="hover:scale-110 active:scale-95 transition-transform cursor-pointer"
      title="Send a pulse"
    >
      <img src="/favicon.svg" alt="Ghost" class="w-12 h-12" />
    </button>
    <h1 class="text-3xl font-bold">Welcome to Ghost</h1>
  </div>
  <p class="text-[var(--color-text-muted)] mb-8">
    Your personal dashboard for tracking fitness, habits, and more.
  </p>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each MODULES as module}
      <div class="relative">
        <a
          href={module.href}
          class="block h-full p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] hover-glow transition-all"
        >
          <h2 class="text-lg font-semibold mb-2 flex items-center gap-2">
            <img src={module.icon} alt="" class="w-6 h-6" />
            {module.label}
          </h2>
          <p class="text-sm text-[var(--color-text-muted)]">{module.description}</p>
        </a>
        {#if module.href === '/exercise'}
          <button
            onclick={exportWorkoutPlan}
            class="absolute top-3 right-3 p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-all"
            title="Export workout plan as Markdown"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>
