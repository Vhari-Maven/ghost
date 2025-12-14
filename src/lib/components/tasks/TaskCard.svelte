<script lang="ts">
  import { enhance } from '$app/forms';
  import { ChevronLeft, ChevronRight, Edit, Trash, Tag } from './icons';
  import type { Task, ColumnId, TaskLabel } from './types';
  import { COLUMN_CONFIG } from './types';

  type Props = {
    task: Task;
    columnId: ColumnId;
    isEditing: boolean;
    editTitle: string;
    editDescription: string;
    editLabelIds: number[];
    availableLabels: TaskLabel[];
    onStartEdit: (task: Task) => void;
    onCancelEdit: () => void;
    onEditTitleChange: (value: string) => void;
    onEditDescriptionChange: (value: string) => void;
    onToggleEditLabel: (labelId: number) => void;
    onRequestDelete: (task: Task) => void;
    isDone?: boolean;
  };

  let {
    task,
    columnId,
    isEditing,
    editTitle,
    editDescription,
    editLabelIds,
    availableLabels,
    onStartEdit,
    onCancelEdit,
    onEditTitleChange,
    onEditDescriptionChange,
    onToggleEditLabel,
    onRequestDelete,
    isDone = false,
  }: Props = $props();

  const config = $derived(COLUMN_CONFIG[columnId]);

  let showLabelPicker = $state(false);
</script>

{#if isEditing}
  <form
    method="POST"
    action="?/updateTask"
    class="bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-lg p-3"
    use:enhance={() => {
      return async ({ update }) => {
        await update({ reset: false });
        // Also update labels
        const labelFormData = new FormData();
        labelFormData.append('taskId', String(task.id));
        labelFormData.append('labelIds', editLabelIds.join(','));
        await fetch('?/updateTaskLabels', {
          method: 'POST',
          body: labelFormData,
        });
        onCancelEdit();
      };
    }}
  >
    <input type="hidden" name="taskId" value={task.id} />
    <input
      type="text"
      name="title"
      value={editTitle}
      oninput={(e) => onEditTitleChange(e.currentTarget.value)}
      class="w-full bg-transparent border-none outline-none text-[var(--color-text)] font-medium mb-2"
      autofocus
    />
    <textarea
      name="description"
      value={editDescription}
      oninput={(e) => onEditDescriptionChange(e.currentTarget.value)}
      placeholder="Description (optional)"
      rows="2"
      class="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 outline-none text-sm text-[var(--color-text-muted)] resize-none focus:border-[var(--color-accent)]"
    ></textarea>

    <!-- Label Editor -->
    <div class="mt-2">
      <button
        type="button"
        onclick={() => (showLabelPicker = !showLabelPicker)}
        class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1"
      >
        <Tag />
        Labels
        {#if editLabelIds.length > 0}
          <span class="bg-[var(--color-accent)] text-white text-[10px] px-1.5 rounded-full">
            {editLabelIds.length}
          </span>
        {/if}
      </button>

      {#if showLabelPicker}
        <div class="mt-2 p-2 bg-[var(--color-bg)] rounded border border-[var(--color-border)]">
          <div class="flex flex-wrap gap-1">
            {#each availableLabels as label}
              <button
                type="button"
                onclick={() => onToggleEditLabel(label.id)}
                class="px-2 py-0.5 text-xs rounded-full border transition-colors {editLabelIds.includes(label.id)
                  ? 'border-transparent'
                  : 'border-[var(--color-border)] opacity-60 hover:opacity-100'}"
                style="background-color: {label.color}20; color: {label.color}; {editLabelIds.includes(label.id) ? `background-color: ${label.color}40` : ''}"
              >
                {label.name}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <div class="flex gap-2 mt-3">
      <button
        type="submit"
        class="px-2 py-1 bg-[var(--color-accent)] text-white rounded text-xs font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
      >
        Save
      </button>
      <button
        type="button"
        onclick={onCancelEdit}
        class="px-2 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs transition-colors"
      >
        Cancel
      </button>
    </div>
  </form>
{:else}
  <div
    class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 hover:border-[var(--color-accent)]/50 transition-colors group cursor-grab active:cursor-grabbing"
    class:opacity-75={isDone}
  >
    {#if task.labels.length > 0}
      <div class="flex flex-wrap gap-1 mb-2">
        {#each task.labels as label}
          <span
            class="px-2 py-0.5 text-[10px] rounded-full font-medium"
            style="background-color: {label.color}20; color: {label.color}"
          >
            {label.name}
          </span>
        {/each}
      </div>
    {/if}

    <h3 class="font-medium text-[var(--color-text)] mb-1" class:line-through={isDone}>
      {task.title}
    </h3>

    {#if task.description}
      <p class="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-2">
        {task.description}
      </p>
    {/if}

    <div class="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
      <!-- Move buttons -->
      <div class="flex gap-1">
        {#if config.canMoveLeft}
          <form method="POST" action="?/moveTask" use:enhance>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="status" value={config.leftTarget} />
            <input type="hidden" name="sortOrder" value="0" />
            <button
              type="submit"
              class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              title="Move left"
            >
              <ChevronLeft />
            </button>
          </form>
        {/if}
        {#if config.canMoveRight}
          <form method="POST" action="?/moveTask" use:enhance>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="status" value={config.rightTarget} />
            <input type="hidden" name="sortOrder" value="0" />
            <button
              type="submit"
              class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              title="Move right"
            >
              <ChevronRight />
            </button>
          </form>
        {/if}
      </div>

      <!-- Edit / Delete buttons -->
      <div class="flex gap-1">
        <button
          type="button"
          onclick={() => onStartEdit(task)}
          class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          title="Edit"
        >
          <Edit />
        </button>
        <button
          type="button"
          onclick={() => onRequestDelete(task)}
          class="p-1 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash />
        </button>
      </div>
    </div>
  </div>
{/if}
