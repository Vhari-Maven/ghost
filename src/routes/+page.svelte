<script lang="ts">
  import { generateWorkoutMarkdown } from '$lib/services/exercise-export';

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
      href="/morning"
      class="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] hover-glow transition-all"
    >
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <img src="/icon-morning.svg" alt="" class="w-6 h-6" />
        Morning Tracker
      </h2>
      <p class="text-[var(--color-text-muted)]">Track your weight, walks, and morning routine.</p>
    </a>

    <div class="relative">
      <a
        href="/exercise"
        class="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] hover-glow transition-all"
      >
        <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
          <img src="/icon-exercise.svg" alt="" class="w-6 h-6" />
          Exercise Tracker
        </h2>
        <p class="text-[var(--color-text-muted)]">7-day workout rotation with detailed exercise guides.</p>
      </a>
      <button
        onclick={exportWorkoutPlan}
        class="absolute top-4 right-4 p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-all"
        title="Export workout plan as Markdown"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
    </div>

    <a
      href="/shopping"
      class="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] hover-glow transition-all"
    >
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <img src="/icon-shopping.svg" alt="" class="w-6 h-6" />
        Shopping List
      </h2>
      <p class="text-[var(--color-text-muted)]">Kanban-style shopping list with drag-and-drop.</p>
    </a>

    <div class="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg opacity-50">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <img src="/icon-media.svg" alt="" class="w-6 h-6" />
        Media Queue
      </h2>
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

    <a
      href="/meal-prep"
      class="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] hover-glow transition-all"
    >
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <img src="/icon-meal-prep.svg" alt="" class="w-6 h-6" />
        Meal Prep
      </h2>
      <p class="text-[var(--color-text-muted)]">Heart-healthy weekly meal plan and grocery list.</p>
    </a>
  </div>
</div>
