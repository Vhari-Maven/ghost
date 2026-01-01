<script lang="ts">
  import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Snippet } from 'svelte';
  import TaskCard from './TaskCard.svelte';
  import type { Task, ColumnId, TaskLabel } from './types';
  import { COLUMN_CONFIG } from './types';

  type Props = {
    columnId: ColumnId;
    tasks: Task[];
    editingTaskId: number | null;
    editTitle: string;
    editDescription: string;
    editLabelIds: number[];
    availableLabels: TaskLabel[];
    flipDurationMs?: number;
    showAllDone?: boolean;
    onTasksChange: (tasks: Task[]) => void;
    onDndConsider: (columnId: ColumnId, e: CustomEvent<{ items: Task[] }>) => void;
    onDndFinalize: (columnId: ColumnId, e: CustomEvent<{ items: Task[]; info: { source: string; trigger: string } }>) => void;
    onStartEdit: (task: Task) => void;
    onCancelEdit: () => void;
    onEditTitleChange: (value: string) => void;
    onEditDescriptionChange: (value: string) => void;
    onToggleEditLabel: (labelId: number) => void;
    onRequestDelete: (task: Task) => void;
    onToggleShowAllDone?: () => void;
    addForm?: Snippet;
  };

  let {
    columnId,
    tasks,
    editingTaskId,
    editTitle,
    editDescription,
    editLabelIds,
    availableLabels,
    flipDurationMs = 200,
    showAllDone = false,
    onTasksChange,
    onDndConsider,
    onDndFinalize,
    onStartEdit,
    onCancelEdit,
    onEditTitleChange,
    onEditDescriptionChange,
    onToggleEditLabel,
    onRequestDelete,
    onToggleShowAllDone,
    addForm,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const config = COLUMN_CONFIG[columnId];
  // svelte-ignore state_referenced_locally
  const isDone = columnId === 'done';
  const DONE_PREVIEW_COUNT = 5;

  let displayedTasks = $derived(
    isDone && !showAllDone ? tasks.slice(0, DONE_PREVIEW_COUNT) : tasks
  );

  let hiddenCount = $derived(
    isDone ? Math.max(0, tasks.length - DONE_PREVIEW_COUNT) : 0
  );
</script>

<div class="flex-1 min-w-[300px] max-w-[400px] flex flex-col">
  <!-- Column Header -->
  <div class="flex items-center justify-between mb-3 px-1">
    <h2 class="font-semibold text-[var(--color-text-muted)] uppercase text-sm tracking-wide">
      {config.title}
    </h2>
    <span class="text-xs bg-[var(--color-surface)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full">
      {tasks.length}
    </span>
  </div>

  <!-- Add form snippet (only used in Todo column) -->
  {#if addForm}
    {@render addForm()}
  {/if}

  <!-- Drag-and-drop zone -->
  <div
    class="flex-1 bg-[var(--color-surface)]/30 rounded-lg p-2 space-y-2 overflow-y-auto min-h-[100px] custom-scrollbar"
    use:dndzone={{ items: tasks, flipDurationMs, dropTargetStyle: {} }}
    onconsider={(e) => onDndConsider(columnId, e)}
    onfinalize={(e) => onDndFinalize(columnId, e)}
  >
    {#each displayedTasks as task (task.id)}
      <div animate:flip={{ duration: flipDurationMs }}>
        <TaskCard
          {task}
          {columnId}
          isEditing={editingTaskId === task.id}
          {editTitle}
          {editDescription}
          {editLabelIds}
          {availableLabels}
          {onStartEdit}
          {onCancelEdit}
          {onEditTitleChange}
          {onEditDescriptionChange}
          {onToggleEditLabel}
          {onRequestDelete}
          {isDone}
        />
      </div>
    {/each}

    <!-- Show All / Show Less toggle for Done column -->
    {#if isDone && hiddenCount > 0 && onToggleShowAllDone}
      <button
        type="button"
        onclick={onToggleShowAllDone}
        class="w-full py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        {showAllDone ? 'Show less' : `Show all (${tasks.length})`}
      </button>
    {/if}

    <!-- Empty state -->
    {#if tasks.length === 0}
      <div class="text-center py-8 text-[var(--color-text-muted)] text-sm">
        No tasks
      </div>
    {/if}
  </div>
</div>
