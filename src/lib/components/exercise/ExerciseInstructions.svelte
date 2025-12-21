<script lang="ts">
  import type { ExerciseInstructions } from '$lib/data/exercises';
  import GlossaryText from '$lib/components/GlossaryText.svelte';
  import EquipmentLink from './EquipmentLink.svelte';
  import VideoModal from './VideoModal.svelte';

  let {
    instructions,
    equipment,
    starterWeight,
    videoId,
    exerciseName
  }: {
    instructions: ExerciseInstructions;
    equipment: string[];
    starterWeight?: string;
    videoId?: string;
    exerciseName?: string;
  } = $props();

  let isOpen = $state(false);
  let showVideo = $state(false);
</script>

<div class="border-t border-[var(--color-border)]/50 mt-3 pt-3">
  <div class="flex items-center gap-4">
    <button
      type="button"
      onclick={() => isOpen = !isOpen}
      class="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
    >
      <svg
        class="w-4 h-4 transition-transform {isOpen ? 'rotate-90' : ''}"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <span>{isOpen ? 'Hide' : 'Show'} Instructions</span>
    </button>

    {#if videoId}
      <button
        type="button"
        onclick={() => showVideo = true}
        class="flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        <span>Watch Demo</span>
      </button>
    {/if}
  </div>

  {#if isOpen}
    <div class="mt-4 space-y-4 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
      <!-- Starter Weight (prominent!) -->
      {#if starterWeight}
        <div class="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-lg p-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">🏋️</span>
            <div>
              <h5 class="font-semibold text-[var(--color-accent)]">Start With</h5>
              <p class="text-lg font-bold text-[var(--color-text)]">{starterWeight}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Equipment -->
      <div>
        <h5 class="font-medium text-[var(--color-accent)] mb-1">Equipment</h5>
        <p class="text-[var(--color-text-muted)]">
          {#each equipment as item, i}
            <EquipmentLink name={item} />{#if i < equipment.length - 1}, {/if}
          {/each}
        </p>
      </div>

      <!-- Setup -->
      <div>
        <h5 class="font-medium text-[var(--color-accent)] mb-1">Setup</h5>
        <p class="text-[var(--color-text-muted)]"><GlossaryText text={instructions.setup} /></p>
      </div>

      <!-- Execution -->
      <div>
        <h5 class="font-medium text-[var(--color-accent)] mb-1">How to Perform</h5>
        <ol class="list-decimal list-inside space-y-1 text-[var(--color-text-muted)]">
          {#each instructions.execution as step}
            <li><GlossaryText text={step} /></li>
          {/each}
        </ol>
      </div>

      <!-- Form Cues -->
      <div>
        <h5 class="font-medium text-[var(--color-accent)] mb-1">Form Cues</h5>
        <ul class="list-disc list-inside space-y-1 text-[var(--color-text-muted)]">
          {#each instructions.formCues as cue}
            <li><GlossaryText text={cue} /></li>
          {/each}
        </ul>
      </div>

      <!-- Common Mistakes -->
      <div>
        <h5 class="font-medium text-amber-400 mb-1">Common Mistakes to Avoid</h5>
        <ul class="list-disc list-inside space-y-1 text-[var(--color-text-muted)]">
          {#each instructions.commonMistakes as mistake}
            <li><GlossaryText text={mistake} /></li>
          {/each}
        </ul>
      </div>

      <!-- Tips -->
      <div>
        <h5 class="font-medium text-green-400 mb-1">Tips</h5>
        <ul class="list-disc list-inside space-y-1 text-[var(--color-text-muted)]">
          {#each instructions.tips as tip}
            <li><GlossaryText text={tip} /></li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}
</div>

{#if videoId}
  <VideoModal {videoId} title={exerciseName ?? 'Exercise Demo'} bind:isOpen={showVideo} />
{/if}
