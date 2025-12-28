<script lang="ts">
  import type { PageData } from './$types';
  import { SOURCES, TRIGGERS } from 'svelte-dnd-action';
  import {
    TaskColumn,
    AddTaskForm,
    CreateLabelModal,
    ConfirmModal,
    type Task,
    type ColumnId,
  } from '$lib/components/tasks';

  let { data }: { data: PageData } = $props();

  // ─────────────────────────────────────────────────────────────────────────────
  // Task State
  // ─────────────────────────────────────────────────────────────────────────────

  // Local state for tasks (will be updated by drag-and-drop)
  // Initialize once from server data - NO $effect to sync because that causes snap-back during drag
  // svelte-ignore state_referenced_locally
  let todoTasks = $state([...data.todoTasks] as Task[]);
  // svelte-ignore state_referenced_locally
  let inProgressTasks = $state([...data.inProgressTasks] as Task[]);
  // svelte-ignore state_referenced_locally
  let doneTasks = $state([...data.doneTasks] as Task[]);

  // Track last known data reference to detect actual page navigations/reloads
  // svelte-ignore state_referenced_locally
  let lastDataRef = data;

  // Only sync when the data object itself changes (navigation/reload), not on reactivity updates
  $effect.pre(() => {
    if (data !== lastDataRef) {
      lastDataRef = data;
      todoTasks = [...data.todoTasks] as Task[];
      inProgressTasks = [...data.inProgressTasks] as Task[];
      doneTasks = [...data.doneTasks] as Task[];
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UI State
  // ─────────────────────────────────────────────────────────────────────────────

  // Add form state - per column
  let addFormColumn = $state<ColumnId | null>(null);
  let newTaskTitle = $state('');
  let newTaskDescription = $state('');
  let newTaskLabelIds = $state<number[]>([]);
  let showLabelPicker = $state(false);

  // Edit state
  let editingTaskId = $state<number | null>(null);
  let editTitle = $state('');
  let editDescription = $state('');
  let editLabelIds = $state<number[]>([]);

  // Delete confirmation state
  let taskToDelete = $state<Task | null>(null);

  // Label modal state
  let showCreateLabel = $state(false);
  let newLabelName = $state('');
  let newLabelColor = $state('#3b82f6');

  // Done column state
  let showAllDone = $state(false);

  const flipDurationMs = 200;

  // ─────────────────────────────────────────────────────────────────────────────
  // Task Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  function setTasksForColumn(columnId: ColumnId, tasks: Task[]) {
    if (columnId === 'todo') todoTasks = tasks;
    else if (columnId === 'in_progress') inProgressTasks = tasks;
    else doneTasks = tasks;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Edit Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  function startEdit(task: Task) {
    editingTaskId = task.id;
    editTitle = task.title;
    editDescription = task.description || '';
    editLabelIds = task.labels.map((l) => l.id);
  }

  function cancelEdit() {
    editingTaskId = null;
    editTitle = '';
    editDescription = '';
    editLabelIds = [];
  }

  function toggleEditLabel(labelId: number) {
    if (editLabelIds.includes(labelId)) {
      editLabelIds = editLabelIds.filter((id) => id !== labelId);
    } else {
      editLabelIds = [...editLabelIds, labelId];
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Delete Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  function requestDelete(task: Task) {
    taskToDelete = task;
  }

  function cancelDelete() {
    taskToDelete = null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Add Form Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  function openAddForm(columnId: ColumnId) {
    addFormColumn = columnId;
  }

  function toggleLabel(labelId: number) {
    if (newTaskLabelIds.includes(labelId)) {
      newTaskLabelIds = newTaskLabelIds.filter((id) => id !== labelId);
    } else {
      newTaskLabelIds = [...newTaskLabelIds, labelId];
    }
  }

  function resetAddForm() {
    newTaskTitle = '';
    newTaskDescription = '';
    newTaskLabelIds = [];
    addFormColumn = null;
    showLabelPicker = false;
  }

  function clearAddFormForNextTask() {
    // Clear fields but keep form open for rapid entry
    newTaskTitle = '';
    newTaskDescription = '';
    newTaskLabelIds = [];
    showLabelPicker = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Label Modal Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  function resetCreateLabel() {
    newLabelName = '';
    newLabelColor = '#3b82f6';
    showCreateLabel = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Drag and Drop Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  function handleDndConsider(columnId: ColumnId, e: CustomEvent<{ items: Task[] }>) {
    setTasksForColumn(columnId, e.detail.items);
  }

  function handleDndFinalize(
    columnId: ColumnId,
    e: CustomEvent<{ items: Task[]; info: { source: string; trigger: string } }>
  ) {
    const { items, info } = e.detail;
    setTasksForColumn(columnId, items);

    // Only persist if this was a drop (not just a cancel)
    if (info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED_INTO_ZONE) {
      persistColumnOrder(columnId, items);
    }
  }

  async function persistColumnOrder(columnId: ColumnId, items: Task[]) {
    // Use fetch to persist without triggering SvelteKit's automatic data reload
    // This prevents the snap-back issue during drag-and-drop

    // First, update status for any tasks that changed columns
    for (let i = 0; i < items.length; i++) {
      const task = items[i];
      if (task.status !== columnId) {
        const formData = new FormData();
        formData.append('taskId', String(task.id));
        formData.append('status', columnId);
        formData.append('sortOrder', String(i));

        await fetch('?/moveTask', {
          method: 'POST',
          body: formData,
        });

        // Update local status so subsequent operations know the new status
        task.status = columnId;
      }
    }

    // Then persist the column order
    const formData = new FormData();
    formData.append('taskIds', JSON.stringify(items.map((t) => t.id)));

    await fetch('?/reorderColumn', {
      method: 'POST',
      body: formData,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared Column Props
  // ─────────────────────────────────────────────────────────────────────────────

  const sharedColumnProps = $derived({
    editingTaskId,
    editTitle,
    editDescription,
    editLabelIds,
    availableLabels: data.labels,
    flipDurationMs,
    onDndConsider: handleDndConsider,
    onDndFinalize: handleDndFinalize,
    onStartEdit: startEdit,
    onCancelEdit: cancelEdit,
    onEditTitleChange: (v: string) => (editTitle = v),
    onEditDescriptionChange: (v: string) => (editDescription = v),
    onToggleEditLabel: toggleEditLabel,
    onRequestDelete: requestDelete,
  });

  // Shared add form props generator
  function getAddFormProps(columnId: ColumnId) {
    return {
      isOpen: addFormColumn === columnId,
      title: newTaskTitle,
      description: newTaskDescription,
      selectedLabelIds: newTaskLabelIds,
      availableLabels: data.labels,
      showLabelPicker,
      targetStatus: columnId,
      onToggleForm: () => openAddForm(columnId),
      onTitleChange: (v: string) => (newTaskTitle = v),
      onDescriptionChange: (v: string) => (newTaskDescription = v),
      onToggleLabel: toggleLabel,
      onToggleLabelPicker: () => (showLabelPicker = !showLabelPicker),
      onCreateNewLabel: () => (showCreateLabel = true),
      onReset: resetAddForm,
      onTaskCreated: clearAddFormForNextTask,
    };
  }
</script>

<div class="h-[calc(100vh-120px)] flex flex-col">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-bold flex items-center gap-3">
      <img src="/icon-tasks.svg" alt="" class="w-8 h-8" />
      Tasks
    </h1>
  </div>

  <div class="flex-1 flex gap-4 overflow-x-auto pb-4">
    <!-- Todo Column -->
    <TaskColumn
      columnId="todo"
      tasks={todoTasks}
      {...sharedColumnProps}
      onTasksChange={(tasks) => (todoTasks = tasks)}
    >
      {#snippet addForm()}
        <AddTaskForm {...getAddFormProps('todo')} />
      {/snippet}
    </TaskColumn>

    <!-- In Progress Column -->
    <TaskColumn
      columnId="in_progress"
      tasks={inProgressTasks}
      {...sharedColumnProps}
      onTasksChange={(tasks) => (inProgressTasks = tasks)}
    >
      {#snippet addForm()}
        <AddTaskForm {...getAddFormProps('in_progress')} />
      {/snippet}
    </TaskColumn>

    <!-- Done Column -->
    <TaskColumn
      columnId="done"
      tasks={doneTasks}
      {...sharedColumnProps}
      {showAllDone}
      onTasksChange={(tasks) => (doneTasks = tasks)}
      onToggleShowAllDone={() => (showAllDone = !showAllDone)}
    >
      {#snippet addForm()}
        <AddTaskForm {...getAddFormProps('done')} />
      {/snippet}
    </TaskColumn>
  </div>

  <!-- Delete Confirmation Modal -->
  <ConfirmModal
    isOpen={taskToDelete !== null}
    title="Delete Task"
    message="Are you sure you want to delete this task? This action cannot be undone."
    confirmText="Delete"
    cancelText="Cancel"
    formAction="?/deleteTask"
    formData={taskToDelete ? { taskId: taskToDelete.id } : undefined}
    onCancel={cancelDelete}
  />

  <!-- Create Label Modal -->
  <CreateLabelModal
    isOpen={showCreateLabel}
    labelName={newLabelName}
    labelColor={newLabelColor}
    onClose={resetCreateLabel}
    onNameChange={(v) => (newLabelName = v)}
    onColorChange={(v) => (newLabelColor = v)}
  />

  <div class="mt-2 text-xs text-[var(--color-text-muted)]">
    Drag tasks between columns • Hover over cards to see actions
  </div>
</div>
