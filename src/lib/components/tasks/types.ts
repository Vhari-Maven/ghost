import type { TaskStatus } from '$lib/db/schema';

export type TaskLabel = {
  id: number;
  name: string;
  color: string;
};

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  labels: TaskLabel[];
};

export type ColumnId = 'todo' | 'in_progress' | 'done';

export const COLUMN_CONFIG: Record<ColumnId, { title: string; canMoveLeft: boolean; canMoveRight: boolean; leftTarget?: ColumnId; rightTarget?: ColumnId }> = {
  todo: {
    title: 'Todo',
    canMoveLeft: false,
    canMoveRight: true,
    rightTarget: 'in_progress',
  },
  in_progress: {
    title: 'In Progress',
    canMoveLeft: true,
    canMoveRight: true,
    leftTarget: 'todo',
    rightTarget: 'done',
  },
  done: {
    title: 'Done',
    canMoveLeft: true,
    canMoveRight: false,
    leftTarget: 'in_progress',
  },
};
