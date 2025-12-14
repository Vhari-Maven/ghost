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
