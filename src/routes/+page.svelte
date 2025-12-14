<script lang="ts">
</script>

<div class="max-w-2xl">
  <div class="flex items-center gap-4 mb-4">
    <img src="/favicon.svg" alt="Ghost" class="w-12 h-12" />
    <h1 class="text-3xl font-bold">Welcome to Ghost</h1>
  </div>
  <p class="text-[var(--color-text-muted)] mb-8">
    Your personal dashboard for tracking fitness, habits, and more.
  </p>

  <div class="grid gap-4">
    <a
      href="/fitness"
      class="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors"
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
      class="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors"
    >
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <img src="/icon-tasks.svg" alt="" class="w-6 h-6" />
        Tasks
      </h2>
      <p class="text-[var(--color-text-muted)]">Kanban-style task management with drag-and-drop.</p>
    </a>
  </div>
</div>
