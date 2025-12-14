import { db } from '$lib/db';
import { tasks, taskLabels, taskLabelAssignments, type TaskStatus, TASK_STATUSES } from '$lib/db/schema';
import { eq, asc, max, like } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TaskWithLabels = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  labels: Array<{ id: number; name: string; color: string }>;
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  labelIds?: number[];
  status?: TaskStatus;
};

export type UpdateTaskInput = {
  taskId: number;
  title: string;
  description?: string | null;
};

export type MoveTaskInput = {
  taskId: number;
  status: TaskStatus;
  sortOrder: number;
};

export type CreateLabelInput = {
  name: string;
  color: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Query Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all tasks with their labels, grouped by status
 */
export async function getTasksByStatus(): Promise<{
  todoTasks: TaskWithLabels[];
  inProgressTasks: TaskWithLabels[];
  doneTasks: TaskWithLabels[];
}> {
  // Fetch all tasks
  const allTasks = await db
    .select()
    .from(tasks)
    .orderBy(asc(tasks.sortOrder));

  // Fetch all labels
  const allLabels = await db
    .select()
    .from(taskLabels)
    .orderBy(asc(taskLabels.name));

  // Fetch all label assignments
  const assignments = await db.select().from(taskLabelAssignments);

  // Create a map of taskId -> labels
  const taskLabelsMap = new Map<number, Array<{ id: number; name: string; color: string }>>();

  for (const assignment of assignments) {
    const label = allLabels.find((l) => l.id === assignment.labelId);
    if (label) {
      const existing = taskLabelsMap.get(assignment.taskId) || [];
      existing.push({ id: label.id, name: label.name, color: label.color });
      taskLabelsMap.set(assignment.taskId, existing);
    }
  }

  // Attach labels to tasks
  const tasksWithLabels: TaskWithLabels[] = allTasks.map((task) => ({
    ...task,
    labels: taskLabelsMap.get(task.id) || [],
  }));

  // Group by status
  const todoTasks = tasksWithLabels
    .filter((t) => t.status === 'todo')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const inProgressTasks = tasksWithLabels
    .filter((t) => t.status === 'in_progress')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Done tasks sorted by completedAt descending (most recent first)
  const doneTasks = tasksWithLabels
    .filter((t) => t.status === 'done')
    .sort((a, b) => {
      if (a.completedAt && b.completedAt) {
        return b.completedAt.localeCompare(a.completedAt);
      }
      return b.sortOrder - a.sortOrder;
    });

  return { todoTasks, inProgressTasks, doneTasks };
}

/**
 * Get all labels
 */
export async function getAllLabels() {
  return db.select().from(taskLabels).orderBy(asc(taskLabels.name));
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput): Promise<{ taskId: number }> {
  const { title, description, labelIds, status = 'todo' } = input;

  // Get the max sortOrder for the target column
  const maxOrder = await db
    .select({ max: max(tasks.sortOrder) })
    .from(tasks)
    .where(eq(tasks.status, status))
    .get();

  const newSortOrder = (maxOrder?.max ?? -1) + 1;

  // Insert the task
  const result = await db
    .insert(tasks)
    .values({
      title: title.trim(),
      description: description?.trim() || null,
      status,
      sortOrder: newSortOrder,
    })
    .returning({ id: tasks.id });

  const taskId = result[0].id;

  // Assign labels if provided
  if (labelIds?.length) {
    for (const labelId of labelIds) {
      await db.insert(taskLabelAssignments).values({ taskId, labelId });
    }
  }

  return { taskId };
}

/**
 * Update a task's title and description
 */
export async function updateTask(input: UpdateTaskInput): Promise<void> {
  const { taskId, title, description } = input;

  await db
    .update(tasks)
    .set({
      title: title.trim(),
      description: description?.trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, taskId));
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: number): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, taskId));
}

/**
 * Move a task to a different column/status
 */
export async function moveTask(input: MoveTaskInput): Promise<void> {
  const { taskId, status, sortOrder } = input;

  // Get current task to check if status changed
  const currentTask = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();

  if (!currentTask) {
    throw new Error('Task not found');
  }

  const updateData: Record<string, unknown> = {
    status,
    sortOrder,
    updatedAt: new Date().toISOString(),
  };

  // Set completedAt when moving to done
  if (status === 'done' && currentTask.status !== 'done') {
    updateData.completedAt = new Date().toISOString();
  }

  // Clear completedAt when moving out of done
  if (status !== 'done' && currentTask.status === 'done') {
    updateData.completedAt = null;
  }

  await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));
}

/**
 * Reorder tasks within a column
 */
export async function reorderColumn(taskIds: number[]): Promise<void> {
  for (let i = 0; i < taskIds.length; i++) {
    await db
      .update(tasks)
      .set({ sortOrder: i, updatedAt: new Date().toISOString() })
      .where(eq(tasks.id, taskIds[i]));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Label Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new label
 */
export async function createLabel(input: CreateLabelInput): Promise<{ labelId: number }> {
  const { name, color } = input;

  const result = await db
    .insert(taskLabels)
    .values({
      name: name.trim().toLowerCase(),
      color,
    })
    .returning({ id: taskLabels.id });

  return { labelId: result[0].id };
}

/**
 * Delete a label
 */
export async function deleteLabel(labelId: number): Promise<void> {
  await db.delete(taskLabels).where(eq(taskLabels.id, labelId));
}

/**
 * Update labels for a task
 */
export async function updateTaskLabels(taskId: number, labelIds: number[]): Promise<void> {
  // Remove all existing assignments
  await db.delete(taskLabelAssignments).where(eq(taskLabelAssignments.taskId, taskId));

  // Add new assignments
  for (const labelId of labelIds) {
    await db.insert(taskLabelAssignments).values({ taskId, labelId });
  }

  await db
    .update(tasks)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, taskId));
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Delete tasks matching a pattern (for E2E test cleanup)
 */
export async function cleanupTestTasks(pattern: string): Promise<void> {
  await db.delete(tasks).where(like(tasks.title, pattern));
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function isValidTaskStatus(status: string): status is TaskStatus {
  return TASK_STATUSES.includes(status as TaskStatus);
}

export function parseTaskId(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

export function parseLabelIds(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));
}

export function isValidHexColor(color: string | null): boolean {
  if (!color) return false;
  return /^#[0-9a-fA-F]{6}$/.test(color);
}
