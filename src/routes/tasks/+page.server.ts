import type { PageServerLoad, Actions } from './$types';
import {
  getTasksByStatus,
  getAllLabels,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  reorderColumn,
  createLabel,
  deleteLabel,
  updateTaskLabels,
  cleanupTestTasks,
  isValidTaskStatus,
  parseTaskId,
  parseLabelIds,
  isValidHexColor,
} from '$lib/services/tasks';

export const load: PageServerLoad = async () => {
  const [tasksByStatus, labels] = await Promise.all([
    getTasksByStatus(),
    getAllLabels(),
  ]);

  return {
    ...tasksByStatus,
    labels,
  };
};

export const actions: Actions = {
  createTask: async ({ request }) => {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const labelIdsStr = formData.get('labelIds') as string | null;
    const status = formData.get('status') as string | null;

    if (!title?.trim()) {
      return { success: false, error: 'Title is required' };
    }

    const result = await createTask({
      title,
      description,
      labelIds: parseLabelIds(labelIdsStr),
      status: status && isValidTaskStatus(status) ? status : undefined,
    });

    return { success: true, taskId: result.taskId };
  },

  updateTask: async ({ request }) => {
    const formData = await request.formData();
    const taskId = parseTaskId(formData.get('taskId') as string);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;

    if (!taskId) {
      return { success: false, error: 'Invalid task ID' };
    }

    if (!title?.trim()) {
      return { success: false, error: 'Title is required' };
    }

    await updateTask({ taskId, title, description });
    return { success: true };
  },

  deleteTask: async ({ request }) => {
    const formData = await request.formData();
    const taskId = parseTaskId(formData.get('taskId') as string);

    if (!taskId) {
      return { success: false, error: 'Invalid task ID' };
    }

    await deleteTask(taskId);
    return { success: true };
  },

  moveTask: async ({ request }) => {
    const formData = await request.formData();
    const taskId = parseTaskId(formData.get('taskId') as string);
    const status = formData.get('status') as string;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

    if (!taskId) {
      return { success: false, error: 'Invalid task ID' };
    }

    if (!isValidTaskStatus(status)) {
      return { success: false, error: 'Invalid status' };
    }

    try {
      await moveTask({ taskId, status, sortOrder });
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
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

    await reorderColumn(taskIds);
    return { success: true };
  },

  createLabel: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const color = formData.get('color') as string;

    if (!name?.trim()) {
      return { success: false, error: 'Label name is required' };
    }

    if (!isValidHexColor(color)) {
      return { success: false, error: 'Invalid color format' };
    }

    try {
      const result = await createLabel({ name, color });
      return { success: true, labelId: result.labelId };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '';
      if (message.includes('UNIQUE constraint failed')) {
        return { success: false, error: 'Label already exists' };
      }
      throw e;
    }
  },

  deleteLabel: async ({ request }) => {
    const formData = await request.formData();
    const labelId = parseTaskId(formData.get('labelId') as string);

    if (!labelId) {
      return { success: false, error: 'Invalid label ID' };
    }

    await deleteLabel(labelId);
    return { success: true };
  },

  updateTaskLabels: async ({ request }) => {
    const formData = await request.formData();
    const taskId = parseTaskId(formData.get('taskId') as string);
    const labelIdsStr = formData.get('labelIds') as string | null;

    if (!taskId) {
      return { success: false, error: 'Invalid task ID' };
    }

    await updateTaskLabels(taskId, parseLabelIds(labelIdsStr));
    return { success: true };
  },

  cleanupTestTasks: async ({ request }) => {
    const formData = await request.formData();
    const pattern = formData.get('pattern') as string;

    if (!pattern) {
      return { success: false, error: 'Pattern is required' };
    }

    await cleanupTestTasks(pattern);
    return { success: true };
  },
};
