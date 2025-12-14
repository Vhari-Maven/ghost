<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';
  import { tick } from 'svelte';
  import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  let { data }: { data: PageData } = $props();

  // Local state for tasks (will be updated by drag-and-drop)
  let todoTasks = $state([...data.todoTasks]);
  let inProgressTasks = $state([...data.inProgressTasks]);
  let doneTasks = $state([...data.doneTasks]);

  // Sync from server data when it changes
  $effect(() => {
    todoTasks = [...data.todoTasks];
    inProgressTasks = [...data.inProgressTasks];
    doneTasks = [...data.doneTasks];
  });

  // UI state
  let showAddForm = $state(false);
  let newTaskTitle = $state('');
  let newTaskDescription = $state('');
  let newTaskLabelIds = $state<number[]>([]);
  let showAllDone = $state(false);
  let editingTaskId = $state<number | null>(null);
  let editTitle = $state('');
  let editDescription = $state('');

  // Label management
  let showLabelPicker = $state(false);
  let showCreateLabel = $state(false);
  let newLabelName = $state('');
  let newLabelColor = $state('#3b82f6');

  // Drag state
  let dragDisabled = $state(false);
  let pendingMoveForm: HTMLFormElement | null = null;

  const DONE_PREVIEW_COUNT = 5;
  const flipDurationMs = 200;

  const LABEL_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
  ];

  let displayedDoneTasks = $derived(
    showAllDone ? doneTasks : doneTasks.slice(0, DONE_PREVIEW_COUNT)
  );

  let hiddenDoneCount = $derived(
    Math.max(0, doneTasks.length - DONE_PREVIEW_COUNT)
  );

  type Task = typeof data.todoTasks[0];

  function startEdit(task: Task) {
    editingTaskId = task.id;
    editTitle = task.title;
    editDescription = task.description || '';
  }

  function cancelEdit() {
    editingTaskId = null;
    editTitle = '';
    editDescription = '';
  }

  function toggleLabel(labelId: number) {
    if (newTaskLabelIds.includes(labelId)) {
      newTaskLabelIds = newTaskLabelIds.filter(id => id !== labelId);
    } else {
      newTaskLabelIds = [...newTaskLabelIds, labelId];
    }
  }

  function resetAddForm() {
    newTaskTitle = '';
    newTaskDescription = '';
    newTaskLabelIds = [];
    showAddForm = false;
    showLabelPicker = false;
  }

  function resetCreateLabel() {
    newLabelName = '';
    newLabelColor = '#3b82f6';
    showCreateLabel = false;
  }

  // Drag and drop handlers
  function handleDndConsider(columnId: string, e: CustomEvent<{ items: Task[] }>) {
    const items = e.detail.items;
    if (columnId === 'todo') {
      todoTasks = items;
    } else if (columnId === 'in_progress') {
      inProgressTasks = items;
    } else if (columnId === 'done') {
      doneTasks = items;
    }
  }

  function handleDndFinalize(columnId: string, e: CustomEvent<{ items: Task[]; info: { source: string; trigger: string } }>) {
    const { items, info } = e.detail;

    // Update local state
    if (columnId === 'todo') {
      todoTasks = items;
    } else if (columnId === 'in_progress') {
      inProgressTasks = items;
    } else if (columnId === 'done') {
      doneTasks = items;
    }

    // Only persist if this was a drop (not just a cancel)
    if (info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED_INTO_ZONE) {
      // Persist the reorder for this column
      persistColumnOrder(columnId, items);
    }
  }

  async function persistColumnOrder(columnId: string, items: Task[]) {
    // Create and submit a form to persist the order
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '?/reorderColumn';
    form.style.display = 'none';

    const taskIdsInput = document.createElement('input');
    taskIdsInput.type = 'hidden';
    taskIdsInput.name = 'taskIds';
    taskIdsInput.value = JSON.stringify(items.map(t => t.id));
    form.appendChild(taskIdsInput);

    // Also update status for any tasks that changed columns
    for (let i = 0; i < items.length; i++) {
      const task = items[i];
      if (task.status !== columnId) {
        // This task moved columns - need to update its status
        const moveForm = document.createElement('form');
        moveForm.method = 'POST';
        moveForm.action = '?/moveTask';
        moveForm.style.display = 'none';

        const taskIdInput = document.createElement('input');
        taskIdInput.type = 'hidden';
        taskIdInput.name = 'taskId';
        taskIdInput.value = String(task.id);
        moveForm.appendChild(taskIdInput);

        const statusInput = document.createElement('input');
        statusInput.type = 'hidden';
        statusInput.name = 'status';
        statusInput.value = columnId;
        moveForm.appendChild(statusInput);

        const sortOrderInput = document.createElement('input');
        sortOrderInput.type = 'hidden';
        sortOrderInput.name = 'sortOrder';
        sortOrderInput.value = String(i);
        moveForm.appendChild(sortOrderInput);

        document.body.appendChild(moveForm);
        moveForm.requestSubmit();
        document.body.removeChild(moveForm);

        // Update local status so subsequent operations know the new status
        task.status = columnId;
      }
    }

    document.body.appendChild(form);
    form.requestSubmit();
    document.body.removeChild(form);
  }

  function getColumnTasks(columnId: string): Task[] {
    if (columnId === 'todo') return todoTasks;
    if (columnId === 'in_progress') return inProgressTasks;
    if (columnId === 'done') return displayedDoneTasks;
    return [];
  }
