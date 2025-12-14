<script lang="ts">
  function triggerPulse(event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    window.dispatchEvent(
      new CustomEvent('circuit-pulse', { detail: { x, y } })
    );
  }
</script>

<div class="max-w-2xl">
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

  <div class="grid gap-4">
    <a
      href="/fitness"
      class="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] hover-glow transition-all"
    >
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <img src="/icon-fitness.svg" alt="" class="w-6 h-6" />
        Fitness Tracker
      </h2>
      <p class="text-[var(--color-text-muted)]">Track your weight, walks, and morning routine.</p>
    </a>

    <div class="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg opacity-50">
      <h2 class="text-xl font-semibold mb-2">🛒 Shopping List</h2>
      <p class="text-[var(--color-text-muted)]">Coming soon...</p>
    </div>

    <div class="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg opacity-50">
      <h2 class="text-xl font-semibold mb-2">📺 Media Queue</h2>
      <p class="text-[var(--color-text-muted)]">Coming soon...</p>
    </div>

    <a
      href="/tasks"
      class="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] hover-glow transition-all"
    >
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <img src="/icon-tasks.svg" alt="" class="w-6 h-6" />
        Tasks
      </h2>
      <p class="text-[var(--color-text-muted)]">Kanban-style task management with drag-and-drop.</p>
    </a>
  </div>
</div>
