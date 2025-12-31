<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let { currentDays }: { currentDays: number } = $props();

  const options = [
    { value: 7, label: '7 days' },
    { value: 14, label: '14 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' }
  ];

  function handleChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const days = select.value;
    const url = new URL($page.url);
    url.searchParams.set('days', days);
    goto(url.toString());
  }
</script>

<select
  value={currentDays}
  onchange={handleChange}
  class="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg
         text-[var(--color-text)] text-sm
         hover:border-[var(--color-border-hover)] focus:border-[var(--color-accent)]
         focus:outline-none transition-colors cursor-pointer"
>
  {#each options as option}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
