import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const fitnessEntries = sqliteTable('fitness_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // ISO format: '2025-12-14'
  weight: real('weight'),
  walkDistance: real('walk_distance'),
  walkIncline: real('walk_incline'),
  breakfast: integer('breakfast', { mode: 'boolean' }).notNull().default(false),
  brush: integer('brush', { mode: 'boolean' }).notNull().default(false),
  floss: integer('floss', { mode: 'boolean' }).notNull().default(false),
  shower: integer('shower', { mode: 'boolean' }).notNull().default(false),
  shake: integer('shake', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

export type FitnessEntry = typeof fitnessEntries.$inferSelect;
export type NewFitnessEntry = typeof fitnessEntries.$inferInsert;

// ============================================
// Task Tracker Tables
// ============================================

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'), // 'todo' | 'in_progress' | 'done'
  sortOrder: integer('sort_order').notNull().default(0),
  completedAt: text('completed_at'), // Set when moved to done
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const taskLabels = sqliteTable('task_labels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull(), // Hex color like '#3b82f6'
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const taskLabelAssignments = sqliteTable('task_label_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  labelId: integer('label_id').notNull().references(() => taskLabels.id, { onDelete: 'cascade' }),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskLabel = typeof taskLabels.$inferSelect;
export type NewTaskLabel = typeof taskLabels.$inferInsert;
export type TaskLabelAssignment = typeof taskLabelAssignments.$inferSelect;

// ============================================
// Shopping List Tables
// ============================================

export const SHOPPING_STATUSES = ['to_buy', 'ordered'] as const;
export type ShoppingStatus = (typeof SHOPPING_STATUSES)[number];

export const shoppingItems = sqliteTable('shopping_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('to_buy'), // 'to_buy' | 'ordered'
  sortOrder: integer('sort_order').notNull().default(0),
  orderedAt: text('ordered_at'), // Set when moved to ordered
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type NewShoppingItem = typeof shoppingItems.$inferInsert;

// ============================================
// Exercise Tracker Tables
// ============================================

export const WORKOUT_TYPES = ['upper_push', 'lower', 'upper_pull', 'recovery'] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

// Exercise session - one per day
export const exerciseSessions = sqliteTable('exercise_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(),
  workoutType: text('workout_type').notNull(), // 'upper_push' | 'lower' | 'upper_pull' | 'recovery'
  completedAt: text('completed_at'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// Individual set logs
export const exerciseLogs = sqliteTable('exercise_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => exerciseSessions.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').notNull(),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps'),
  weight: real('weight'),
  duration: integer('duration'), // for timed exercises (seconds)
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Always-do stack completion
export const alwaysDoLogs = sqliteTable('always_do_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => exerciseSessions.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  duration: integer('duration'),
  reps: integer('reps'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type ExerciseSession = typeof exerciseSessions.$inferSelect;
export type NewExerciseSession = typeof exerciseSessions.$inferInsert;
export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type NewExerciseLog = typeof exerciseLogs.$inferInsert;
export type AlwaysDoLog = typeof alwaysDoLogs.$inferSelect;
export type NewAlwaysDoLog = typeof alwaysDoLogs.$inferInsert;

// ============================================
// Meal Prep Settings
// ============================================

export const mealPrepSettings = sqliteTable('meal_prep_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  breakfast: integer('breakfast', { mode: 'boolean' }).notNull().default(true),
  salmon: integer('salmon', { mode: 'boolean' }).notNull().default(true),
  beanSoup: integer('bean_soup', { mode: 'boolean' }).notNull().default(true),
  medBowl: integer('med_bowl', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

export type MealPrepSettings = typeof mealPrepSettings.$inferSelect;
export type NewMealPrepSettings = typeof mealPrepSettings.$inferInsert;
