import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { tasks, taskLabels, taskLabelAssignments, type TaskStatus, TASK_STATUSES } from '$lib/db/schema';
import { eq, asc, desc, and, inArray, max, like } from 'drizzle-orm';

type TaskWithLabels = {
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

export const load: PageServerLoad = async () => {
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
  const assignments = await db
    .select()
    .from(taskLabelAssignments);

  // Create a map of taskId -> labels
  const taskLabelsMap = new Map<number, Array<{ id: number; name: string; color: string }>>();

  for (const assignment of assignments) {
    const label = allLabels.find(l => l.id === assignment.labelId);
    if (label) {
      const existing = taskLabelsMap.get(assignment.taskId) || [];
      existing.push({ id: label.id, name: label.name, color: label.color });
      taskLabelsMap.set(assignment.taskId, existing);
    }
  }

  // Attach labels to tasks and group by status
  const tasksWithLabels: TaskWithLabels[] = allTasks.map(task => ({
    ...task,
    labels: taskLabelsMap.get(task.id) || []
  }));

  const todoTasks = tasksWithLabels
    .filter(t => t.status === 'todo')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const inProgressTasks = tasksWithLabels
    .filter(t => t.status === 'in_progress')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Done tasks sorted by completedAt descending (most recent first)
  const doneTasks = tasksWithLabels
    .filter(t => t.status === 'done')
    .sort((a, b) => {
      if (a.completedAt && b.completedAt) {
        return b.completedAt.localeCompare(a.completedAt);
      }
      return b.sortOrder - a.sortOrder;
    });

  return {
    todoTasks,
    inProgressTasks,
    doneTasks,
    labels: allLabels
  };
};

export const actions: Actions = {
  createTask: async ({ request }) => {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const labelIds = formData.get('labelIds') as string | null;

    if (!title?.trim()) {
      return { success: false, error: 'Title is required' };
    }

    // Get the max sortOrder for todo column
    const maxOrder = await db
      .select({ max: max(tasks.sortOrder) })
      .from(tasks)
      .where(eq(tasks.status, 'todo'))
      .get();

    const newSortOrder = (maxOrder?.max ?? -1) + 1;

    // Insert the task
    const result = await db
      .insert(tasks)
      .values({
        title: title.trim(),
        description: description?.trim() || null,
        status: 'todo',
        sortOrder: newSortOrder,
      })
      .returning({ id: tasks.id });

    const taskId = result[0].id;

    // Assign labels if provided
    if (labelIds) {
      const ids = labelIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      for (const labelId of ids) {
        await db.insert(taskLabelAssignments).values({
          taskId,
          labelId,
        });
      }
    }

    return { success: true, taskId };
  },

  updateTask: async ({ request }) => {
    const formData = await request.formData();
    const taskId = parseInt(formData.get('taskId') as string);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;

    if (!taskId || isNaN(taskId)) {
      return { success: false, error: 'Invalid task ID' };
    }

    if (!title?.trim()) {
      return { success: false, error: 'Title is required' };
    }

    await db
      .update(tasks)
      .set({
        title: title.trim(),
        description: description?.trim() || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, taskId));

    return { success: true };
  },

  deleteTask: async ({ request }) => {
    const formData = await request.formData();
    const taskId = parseInt(formData.get('taskId') as string);

    if (!taskId || isNaN(taskId)) {
      return { success: false, error: 'Invalid task ID' };
    }

    // Cascade will handle label assignments
    await db.delete(tasks).where(eq(tasks.id, taskId));

    return { success: true };
  },

  moveTask: async ({ request }) => {
    const formData = await request.formData();
    const taskId = parseInt(formData.get('taskId') as string);
    const status = formData.get('status') as TaskStatus;
    const sortOrder = parseInt(formData.get('sortOrder') as string);

    if (!taskId || isNaN(taskId)) {
      return { success: false, error: 'Invalid task ID' };
    }

    if (!TASK_STATUSES.includes(status)) {
      return { success: false, error: 'Invalid status' };
    }

    // Get current task to check if status changed
    const currentTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .get();

    if (!currentTask) {
      return { success: false, error: 'Task not found' };
    }

    const updateData: Record<string, any> = {
      status,
      sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
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

    await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId));

    return { success: true };
  },

  reorderColumn: async ({ request }) => {
    const formData = await request.formData();
    const taskIdsJson = formData.get('taskIds') as string;

    if (!taskIdsJson) {
      return { success: false, error: 'No task IDs provided' };
    }

    let taskIds: number[];
    try {
      taskIds = JSON.parse(taskIdsJson);
    } catch {
      return { success: false, error: 'Invalid task IDs format' };
    }

    // Update sortOrder for each task based on position in array
    for (let i = 0; i < taskIds.length; i++) {
      await db
        .update(tasks)
        .set({ sortOrder: i, updatedAt: new Date().toISOString() })
        .where(eq(tasks.id, taskIds[i]));
    }

    return { success: true };
  },

  createLabel: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const color = formData.get('color') as string;

    if (!name?.trim()) {
      return { success: false, error: 'Label name is required' };
    }

    if (!color?.match(/^#[0-9a-fA-F]{6}$/)) {
      return { success: false, error: 'Invalid color format' };
    }

    try {
      const result = await db
        .insert(taskLabels)
        .values({
          name: name.trim().toLowerCase(),
          color,
        })
        .returning({ id: taskLabels.id });

      return { success: true, labelId: result[0].id };
    } catch (e: any) {
      if (e.message?.includes('UNIQUE constraint failed')) {
        return { success: false, error: 'Label already exists' };
      }
      throw e;
    }
  },

  deleteLabel: async ({ request }) => {
    const formData = await request.formData();
    const labelId = parseInt(formData.get('labelId') as string);

    if (!labelId || isNaN(labelId)) {
      return { success: false, error: 'Invalid label ID' };
    }

    // Cascade will handle assignments
    await db.delete(taskLabels).where(eq(taskLabels.id, labelId));

    return { success: true };
  },

  updateTaskLabels: async ({ request }) => {
    const formData = await request.formData();
    const taskId = parseInt(formData.get('taskId') as string);
    const labelIds = formData.get('labelIds') as string | null;

    if (!taskId || isNaN(taskId)) {
      return { success: false, error: 'Invalid task ID' };
    }

    // Remove all existing assignments
    await db
      .delete(taskLabelAssignments)
      .where(eq(taskLabelAssignments.taskId, taskId));

    // Add new assignments
    if (labelIds) {
      const ids = labelIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      for (const labelId of ids) {
        await db.insert(taskLabelAssignments).values({
          taskId,
          labelId,
        });
      }
    }

    await db
      .update(tasks)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(tasks.id, taskId));

    return { success: true };
  },

  // Test cleanup action - deletes tasks matching a pattern (for E2E test cleanup)
  cleanupTestTasks: async ({ request }) => {
    const formData = await request.formData();
    const pattern = formData.get('pattern') as string;

    if (!pattern) {
      return { success: false, error: 'Pattern is required' };
    }

    // Delete tasks where title matches the pattern (using SQL LIKE)
    await db.delete(tasks).where(like(tasks.title, pattern));

    return { success: true };
  },
};
