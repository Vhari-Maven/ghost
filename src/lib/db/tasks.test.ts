import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { eq, and } from 'drizzle-orm';
import { tasks, taskLabels, taskLabelAssignments } from './schema';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');
const testDbPath = join(projectRoot, 'data', 'test-tasks.db');

let sqlite: Database;
let db: ReturnType<typeof drizzle>;

beforeAll(() => {
  sqlite = new Database(testDbPath);
  sqlite.exec('PRAGMA foreign_keys = ON');
  db = drizzle(sqlite);
  migrate(db, { migrationsFolder: join(projectRoot, 'drizzle') });
});

afterAll(() => {
  sqlite.close();
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }
});

beforeEach(() => {
  // Clear all task-related tables before each test
  db.delete(taskLabelAssignments).run();
  db.delete(tasks).run();
  db.delete(taskLabels).run();
});

describe('Tasks Database', () => {
  it('should insert a new task', () => {
    db.insert(tasks).values({
      title: 'My first task',
      status: 'todo',
      sortOrder: 0,
    }).run();

    const result = db.select().from(tasks).get();

    expect(result).toBeDefined();
    expect(result?.title).toBe('My first task');
    expect(result?.status).toBe('todo');
    expect(result?.sortOrder).toBe(0);
    expect(result?.description).toBeNull();
    expect(result?.completedAt).toBeNull();
  });

  it('should insert a task with description', () => {
    db.insert(tasks).values({
      title: 'Task with notes',
      description: 'This is a detailed description',
      status: 'todo',
      sortOrder: 0,
    }).run();

    const result = db.select().from(tasks).get();

    expect(result?.title).toBe('Task with notes');
    expect(result?.description).toBe('This is a detailed description');
  });

  it('should update task title and description', () => {
    db.insert(tasks).values({
      title: 'Original title',
      description: 'Original description',
      status: 'todo',
      sortOrder: 0,
    }).run();

    const task = db.select().from(tasks).get();

    db.update(tasks)
      .set({ title: 'Updated title', description: 'Updated description' })
      .where(eq(tasks.id, task!.id))
      .run();

    const result = db.select().from(tasks).where(eq(tasks.id, task!.id)).get();

    expect(result?.title).toBe('Updated title');
    expect(result?.description).toBe('Updated description');
  });

  it('should update task status', () => {
    db.insert(tasks).values({
      title: 'Moving task',
      status: 'todo',
      sortOrder: 0,
    }).run();

    const task = db.select().from(tasks).get();

    db.update(tasks)
      .set({ status: 'in_progress' })
      .where(eq(tasks.id, task!.id))
      .run();

    let result = db.select().from(tasks).where(eq(tasks.id, task!.id)).get();
    expect(result?.status).toBe('in_progress');

    db.update(tasks)
      .set({ status: 'done', completedAt: new Date().toISOString() })
      .where(eq(tasks.id, task!.id))
      .run();

    result = db.select().from(tasks).where(eq(tasks.id, task!.id)).get();
    expect(result?.status).toBe('done');
    expect(result?.completedAt).toBeDefined();
  });

  it('should update task sortOrder', () => {
    // Insert multiple tasks
    db.insert(tasks).values({ title: 'Task A', status: 'todo', sortOrder: 0 }).run();
    db.insert(tasks).values({ title: 'Task B', status: 'todo', sortOrder: 1 }).run();
    db.insert(tasks).values({ title: 'Task C', status: 'todo', sortOrder: 2 }).run();

    const allTasks = db.select().from(tasks).all();
    const taskC = allTasks.find(t => t.title === 'Task C');

    // Move Task C to the top
    db.update(tasks)
      .set({ sortOrder: -1 })
      .where(eq(tasks.id, taskC!.id))
      .run();

    const result = db.select().from(tasks).where(eq(tasks.id, taskC!.id)).get();
    expect(result?.sortOrder).toBe(-1);
  });

  it('should delete a task', () => {
    db.insert(tasks).values({
      title: 'Task to delete',
      status: 'todo',
      sortOrder: 0,
    }).run();

    const task = db.select().from(tasks).get();
    expect(task).toBeDefined();

    db.delete(tasks).where(eq(tasks.id, task!.id)).run();

    const result = db.select().from(tasks).where(eq(tasks.id, task!.id)).get();
    expect(result).toBeUndefined();
  });

  it('should handle null description', () => {
    db.insert(tasks).values({
      title: 'No description task',
      description: null,
      status: 'todo',
      sortOrder: 0,
    }).run();

    const result = db.select().from(tasks).get();
    expect(result?.description).toBeNull();
  });
});

