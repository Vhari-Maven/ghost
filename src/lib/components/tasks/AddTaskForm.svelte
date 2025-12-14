<script lang="ts">
  import { enhance } from '$app/forms';
  import { Plus } from './icons';
  import LabelPicker from './LabelPicker.svelte';
  import type { TaskLabel, ColumnId } from './types';

  type Props = {
    isOpen: boolean;
    title: string;
    description: string;
    selectedLabelIds: number[];
    availableLabels: TaskLabel[];
    showLabelPicker: boolean;
    targetStatus?: ColumnId;
    onToggleForm: () => void;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onToggleLabel: (labelId: number) => void;
    onToggleLabelPicker: () => void;
    onCreateNewLabel: () => void;
    onReset: () => void;
    onTaskCreated?: () => void;
  };

  let {
    isOpen,
    title,
    description,
    selectedLabelIds,
    availableLabels,
    showLabelPicker,
    targetStatus = 'todo',
    onToggleForm,
    onTitleChange,
    onDescriptionChange,
    onToggleLabel,
    onToggleLabelPicker,
    onCreateNewLabel,
    onReset,
    onTaskCreated,
  }: Props = $props();

  let titleInput: HTMLInputElement | undefined = $state();
</script>

<div class="mb-2">
  {#if isOpen}
    <form
      method="POST"
      action="?/createTask"
      class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3"
      use:enhance={() => {
        return async ({ update }) => {
          await update({ reset: false });
          if (onTaskCreated) {
            onTaskCreated();
            // Refocus the title input for rapid entry
            setTimeout(() => titleInput?.focus(), 0);
          } else {
            onReset();
          }
        };
      }}
    >
      <input
        bind:this={titleInput}
        type="text"
        name="title"
        value={title}
        oninput={(e) => onTitleChange(e.currentTarget.value)}
        placeholder="Task title..."
        class="w-full bg-transparent border-none outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] font-medium mb-2"
        autofocus
      />

      <textarea
        name="description"
        value={description}
        oninput={(e) => onDescriptionChange(e.currentTarget.value)}
        placeholder="Description (optional)"
        rows="2"
        class="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 outline-none text-sm text-[var(--color-text-muted)] placeholder-[var(--color-border)] resize-none focus:border-[var(--color-accent)]"
      ></textarea>

      <LabelPicker
        labels={availableLabels}
        selectedIds={selectedLabelIds}
        isOpen={showLabelPicker}
        onToggle={onToggleLabelPicker}
        onSelectLabel={onToggleLabel}
        onCreateNew={onCreateNewLabel}
      />

      <input type="hidden" name="labelIds" value={selectedLabelIds.join(',')} />
      <input type="hidden" name="status" value={targetStatus} />

      <div class="flex gap-2 mt-3">
        <button
          type="submit"
          disabled={!title.trim()}
          class="px-3 py-1 bg-[var(--color-accent)] text-white rounded text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onclick={onReset}
          class="px-3 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  {:else}
    <button
      onclick={onToggleForm}
      class="w-full p-3 border border-dashed border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors text-sm flex items-center justify-center gap-2"
    >
      <Plus />
      Add task
    </button>
  {/if}
</div>
