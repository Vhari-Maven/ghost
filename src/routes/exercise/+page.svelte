<script lang="ts">
  import DayNavigation from '$lib/components/exercise/DayNavigation.svelte';
  import WorkoutHeader from '$lib/components/exercise/WorkoutHeader.svelte';
  import AlwaysDoStack from '$lib/components/exercise/AlwaysDoStack.svelte';
  import ExerciseCard from '$lib/components/exercise/ExerciseCard.svelte';

  let { data } = $props();
</script>

<div class="max-w-3xl mx-auto">
  <!-- Day Navigation -->
  <DayNavigation weekDays={data.weekDays} isFuture={data.isFuture} />

  <!-- Workout Header -->
  <WorkoutHeader workoutInfo={data.workoutInfo} selectedDate={data.selectedDate} />

  <!-- Always Do Stack -->
  <div class="mb-6">
    <AlwaysDoStack
      alwaysDoByCategory={data.alwaysDoByCategory}
      alwaysDoStatus={data.alwaysDoStatus}
      exercises={data.allExercises}
      sessionId={data.session.id}
      isFuture={data.isFuture}
    />
  </div>

  <!-- Main Exercises -->
  {#if data.exercises.length > 0}
    <div class="mb-4">
      <h2 class="text-lg font-semibold text-[var(--color-text)] flex items-center gap-2">
        <span class="text-xl">🏋️</span>
        Today's Workout
      </h2>
      <p class="text-sm text-[var(--color-text-muted)]">
        {data.exercises.length} exercises • {data.exercises.reduce((acc, e) => acc + e.defaultSets, 0)} total sets
      </p>
    </div>

    <div class="space-y-4">
      {#each data.exercises as exercise}
        <ExerciseCard
          {exercise}
          sessionId={data.session.id}
          existingLogs={data.logsByExercise[exercise.id] || []}
          historicalSummary={data.historicalSummaries[exercise.id] || ''}
          isFuture={data.isFuture}
        />
      {/each}
    </div>

    {#if data.historyDate}
      <div class="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        Comparing to your last {data.workoutInfo.label} workout on {new Date(data.historyDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
    {/if}
  {:else}
    <!-- Recovery Day -->
    <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 text-center">
      <div class="text-4xl mb-3">🧘</div>
      <h3 class="text-lg font-semibold text-[var(--color-text)] mb-2">Active Recovery Day</h3>
      <p class="text-[var(--color-text-muted)] max-w-md mx-auto">
        No resistance training today. Focus on the Always Do stack above — consider extending your walk
        and spending extra time on mobility.
      </p>
      <div class="mt-4 p-4 bg-[var(--color-bg)] rounded-lg text-left">
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Recovery Day Ideas:</h4>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>• Extended walk (30-40 minutes instead of 25)</li>
          <li>• Extra time on mobility stretches</li>
          <li>• Foam rolling if available</li>
          <li>• Light yoga or stretching routine</li>
        </ul>
      </div>
    </div>
  {/if}

  <!-- Session completion (future feature) -->
  {#if !data.isFuture && data.session.completedAt}
    <div class="mt-6 text-center py-4 bg-green-500/10 border border-green-500/30 rounded-lg">
      <span class="text-green-400 font-medium">
        ✓ Workout completed on {new Date(data.session.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </span>
    </div>
  {/if}
</div>
