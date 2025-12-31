<script lang="ts">
  let {
    trend,
    percentChange
  }: {
    trend: 'improving' | 'maintaining' | 'declining' | 'insufficient_data';
    percentChange: number | null;
  } = $props();

  const config = $derived({
    improving: {
      icon: '↑',
      color: 'text-green-400 bg-green-400/10',
      label: 'Improving'
    },
    maintaining: {
      icon: '→',
      color: 'text-yellow-400 bg-yellow-400/10',
      label: 'Maintaining'
    },
    declining: {
      icon: '↓',
      color: 'text-red-400 bg-red-400/10',
      label: 'Declining'
    },
    insufficient_data: {
      icon: '?',
      color: 'text-[var(--color-text-muted)] bg-[var(--color-border)]',
      label: 'Not enough data'
    }
  }[trend]);
</script>

<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium {config.color}">
  <span>{config.icon}</span>
  <span>{config.label}</span>
  {#if percentChange !== null && trend !== 'insufficient_data'}
    <span class="opacity-75">({percentChange > 0 ? '+' : ''}{percentChange}%)</span>
  {/if}
</span>
