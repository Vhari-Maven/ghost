<script lang="ts">
  let {
    label,
    value,
    subtitle = '',
    small = false
  }: {
    label: string;
    value: string | number;
    subtitle?: string;
    small?: boolean;
  } = $props();
</script>

<div class="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
  <div class="text-sm text-[var(--color-text-muted)] mb-1">{label}</div>
  <div class="{small ? 'text-lg' : 'text-2xl'} font-bold text-[var(--color-text)] truncate">
    {value}
  </div>
  {#if subtitle}
    <div class="text-xs text-[var(--color-text-muted)] mt-1">{subtitle}</div>
  {/if}
</div>