</script>

<div class="h-[calc(100vh-120px)] flex flex-col">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-bold">Tasks</h1>
  </div>

  <div class="flex-1 flex gap-4 overflow-x-auto pb-4">
    <!-- Todo Column -->
    <div class="flex-1 min-w-[300px] max-w-[400px] flex flex-col">
      <div class="flex items-center justify-between mb-3 px-1">
        <h2 class="font-semibold text-[var(--color-text-muted)] uppercase text-sm tracking-wide">
          Todo
        </h2>
        <span class="text-xs bg-[var(--color-surface)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full">
          {todoTasks.length}
        </span>
      </div>

      <div
        class="flex-1 bg-[var(--color-surface)]/30 rounded-lg p-2 space-y-2 overflow-y-auto min-h-[100px]"
        use:dndzone={{ items: todoTasks, flipDurationMs, dropTargetStyle: {} }}
        onconsider={(e) => handleDndConsider('todo', e)}
        onfinalize={(e) => handleDndFinalize('todo', e)}
      >
        <!-- Add Task Form -->
        {#if showAddForm}
          <form
            method="POST"
            action="?/createTask"
            class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3"
            use:enhance={() => {
              return async ({ update }) => {
                await update({ reset: false });
                resetAddForm();
              };
            }}
          >
            <input
              type="text"
              name="title"
              bind:value={newTaskTitle}
              placeholder="Task title..."
              class="w-full bg-transparent border-none outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] font-medium mb-2"
              autofocus
            />
            <textarea
              name="description"
              bind:value={newTaskDescription}
              placeholder="Description (optional)"
              rows="2"
              class="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 outline-none text-sm text-[var(--color-text-muted)] placeholder-[var(--color-border)] resize-none focus:border-[var(--color-accent)]"
            ></textarea>

            <!-- Label Picker -->
            <div class="mt-2">
              <button
                type="button"
                onclick={() => showLabelPicker = !showLabelPicker}
                class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Labels
                {#if newTaskLabelIds.length > 0}
                  <span class="bg-[var(--color-accent)] text-white text-[10px] px-1.5 rounded-full">{newTaskLabelIds.length}</span>
                {/if}
              </button>

              {#if showLabelPicker}
                <div class="mt-2 p-2 bg-[var(--color-bg)] rounded border border-[var(--color-border)]">
                  <div class="flex flex-wrap gap-1 mb-2">
                    {#each data.labels as label}
                      <button
                        type="button"
                        onclick={() => toggleLabel(label.id)}
                        class="px-2 py-0.5 text-xs rounded-full border transition-colors {newTaskLabelIds.includes(label.id)
                          ? 'border-transparent'
                          : 'border-[var(--color-border)] opacity-60 hover:opacity-100'}"
                        style="background-color: {label.color}20; color: {label.color}; {newTaskLabelIds.includes(label.id) ? `background-color: ${label.color}40` : ''}"
                      >
                        {label.name}
                      </button>
                    {/each}
                  </div>
                  <button
                    type="button"
                    onclick={() => showCreateLabel = !showCreateLabel}
                    class="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                  >
                    + New label
                  </button>
                </div>
              {/if}
            </div>

            <input type="hidden" name="labelIds" value={newTaskLabelIds.join(',')} />

            <div class="flex gap-2 mt-3">
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                class="px-3 py-1 bg-[var(--color-accent)] text-white rounded text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onclick={resetAddForm}
                class="px-3 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        {:else}
          <button
            onclick={() => showAddForm = true}
            class="w-full p-3 border border-dashed border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors text-sm flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add task
          </button>
        {/if}

        <!-- Task Cards -->
        {#each todoTasks as task (task.id)}
          <div animate:flip={{ duration: flipDurationMs }}>
            {#if editingTaskId === task.id}
              <form
                method="POST"
                action="?/updateTask"
                class="bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-lg p-3"
                use:enhance={() => {
                  return async ({ update }) => {
                    await update({ reset: false });
                    cancelEdit();
                  };
                }}
              >
                <input type="hidden" name="taskId" value={task.id} />
                <input
                  type="text"
                  name="title"
                  bind:value={editTitle}
                  class="w-full bg-transparent border-none outline-none text-[var(--color-text)] font-medium mb-2"
                  autofocus
                />
                <textarea
                  name="description"
                  bind:value={editDescription}
                  placeholder="Description (optional)"
                  rows="2"
                  class="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 outline-none text-sm text-[var(--color-text-muted)] resize-none focus:border-[var(--color-accent)]"
                ></textarea>
                <div class="flex gap-2 mt-2">
                  <button
                    type="submit"
                    class="px-2 py-1 bg-[var(--color-accent)] text-white rounded text-xs font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onclick={cancelEdit}
                    class="px-2 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            {:else}
              <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 hover:border-[var(--color-accent)]/50 transition-colors group cursor-grab active:cursor-grabbing">
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
                <h3 class="font-medium text-[var(--color-text)] mb-1">{task.title}</h3>
                {#if task.description}
                  <p class="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-2">{task.description}</p>
                {/if}
                <div class="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="flex gap-1">
                    <form method="POST" action="?/moveTask" use:enhance>
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="status" value="in_progress" />
                      <input type="hidden" name="sortOrder" value="0" />
                      <button type="submit" class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors" title="Move right">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </form>
                  </div>
                  <div class="flex gap-1">
                    <button type="button" onclick={() => startEdit(task)} class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors" title="Edit">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <form method="POST" action="?/deleteTask" use:enhance>
                      <input type="hidden" name="taskId" value={task.id} />
                      <button type="submit" class="p-1 text-[var(--color-text-muted)] hover:text-red-400 transition-colors" title="Delete" onclick={(e) => { if (!confirm('Delete this task?')) e.preventDefault(); }}>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- In Progress Column -->
    <div class="flex-1 min-w-[300px] max-w-[400px] flex flex-col">
      <div class="flex items-center justify-between mb-3 px-1">
        <h2 class="font-semibold text-[var(--color-text-muted)] uppercase text-sm tracking-wide">
          In Progress
        </h2>
        <span class="text-xs bg-[var(--color-surface)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full">
          {inProgressTasks.length}
        </span>
      </div>

      <div
        class="flex-1 bg-[var(--color-surface)]/30 rounded-lg p-2 space-y-2 overflow-y-auto min-h-[100px]"
        use:dndzone={{ items: inProgressTasks, flipDurationMs, dropTargetStyle: {} }}
        onconsider={(e) => handleDndConsider('in_progress', e)}
        onfinalize={(e) => handleDndFinalize('in_progress', e)}
      >
        {#each inProgressTasks as task (task.id)}
          <div animate:flip={{ duration: flipDurationMs }}>
            {#if editingTaskId === task.id}
              <form
                method="POST"
                action="?/updateTask"
                class="bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-lg p-3"
                use:enhance={() => {
                  return async ({ update }) => {
                    await update({ reset: false });
                    cancelEdit();
                  };
                }}
              >
                <input type="hidden" name="taskId" value={task.id} />
                <input
                  type="text"
                  name="title"
                  bind:value={editTitle}
                  class="w-full bg-transparent border-none outline-none text-[var(--color-text)] font-medium mb-2"
                  autofocus
                />
                <textarea
                  name="description"
                  bind:value={editDescription}
                  placeholder="Description (optional)"
                  rows="2"
                  class="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 outline-none text-sm text-[var(--color-text-muted)] resize-none focus:border-[var(--color-accent)]"
                ></textarea>
                <div class="flex gap-2 mt-2">
                  <button type="submit" class="px-2 py-1 bg-[var(--color-accent)] text-white rounded text-xs font-medium hover:bg-[var(--color-accent-hover)] transition-colors">Save</button>
                  <button type="button" onclick={cancelEdit} class="px-2 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs transition-colors">Cancel</button>
                </div>
              </form>
            {:else}
              <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 hover:border-[var(--color-accent)]/50 transition-colors group cursor-grab active:cursor-grabbing">
                {#if task.labels.length > 0}
                  <div class="flex flex-wrap gap-1 mb-2">
                    {#each task.labels as label}
                      <span class="px-2 py-0.5 text-[10px] rounded-full font-medium" style="background-color: {label.color}20; color: {label.color}">{label.name}</span>
                    {/each}
                  </div>
                {/if}
                <h3 class="font-medium text-[var(--color-text)] mb-1">{task.title}</h3>
                {#if task.description}
                  <p class="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-2">{task.description}</p>
                {/if}
                <div class="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="flex gap-1">
                    <form method="POST" action="?/moveTask" use:enhance>
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="status" value="todo" />
                      <input type="hidden" name="sortOrder" value="0" />
                      <button type="submit" class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors" title="Move left">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    </form>
                    <form method="POST" action="?/moveTask" use:enhance>
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="status" value="done" />
                      <input type="hidden" name="sortOrder" value="0" />
                      <button type="submit" class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors" title="Move right">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </form>
                  </div>
                  <div class="flex gap-1">
                    <button type="button" onclick={() => startEdit(task)} class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors" title="Edit">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <form method="POST" action="?/deleteTask" use:enhance>
                      <input type="hidden" name="taskId" value={task.id} />
                      <button type="submit" class="p-1 text-[var(--color-text-muted)] hover:text-red-400 transition-colors" title="Delete" onclick={(e) => { if (!confirm('Delete this task?')) e.preventDefault(); }}>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/each}

        {#if inProgressTasks.length === 0}
          <div class="text-center py-8 text-[var(--color-text-muted)] text-sm">
            No tasks
          </div>
        {/if}
      </div>
    </div>

    <!-- Done Column -->
    <div class="flex-1 min-w-[300px] max-w-[400px] flex flex-col">
      <div class="flex items-center justify-between mb-3 px-1">
        <h2 class="font-semibold text-[var(--color-text-muted)] uppercase text-sm tracking-wide">
          Done
        </h2>
        <span class="text-xs bg-[var(--color-surface)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full">
          {doneTasks.length}
        </span>
      </div>

      <div
        class="flex-1 bg-[var(--color-surface)]/30 rounded-lg p-2 space-y-2 overflow-y-auto min-h-[100px]"
        use:dndzone={{ items: doneTasks, flipDurationMs, dropTargetStyle: {} }}
        onconsider={(e) => handleDndConsider('done', e)}
        onfinalize={(e) => handleDndFinalize('done', e)}
      >
        {#each displayedDoneTasks as task (task.id)}
          <div animate:flip={{ duration: flipDurationMs }}>
            {#if editingTaskId === task.id}
              <form
                method="POST"
                action="?/updateTask"
                class="bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-lg p-3"
                use:enhance={() => {
                  return async ({ update }) => {
                    await update({ reset: false });
                    cancelEdit();
                  };
                }}
              >
                <input type="hidden" name="taskId" value={task.id} />
                <input
                  type="text"
                  name="title"
                  bind:value={editTitle}
                  class="w-full bg-transparent border-none outline-none text-[var(--color-text)] font-medium mb-2"
                  autofocus
                />
                <textarea
                  name="description"
                  bind:value={editDescription}
                  placeholder="Description (optional)"
                  rows="2"
                  class="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 outline-none text-sm text-[var(--color-text-muted)] resize-none focus:border-[var(--color-accent)]"
                ></textarea>
                <div class="flex gap-2 mt-2">
                  <button type="submit" class="px-2 py-1 bg-[var(--color-accent)] text-white rounded text-xs font-medium hover:bg-[var(--color-accent-hover)] transition-colors">Save</button>
                  <button type="button" onclick={cancelEdit} class="px-2 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs transition-colors">Cancel</button>
                </div>
              </form>
            {:else}
              <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 hover:border-[var(--color-accent)]/50 transition-colors group cursor-grab active:cursor-grabbing opacity-75">
                {#if task.labels.length > 0}
                  <div class="flex flex-wrap gap-1 mb-2">
                    {#each task.labels as label}
                      <span class="px-2 py-0.5 text-[10px] rounded-full font-medium" style="background-color: {label.color}20; color: {label.color}">{label.name}</span>
                    {/each}
                  </div>
                {/if}
                <h3 class="font-medium text-[var(--color-text)] mb-1 line-through">{task.title}</h3>
                {#if task.description}
                  <p class="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-2">{task.description}</p>
                {/if}
                <div class="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="flex gap-1">
                    <form method="POST" action="?/moveTask" use:enhance>
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="status" value="in_progress" />
                      <input type="hidden" name="sortOrder" value="0" />
                      <button type="submit" class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors" title="Move left">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    </form>
                  </div>
                  <div class="flex gap-1">
                    <button type="button" onclick={() => startEdit(task)} class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors" title="Edit">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <form method="POST" action="?/deleteTask" use:enhance>
                      <input type="hidden" name="taskId" value={task.id} />
                      <button type="submit" class="p-1 text-[var(--color-text-muted)] hover:text-red-400 transition-colors" title="Delete" onclick={(e) => { if (!confirm('Delete this task?')) e.preventDefault(); }}>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/each}

        {#if hiddenDoneCount > 0}
          <button
            type="button"
            onclick={() => showAllDone = !showAllDone}
            class="w-full py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {showAllDone ? 'Show less' : `Show all (${doneTasks.length})`}
          </button>
        {/if}

        {#if doneTasks.length === 0}
          <div class="text-center py-8 text-[var(--color-text-muted)] text-sm">
            No tasks
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Create Label Modal -->
  {#if showCreateLabel}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => resetCreateLabel()}>
      <form
        method="POST"
        action="?/createLabel"
        class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 w-80"
        onclick={(e) => e.stopPropagation()}
        use:enhance={() => {
          return async ({ update, result }) => {
            await update({ reset: false });
            if (result.type === 'success') {
              resetCreateLabel();
            }
          };
        }}
      >
        <h3 class="font-semibold mb-3">Create New Label</h3>
        <input
          type="text"
          name="name"
          bind:value={newLabelName}
          placeholder="Label name"
          class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-3 py-2 mb-3 outline-none focus:border-[var(--color-accent)]"
          autofocus
        />
        <div class="mb-3">
          <p class="text-xs text-[var(--color-text-muted)] mb-2">Color</p>
          <div class="flex flex-wrap gap-2">
            {#each LABEL_COLORS as color}
              <button
                type="button"
                onclick={() => newLabelColor = color}
                class="w-6 h-6 rounded-full border-2 transition-transform {newLabelColor === color ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}"
                style="background-color: {color}"
              ></button>
            {/each}
          </div>
        </div>
        <input type="hidden" name="color" value={newLabelColor} />
        <div class="flex gap-2 justify-end">
          <button
            type="button"
            onclick={() => resetCreateLabel()}
            class="px-3 py-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newLabelName.trim()}
            class="px-3 py-1.5 bg-[var(--color-accent)] text-white rounded text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  {/if}

  <div class="mt-2 text-xs text-[var(--color-text-muted)]">
    Drag tasks between columns • Hover over cards to see actions
  </div>
</div>
