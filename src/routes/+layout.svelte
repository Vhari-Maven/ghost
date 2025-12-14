<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<div class="min-h-screen">
  <nav class="border-b border-[var(--color-border)] px-6 py-4">
    <div class="flex items-center gap-8">
      <a href="/" class="text-xl font-bold text-[var(--color-accent)]">Ghost</a>
      <div class="flex gap-6">
        <a href="/fitness" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          Fitness
        </a>
        <span class="text-[var(--color-border)]">Shopping</span>
        <span class="text-[var(--color-border)]">Media</span>
        <span class="text-[var(--color-border)]">Tasks</span>
      </div>
    </div>
  </nav>

  <main class="p-6">
    {@render children()}
  </main>
</div>
