<script lang="ts">
  import type { PageData } from './$types';
  import StatCard from '$lib/components/analytics/StatCard.svelte';
  import TrendBadge from '$lib/components/analytics/TrendBadge.svelte';
  import PeriodSelector from '$lib/components/analytics/PeriodSelector.svelte';
  import ConsistencyCalendar from '$lib/components/analytics/ConsistencyCalendar.svelte';
  import ProgressChart from '$lib/components/analytics/ProgressChart.svelte';
  import MorningChart from '$lib/components/analytics/MorningChart.svelte';
  import HeartRateZonesChart from '$lib/components/analytics/HeartRateZonesChart.svelte';
  import SleepChart from '$lib/components/analytics/SleepChart.svelte';

  let { data }: { data: PageData } = $props();

  // Selected metric for the progress chart
  let selectedMetric = $state<string>('walking');

  // Determine chart type based on selection
  const chartType = $derived(() => {
    if (selectedMetric === 'walking' || selectedMetric === 'weight' || selectedMetric === 'calories') {
      return 'morning';
    }
    if (selectedMetric === 'heart-rate-zones') {
      return 'heart-rate-zones';
    }
    if (selectedMetric === 'sleep') {
      return 'sleep';
    }
    return 'exercise';
  });

  // Get the selected exercise's progress data (for exercise charts)
  const selectedExerciseProgress = $derived(
    data.exerciseProgress.find(p => p.exerciseId === selectedMetric) || null
  );

  // Get morning data based on selection (including calories)
  const selectedMorningProgress = $derived(
    selectedMetric === 'walking' ? data.walkingProgress :
    selectedMetric === 'weight' ? data.weightProgress :
    selectedMetric === 'calories' ? data.caloriesProgress : null
  );

  // Get trend info for current selection
  const currentTrend = $derived(() => {
    if (selectedMetric === 'heart-rate-zones') {
      return {
        trend: data.heartRateZones.trend,
        percentChange: data.heartRateZones.percentChange
      };
    }
    if (selectedMetric === 'sleep') {
      return {
        trend: data.sleepProgress.trend,
        percentChange: data.sleepProgress.percentChange
      };
    }
    if (chartType() === 'morning' && selectedMorningProgress) {
      return {
        trend: selectedMorningProgress.trend,
        percentChange: selectedMorningProgress.percentChange
      };
    }
    if (chartType() === 'exercise' && selectedExerciseProgress) {
      return {
        trend: selectedExerciseProgress.trend,
        percentChange: selectedExerciseProgress.percentChange
      };
    }
    return null;
  });

  // Check if we have any Fitbit data
  const hasFitbitData = $derived(
    data.heartRateZones.dataPoints.length > 0 ||
    data.sleepProgress.dataPoints.length > 0 ||
    data.caloriesProgress.dataPoints.length > 0
  );

  // Calculate consistency percentage
  const consistencyPercent = $derived(() => {
    const workoutDays = data.consistency.filter(d => d.workoutType !== null).length;
    const totalDays = data.consistency.length;
    return totalDays > 0 ? Math.round((workoutDays / totalDays) * 100) : 0;
  });

  // Build selector options
  const selectorOptions = $derived(() => {
    const options: Array<{ id: string; name: string; category: string }> = [
      { id: 'walking', name: 'Walking', category: 'morning' },
      { id: 'weight', name: 'Body Weight', category: 'morning' }
    ];

    // Add exercise options
    for (const ex of data.exerciseProgress) {
      options.push({
        id: ex.exerciseId,
        name: ex.exerciseName,
        category: ex.category
      });
    }

    return options;
  });

  function handleMetricChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selectedMetric = select.value;
  }
</script>

<svelte:head>
  <title>Analytics | Ghost</title>
</svelte:head>

