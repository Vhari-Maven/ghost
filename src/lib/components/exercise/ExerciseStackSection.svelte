<script lang="ts">
  import { enhance } from '$app/forms';
  import type { AlwaysDoItem, Exercise } from '$lib/data/exercises';
  import Accordion from '$lib/components/Accordion.svelte';
  import GlossaryText from '$lib/components/GlossaryText.svelte';
  import EquipmentLink from './EquipmentLink.svelte';

  let {
    title,
    icon,
    items,
    alwaysDoStatus,
    exercises,
    sessionId,
    isFuture = false,
    defaultOpen = true
  }: {
    title: string;
    icon: string;
    items: AlwaysDoItem[];
    alwaysDoStatus: Record<string, boolean>;
    exercises: Record<string, Exercise>;
    sessionId: number;
    isFuture?: boolean;
    defaultOpen?: boolean;
  } = $props();

  // Local optimistic state
  let localStatus = $state<Record<string, boolean>>({});

  // Track which exercise instructions are expanded
  let expandedInstructions = $state<Record<string, boolean>>({});

  // Initialize from server state
  $effect(() => {
    localStatus = { ...alwaysDoStatus };
  });

  const isCompleted = (id: string) => localStatus[id] ?? false;
  const toggleInstructions = (id: string) => {
    expandedInstructions[id] = !expandedInstructions[id];
  };
</script>

<Accordion {title} {icon} {defaultOpen}>
  <div class="space-y-2">
    {#each items as item}
      {@const completed = isCompleted(item.id)}
      {@const exercise = exercises[item.id]}
      {@const isExpanded = expandedInstructions[item.id] ?? false}

      <div class="rounded-lg border transition-all
        {completed
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-[var(--color-surface)] border-[var(--color-border)]'}">

        <!-- Main exercise row with checkbox -->
        <form
          method="POST"
          action="?/toggleAlwaysDo"
          use:enhance={() => {
            // Optimistic update
            localStatus[item.id] = !completed;
            return async ({ update }) => {
              await update({ reset: false });
            };
          }}
        >
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="exerciseId" value={item.id} />
          <input type="hidden" name="completed" value={!completed} />

          <button
            type="submit"
            disabled={isFuture}
            class="w-full flex items-center gap-3 p-3 text-left
              {isFuture ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
          >
            <!-- Checkbox -->
            <div
              class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                {completed
                  ? 'bg-green-500 border-green-500'
                  : 'border-[var(--color-border)]'}"
            >
              {#if completed}
                <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </div>

            <!-- Exercise info -->
            <div class="flex-1 min-w-0">
              <div class="font-medium {completed ? 'text-green-400 line-through' : 'text-[var(--color-text)]'}">
                {item.name}
              </div>
              <div class="text-sm text-[var(--color-text-muted)]">
                {#if item.sets && item.sets > 1}
                  {item.sets} sets ×
                {/if}
                {item.duration || item.reps}
              </div>
            </div>
          </button>
        </form>

        <!-- Instructions toggle button -->
        {#if exercise?.instructions}
          <button
            type="button"
            onclick={() => toggleInstructions(item.id)}
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-muted)]
              hover:text-[var(--color-text)] transition-colors border-t border-[var(--color-border)]"
          >
            <svg
              class="w-4 h-4 transition-transform {isExpanded ? 'rotate-90' : ''}"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span>How to do this exercise</span>
          </button>

          <!-- Expandable instructions -->
          {#if isExpanded}
            <div class="px-3 pb-3 space-y-3 border-t border-[var(--color-border)] pt-3">
              <!-- Equipment -->
              {#if exercise.equipment && exercise.equipment.length > 0 && exercise.equipment[0] !== 'Floor / Mat'}
                <div>
                  <h5 class="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide mb-1">
                    Equipment
                  </h5>
                  <p class="text-sm text-[var(--color-text-muted)]">
                    {#each exercise.equipment as equip, i}
                      <EquipmentLink name={equip} />{#if i < exercise.equipment.length - 1}, {/if}
                    {/each}
                  </p>
                </div>
              {/if}

              <!-- Setup -->
              <div>
                <h5 class="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide mb-1">
                  Setup
                </h5>
                <p class="text-sm text-[var(--color-text-muted)]">
                  <GlossaryText text={exercise.instructions.setup} />
                </p>
              </div>

              <!-- Execution steps -->
              <div>
                <h5 class="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide mb-1">
                  How to do it
                </h5>
                <ol class="text-sm text-[var(--color-text-muted)] space-y-1 list-decimal list-inside">
                  {#each exercise.instructions.execution as step}
                    <li><GlossaryText text={step} /></li>
                  {/each}
                </ol>
              </div>

              <!-- Form cues -->
              {#if exercise.instructions.formCues.length > 0}
                <div>
                  <h5 class="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide mb-1">
                    Key form cues
                  </h5>
                  <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
                    {#each exercise.instructions.formCues as cue}
                      <li class="flex gap-2">
                        <span class="text-green-400">✓</span>
                        <span><GlossaryText text={cue} /></span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}

              <!-- Common mistakes -->
              {#if exercise.instructions.commonMistakes.length > 0}
                <div>
                  <h5 class="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1">
                    Avoid these mistakes
                  </h5>
                  <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
                    {#each exercise.instructions.commonMistakes as mistake}
                      <li class="flex gap-2">
                        <span class="text-orange-400">✗</span>
                        <span><GlossaryText text={mistake} /></span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}

              <!-- Tips -->
              {#if exercise.instructions.tips.length > 0}
                <div>
                  <h5 class="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide mb-1">
                    Tips
                  </h5>
                  <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
                    {#each exercise.instructions.tips as tip}
                      <li class="flex gap-2">
                        <span class="text-[var(--color-accent)]">💡</span>
                        <span><GlossaryText text={tip} /></span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
</Accordion>