describe('Task Labels Database', () => {
  it('should insert a new label', () => {
    db.insert(taskLabels).values({
      name: 'bug',
      color: '#ef4444',
    }).run();

    const result = db.select().from(taskLabels).get();

    expect(result).toBeDefined();
    expect(result?.name).toBe('bug');
    expect(result?.color).toBe('#ef4444');
  });

  it('should enforce unique label names', () => {
    db.insert(taskLabels).values({
      name: 'feature',
      color: '#3b82f6',
    }).run();

    expect(() => {
      db.insert(taskLabels).values({
        name: 'feature',
        color: '#22c55e', // Different color, same name
      }).run();
    }).toThrow();
  });

  it('should update label color', () => {
    db.insert(taskLabels).values({
      name: 'improvement',
      color: '#22c55e',
    }).run();

    const label = db.select().from(taskLabels).get();

    db.update(taskLabels)
      .set({ color: '#10b981' })
      .where(eq(taskLabels.id, label!.id))
      .run();

    const result = db.select().from(taskLabels).where(eq(taskLabels.id, label!.id)).get();
    expect(result?.color).toBe('#10b981');
  });

  it('should delete a label', () => {
    db.insert(taskLabels).values({
      name: 'urgent',
      color: '#f97316',
    }).run();

    const label = db.select().from(taskLabels).get();
    db.delete(taskLabels).where(eq(taskLabels.id, label!.id)).run();

    const result = db.select().from(taskLabels).where(eq(taskLabels.id, label!.id)).get();
    expect(result).toBeUndefined();
  });
});

describe('Task Label Assignments', () => {
  it('should assign a label to a task', () => {
    // Create task and label
    db.insert(tasks).values({ title: 'Labeled task', status: 'todo', sortOrder: 0 }).run();
    db.insert(taskLabels).values({ name: 'bug', color: '#ef4444' }).run();

    const task = db.select().from(tasks).get();
    const label = db.select().from(taskLabels).get();

    // Create assignment
    db.insert(taskLabelAssignments).values({
      taskId: task!.id,
      labelId: label!.id,
    }).run();

    const assignment = db.select().from(taskLabelAssignments).get();
    expect(assignment).toBeDefined();
    expect(assignment?.taskId).toBe(task!.id);
    expect(assignment?.labelId).toBe(label!.id);
  });

  it('should allow multiple labels on one task', () => {
    db.insert(tasks).values({ title: 'Multi-labeled task', status: 'todo', sortOrder: 0 }).run();
    db.insert(taskLabels).values({ name: 'bug', color: '#ef4444' }).run();
    db.insert(taskLabels).values({ name: 'urgent', color: '#f97316' }).run();

    const task = db.select().from(tasks).get();
    const labels = db.select().from(taskLabels).all();

    for (const label of labels) {
      db.insert(taskLabelAssignments).values({
        taskId: task!.id,
        labelId: label.id,
      }).run();
    }

    const assignments = db.select()
      .from(taskLabelAssignments)
      .where(eq(taskLabelAssignments.taskId, task!.id))
      .all();

    expect(assignments.length).toBe(2);
  });

  it('should cascade delete assignments when task is deleted', () => {
    db.insert(tasks).values({ title: 'Task to delete', status: 'todo', sortOrder: 0 }).run();
    db.insert(taskLabels).values({ name: 'feature', color: '#3b82f6' }).run();

    const task = db.select().from(tasks).get();
    const label = db.select().from(taskLabels).get();

    db.insert(taskLabelAssignments).values({
      taskId: task!.id,
      labelId: label!.id,
    }).run();

    // Verify assignment exists
    let assignments = db.select().from(taskLabelAssignments).all();
    expect(assignments.length).toBe(1);

    // Delete task
    db.delete(tasks).where(eq(tasks.id, task!.id)).run();

    // Assignment should be gone due to cascade
    assignments = db.select().from(taskLabelAssignments).all();
    expect(assignments.length).toBe(0);

    // Label should still exist
    const labelStillExists = db.select().from(taskLabels).where(eq(taskLabels.id, label!.id)).get();
    expect(labelStillExists).toBeDefined();
  });

  it('should cascade delete assignments when label is deleted', () => {
    db.insert(tasks).values({ title: 'Task with label', status: 'todo', sortOrder: 0 }).run();
    db.insert(taskLabels).values({ name: 'research', color: '#a855f7' }).run();

    const task = db.select().from(tasks).get();
    const label = db.select().from(taskLabels).get();

    db.insert(taskLabelAssignments).values({
      taskId: task!.id,
      labelId: label!.id,
    }).run();

    // Delete label
    db.delete(taskLabels).where(eq(taskLabels.id, label!.id)).run();

    // Assignment should be gone
    const assignments = db.select().from(taskLabelAssignments).all();
    expect(assignments.length).toBe(0);

    // Task should still exist
    const taskStillExists = db.select().from(tasks).where(eq(tasks.id, task!.id)).get();
    expect(taskStillExists).toBeDefined();
  });

  it('should remove a specific label from a task', () => {
    db.insert(tasks).values({ title: 'Task', status: 'todo', sortOrder: 0 }).run();
    db.insert(taskLabels).values({ name: 'bug', color: '#ef4444' }).run();
    db.insert(taskLabels).values({ name: 'urgent', color: '#f97316' }).run();

    const task = db.select().from(tasks).get();
    const labels = db.select().from(taskLabels).all();

    // Assign both labels
    for (const label of labels) {
      db.insert(taskLabelAssignments).values({
        taskId: task!.id,
        labelId: label.id,
      }).run();
    }

    // Remove just the 'bug' label
    const bugLabel = labels.find(l => l.name === 'bug');
    db.delete(taskLabelAssignments)
      .where(
        and(
          eq(taskLabelAssignments.taskId, task!.id),
          eq(taskLabelAssignments.labelId, bugLabel!.id)
        )
      )
      .run();

    const remainingAssignments = db.select()
      .from(taskLabelAssignments)
      .where(eq(taskLabelAssignments.taskId, task!.id))
      .all();

    expect(remainingAssignments.length).toBe(1);
  });
});