<div class="space-y-8">
  <!-- Error Message -->
  {#if data.error}
    <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-medium">{data.error}</span>
      </div>
    </div>
  {/if}

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
        <svg class="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-[var(--color-text)]">Analytics</h1>
    </div>
    <PeriodSelector currentDays={data.days} />
  </div>

  <!-- Summary Stats -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <StatCard
      label="Workouts"
      value={data.summary.totalWorkouts}
      subtitle="this period"
    />
    <StatCard
      label="Consistency"
      value="{consistencyPercent()}%"
      subtitle="of days active"
    />
    <StatCard
      label="Avg Weight"
      value={data.morningStats.avgWeight ? `${data.morningStats.avgWeight} lbs` : '—'}
      subtitle="{data.morningStats.daysWithWeight} weigh-ins"
    />
    <StatCard
      label="Total Miles"
      value={data.morningStats.totalMiles}
      subtitle="{data.morningStats.daysWithWalk} walk days"
    />
  </div>

  <!-- Workout Calendar -->
  <section class="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
    <h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">Workout Calendar</h2>
    <ConsistencyCalendar days={data.consistency} />
  </section>

  <!-- Progress Chart -->
  <section class="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-[var(--color-text)]">Progress Over Time</h2>
      <select
        value={selectedMetric}
        onchange={handleMetricChange}
        class="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg
               text-[var(--color-text)] text-sm
               hover:border-[var(--color-border-hover)] focus:border-[var(--color-accent)]
               focus:outline-none transition-colors cursor-pointer"
      >
        <optgroup label="Morning Tracker">
          <option value="walking">Walking</option>
          <option value="weight">Body Weight</option>
        </optgroup>
        {#if hasFitbitData}
          <optgroup label="Fitbit">
            {#if data.heartRateZones.dataPoints.length > 0}
              <option value="heart-rate-zones">Heart Rate Zones</option>
            {/if}
            {#if data.sleepProgress.dataPoints.length > 0}
              <option value="sleep">Sleep</option>
            {/if}
            {#if data.caloriesProgress.dataPoints.length > 0}
              <option value="calories">Calories Burned</option>
            {/if}
          </optgroup>
        {/if}
        {#if data.exerciseProgress.length > 0}
          {@const categories = [...new Set(data.exerciseProgress.map(e => e.category))]}
          {#each categories as category}
            <optgroup label={category.charAt(0).toUpperCase() + category.slice(1)}>
              {#each data.exerciseProgress.filter(e => e.category === category) as exercise}
                <option value={exercise.exerciseId}>{exercise.exerciseName}</option>
              {/each}
            </optgroup>
          {/each}
        {/if}
      </select>
    </div>

    {#if currentTrend()}
      <div class="mb-4 flex items-center gap-3">
        <span class="text-sm text-[var(--color-text-muted)]">Trend:</span>
        <TrendBadge trend={currentTrend()!.trend} percentChange={currentTrend()!.percentChange} />
        {#if selectedMetric === 'walking' && data.walkingProgress.periodTotal > 0}
          <span class="text-sm text-[var(--color-text-muted)]">
            · {data.walkingProgress.periodTotal} miles total
          </span>
        {/if}
        {#if selectedMetric === 'weight' && data.weightProgress.periodAverage}
          <span class="text-sm text-[var(--color-text-muted)]">
            · {data.weightProgress.periodAverage} lbs avg
          </span>
        {/if}
      </div>
    {/if}

    {#if chartType() === 'heart-rate-zones'}
      <HeartRateZonesChart data={data.heartRateZones} />
    {:else if chartType() === 'sleep'}
      <SleepChart data={data.sleepProgress} />
    {:else if chartType() === 'morning' && selectedMorningProgress}
      <MorningChart data={selectedMorningProgress} showCumulative={selectedMetric === 'walking'} />
    {:else if chartType() === 'exercise' && selectedExerciseProgress}
      <ProgressChart data={selectedExerciseProgress} />
    {:else}
      <div class="h-64 flex items-center justify-center text-[var(--color-text-muted)]">
        <p>No data yet. Start tracking to see your progress!</p>
      </div>
    {/if}
  </section>
</div>
