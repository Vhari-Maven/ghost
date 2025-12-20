<script lang="ts">
  interface WorkoutInfo {
    type: string;
    label: string;
    focus: string;
  }

  let { workoutInfo, selectedDate }: { workoutInfo: WorkoutInfo; selectedDate: string } = $props();

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };
</script>

<div class="text-center mb-6">
  <div class="text-sm text-[var(--color-text-muted)] mb-1">
    {formatDate(selectedDate)}
  </div>
  <h1 class="text-2xl font-bold text-[var(--color-text)]">
    {workoutInfo.label}
  </h1>
  <p class="text-[var(--color-accent)]">
    {workoutInfo.focus}
  </p>
</div>
