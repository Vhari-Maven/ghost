<script lang="ts">
  import { enhance } from '$app/forms';
  import DayNavigation from '$lib/components/exercise/DayNavigation.svelte';
  import WorkoutHeader from '$lib/components/exercise/WorkoutHeader.svelte';
  import ExerciseStackSection from '$lib/components/exercise/ExerciseStackSection.svelte';
  import ExerciseCard from '$lib/components/exercise/ExerciseCard.svelte';

  let { data } = $props();

  let isCompleting = $state(false);
</script>

<div class="max-w-3xl mx-auto">
  <!-- Day Navigation -->
  <DayNavigation weekDays={data.weekDays} isFuture={data.isFuture} />

  <!-- Workout Header -->
  <WorkoutHeader workoutInfo={data.workoutInfo} selectedDate={data.selectedDate} />

  <!--
    WORKOUT ORDER:
    1. Walking (warm-up cardio)
    2. Lifting (main workout)
    3. Core (abs after lifting)
    4. Stretching (cooldown mobility)
  -->

  <!-- 1. WALKING (Warm-up) -->
  <div class="mb-6">
    <ExerciseStackSection
      title="Warm Up"
      icon="🏃"
      items={data.alwaysDoByCategory.cardio}
      alwaysDoStatus={data.alwaysDoStatus}
      exercises={data.allExercises}
      sessionId={data.session.id}
      isFuture={data.isFuture}
      defaultOpen={true}
    />
  </div>

  <!-- 2. LIFTING (Main Workout) -->
  {#if data.exercises.length > 0}
    <div class="mb-6">
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
        <div class="mt-4 text-center text-sm text-[var(--color-text-muted)]">
          Comparing to your last {data.workoutInfo.label} workout on {new Date(data.historyDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      {/if}
    </div>
  {:else}
    <!-- Recovery Day message -->
    <div class="mb-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 text-center">
      <div class="text-4xl mb-3">🧘</div>
      <h3 class="text-lg font-semibold text-[var(--color-text)] mb-2">Active Recovery Day</h3>
      <p class="text-[var(--color-text-muted)] max-w-md mx-auto">
        No resistance training today. Focus on the cardio, core, and mobility sections — consider extending your walk
        and spending extra time on stretching.
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

  <!-- 3. CORE (After Lifting) -->
  <div class="mb-6">
    <ExerciseStackSection
      title="Core Work"
      icon="💪"
      items={data.alwaysDoByCategory.core}
      alwaysDoStatus={data.alwaysDoStatus}
      exercises={data.allExercises}
      sessionId={data.session.id}
      isFuture={data.isFuture}
      defaultOpen={true}
    />
  </div>

  <!-- 4. STRETCHING (Cooldown) -->
  <div class="mb-6">
    <ExerciseStackSection
      title="Stretching"
      icon="🧘"
      items={data.alwaysDoByCategory.mobility}
      alwaysDoStatus={data.alwaysDoStatus}
      exercises={data.allExercises}
      sessionId={data.session.id}
      isFuture={data.isFuture}
      defaultOpen={true}
    />
  </div>

  <!-- Session completion -->
  {#if !data.isFuture}
    {#if data.session.completedAt}
      <div class="mt-6 text-center py-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <span class="text-green-400 font-medium">
          ✓ Workout completed at {new Date(data.session.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>
    {:else}
      <form
        method="POST"
        action="?/completeSession"
        use:enhance={() => {
          isCompleting = true;
          return async ({ update }) => {
            await update();
            isCompleting = false;
          };
        }}
        class="mt-6"
      >
        <input type="hidden" name="sessionId" value={data.session.id} />
        <button
          type="submit"
          disabled={isCompleting}
          class="w-full py-4 rounded-lg font-medium text-lg transition-all
                 bg-[var(--color-accent)] text-white
                 hover:bg-[var(--color-accent-hover)] hover:shadow-lg hover:shadow-[var(--color-glow)]
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isCompleting}
            Completing...
          {:else}
            ✓ Complete Workout
          {/if}
        </button>
      </form>
    {/if}
  {/if}
</div>
