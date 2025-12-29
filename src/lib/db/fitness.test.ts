import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { eq, and, gte, lte } from 'drizzle-orm';
import { fitnessEntries } from './schema';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');
const testDbPath = join(projectRoot, 'data', 'test.db');

let sqlite: Database;
let db: ReturnType<typeof drizzle>;

beforeAll(() => {
  // Create test database
  sqlite = new Database(testDbPath);
  db = drizzle(sqlite);

  // Run migrations
  migrate(db, { migrationsFolder: join(projectRoot, 'drizzle') });
});

afterAll(() => {
  sqlite.close();
  // Clean up test database
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }
});

beforeEach(() => {
  // Clear the table before each test
  db.delete(fitnessEntries).run();
});

describe('Fitness Entries Database', () => {
  it('should insert a new fitness entry', () => {
    const entry = {
      date: '2025-12-14',
      weight: 180.5,
      walkDistance: 1.57,
      walkIncline: 5.0,
      breakfast: true,
      brush: true,
      floss: false,
      shower: true,
      shake: true,
    };

    db.insert(fitnessEntries).values(entry).run();

    const result = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, '2025-12-14')).get();

    expect(result).toBeDefined();
    expect(result?.weight).toBe(180.5);
    expect(result?.walkDistance).toBe(1.57);
    expect(result?.walkIncline).toBe(5.0);
    expect(result?.breakfast).toBe(true);
    expect(result?.floss).toBe(false);
  });

  it('should update an existing fitness entry', () => {
    // Insert initial entry
    db.insert(fitnessEntries).values({
      date: '2025-12-14',
      weight: 180,
      breakfast: false,
    }).run();

    // Update the entry
    db.update(fitnessEntries)
      .set({ weight: 179.5, breakfast: true })
      .where(eq(fitnessEntries.date, '2025-12-14'))
      .run();

    const result = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, '2025-12-14')).get();

    expect(result?.weight).toBe(179.5);
    expect(result?.breakfast).toBe(true);
  });

  it('should handle partial updates (single field)', () => {
    // Insert initial entry
    db.insert(fitnessEntries).values({
      date: '2025-12-14',
      weight: 180,
      walkDistance: 1.5,
      breakfast: false,
    }).run();

    // Update only the breakfast field
    db.update(fitnessEntries)
      .set({ breakfast: true })
      .where(eq(fitnessEntries.date, '2025-12-14'))
      .run();

    const result = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, '2025-12-14')).get();

    // Other fields should remain unchanged
    expect(result?.weight).toBe(180);
    expect(result?.walkDistance).toBe(1.5);
    expect(result?.breakfast).toBe(true);
  });

  it('should handle null values for optional numeric fields', () => {
    db.insert(fitnessEntries).values({
      date: '2025-12-14',
      weight: null,
      walkDistance: null,
      walkIncline: null,
      breakfast: true,
    }).run();

    const result = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, '2025-12-14')).get();

    expect(result?.weight).toBeNull();
    expect(result?.walkDistance).toBeNull();
    expect(result?.walkIncline).toBeNull();
    expect(result?.breakfast).toBe(true);
  });

  it('should enforce unique date constraint', () => {
    db.insert(fitnessEntries).values({
      date: '2025-12-14',
      weight: 180,
    }).run();

    // Trying to insert another entry with the same date should fail
    expect(() => {
      db.insert(fitnessEntries).values({
        date: '2025-12-14',
        weight: 181,
      }).run();
    }).toThrow();
  });

  it('should insert or ignore duplicate dates with onConflictDoNothing', () => {
    db.insert(fitnessEntries).values({
      date: '2025-12-14',
      weight: 180,
    }).run();

    // This should not throw, just ignore the conflict
    db.insert(fitnessEntries)
      .values({
        date: '2025-12-14',
        weight: 181,
      })
      .onConflictDoNothing()
      .run();

    const result = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, '2025-12-14')).get();

    // Original value should remain
    expect(result?.weight).toBe(180);
  });

  it('should query entries within a date range', () => {
    // Insert multiple entries
    const entries = [
      { date: '2025-12-10', weight: 180 },
      { date: '2025-12-11', weight: 179 },
      { date: '2025-12-12', weight: 181 },
      { date: '2025-12-13', weight: 180.5 },
      { date: '2025-12-14', weight: 179.5 },
    ];

    for (const entry of entries) {
      db.insert(fitnessEntries).values(entry).run();
    }

    // SQLite string comparison works for ISO dates
    const results = db.select()
      .from(fitnessEntries)
      .where(
        and(
          gte(fitnessEntries.date, '2025-12-11'),
          lte(fitnessEntries.date, '2025-12-13')
        )
      )
      .all();

    // Should return 3 entries: 12-11, 12-12, 12-13
    expect(results.length).toBe(3);
  });

  it('should toggle boolean fields correctly', () => {
    db.insert(fitnessEntries).values({
      date: '2025-12-14',
      breakfast: false,
      brush: false,
      floss: false,
      shower: false,
      shake: false,
    }).run();

    // Toggle breakfast to true
    let entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, '2025-12-14')).get();
    const newValue = !entry?.breakfast;

    db.update(fitnessEntries)
      .set({ breakfast: newValue })
      .where(eq(fitnessEntries.date, '2025-12-14'))
      .run();

    entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, '2025-12-14')).get();
    expect(entry?.breakfast).toBe(true);

    // Toggle it back
    db.update(fitnessEntries)
      .set({ breakfast: !entry?.breakfast })
      .where(eq(fitnessEntries.date, '2025-12-14'))
      .run();

    entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, '2025-12-14')).get();
    expect(entry?.breakfast).toBe(false);
  });
});
