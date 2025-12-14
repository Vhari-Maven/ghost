import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq, and, gte, lte } from 'drizzle-orm';
import { fitnessEntries } from '$lib/db/schema';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');
const testDbPath = join(projectRoot, 'data', 'integration-test.db');

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

// Simulate the server-side action logic from +page.server.ts
async function simulateUpdateField(
  db: ReturnType<typeof drizzle>,
  date: string,
  field: string,
  value: string
) {
  const today = new Date().toISOString().split('T')[0];

  // Don't allow updates to future dates
  if (date > today) {
    return { success: false, error: 'Cannot update future dates' };
  }

  // Check if entry exists
  const existing = db
    .select()
    .from(fitnessEntries)
    .where(eq(fitnessEntries.date, date))
    .get();

  // Prepare the update value
  let updateValue: number | boolean | null;

  if (['breakfast', 'brush', 'floss', 'shower', 'shake'].includes(field)) {
    updateValue = value === 'true';
  } else {
    updateValue = value === '' ? null : parseFloat(value);
  }

  const updateData = {
    [field]: updateValue,
    updatedAt: new Date().toISOString()
  };

  if (existing) {
    db.update(fitnessEntries)
      .set(updateData)
      .where(eq(fitnessEntries.date, date))
      .run();
  } else {
    db.insert(fitnessEntries).values({
      date,
      ...updateData
    }).run();
  }

  return { success: true };
}

async function simulateCopyYesterdayWalk(
  db: ReturnType<typeof drizzle>,
  date: string,
  walkDistance: string | null,
  walkIncline: string | null
) {
  const today = new Date().toISOString().split('T')[0];

  if (date > today) {
    return { success: false, error: 'Cannot update future dates' };
  }

  const existing = db
    .select()
    .from(fitnessEntries)
    .where(eq(fitnessEntries.date, date))
    .get();

  const updateData = {
    walkDistance: walkDistance ? parseFloat(walkDistance) : null,
    walkIncline: walkIncline ? parseFloat(walkIncline) : null,
    updatedAt: new Date().toISOString()
  };

  if (existing) {
    db.update(fitnessEntries)
      .set(updateData)
      .where(eq(fitnessEntries.date, date))
      .run();
  } else {
    db.insert(fitnessEntries).values({
      date,
      ...updateData
    }).run();
  }

  return { success: true };
}

function getDateRange() {
  const today = new Date();
  const dates: string[] = [];

  for (let i = -5; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return {
    start: dates[0],
    end: dates[dates.length - 1],
    dates,
    today: today.toISOString().split('T')[0]
  };
}

beforeAll(() => {
  sqlite = new Database(testDbPath);
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
  db.delete(fitnessEntries).run();
});

describe('Fitness Tracker Integration Tests', () => {
  describe('Form Action: updateField', () => {
    it('should create a new entry when updating weight for a new date', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Simulate: User types "180.5" in weight field and blurs
      const result = await simulateUpdateField(db, today, 'weight', '180.5');

      expect(result.success).toBe(true);

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry).toBeDefined();
      expect(entry?.weight).toBe(180.5);
    });

    it('should update existing entry when changing weight', async () => {
      const today = new Date().toISOString().split('T')[0];

      // First update creates entry
      await simulateUpdateField(db, today, 'weight', '180');

      // Second update modifies it
      await simulateUpdateField(db, today, 'weight', '179.5');

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry?.weight).toBe(179.5);
    });

    it('should toggle checkbox from false to true', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Simulate: User clicks breakfast checkbox (currently unchecked)
      await simulateUpdateField(db, today, 'breakfast', 'true');

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry?.breakfast).toBe(true);
    });

    it('should toggle checkbox from true to false', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Set up: checkbox is checked
      await simulateUpdateField(db, today, 'breakfast', 'true');

      // Simulate: User clicks to uncheck
      await simulateUpdateField(db, today, 'breakfast', 'false');

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry?.breakfast).toBe(false);
    });

    it('should handle clearing a numeric field', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Set initial value
      await simulateUpdateField(db, today, 'weight', '180');

      // Simulate: User clears the field
      await simulateUpdateField(db, today, 'weight', '');

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry?.weight).toBeNull();
    });

    it('should reject updates to future dates', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const result = await simulateUpdateField(db, tomorrowStr, 'weight', '180');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot update future dates');

      // Verify no entry was created
      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, tomorrowStr)).get();
      expect(entry).toBeUndefined();
    });

    it('should allow updates to past dates', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const result = await simulateUpdateField(db, yesterdayStr, 'weight', '181');

      expect(result.success).toBe(true);

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, yesterdayStr)).get();
      expect(entry?.weight).toBe(181);
    });

    it('should handle decimal values for walk distance', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Simulate: User types walk distance with 2 decimal places
      await simulateUpdateField(db, today, 'walkDistance', '1.57');

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry?.walkDistance).toBe(1.57);
    });
  });

  describe('Checkbox Toggle Database Updates', () => {
    // These tests verify that the exact form data sent by the UI
    // (hidden inputs with 'true'/'false' strings) correctly updates the database

    const booleanFields = ['breakfast', 'brush', 'floss', 'shower', 'shake'];

    for (const field of booleanFields) {
      it(`should toggle ${field} from unchecked to checked`, async () => {
        const today = new Date().toISOString().split('T')[0];

        // UI sends: <input type="hidden" name="value" value="true" />
        const result = await simulateUpdateField(db, today, field, 'true');

        expect(result.success).toBe(true);
        const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
        expect(entry?.[field as keyof typeof entry]).toBe(true);
      });

      it(`should toggle ${field} from checked to unchecked`, async () => {
        const today = new Date().toISOString().split('T')[0];

        // First check the box
        await simulateUpdateField(db, today, field, 'true');

        // UI sends: <input type="hidden" name="value" value="false" />
        // (because !getDisplayValue(row, col.key) when current value is true)
        const result = await simulateUpdateField(db, today, field, 'false');

        expect(result.success).toBe(true);
        const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
        expect(entry?.[field as keyof typeof entry]).toBe(false);
      });
    }

    it('should handle toggling multiple checkboxes in sequence', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Simulate clicking each checkbox once
      await simulateUpdateField(db, today, 'breakfast', 'true');
      await simulateUpdateField(db, today, 'brush', 'true');
      await simulateUpdateField(db, today, 'floss', 'true');
      await simulateUpdateField(db, today, 'shower', 'false'); // intentionally unchecked
      await simulateUpdateField(db, today, 'shake', 'true');

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();

      expect(entry?.breakfast).toBe(true);
      expect(entry?.brush).toBe(true);
      expect(entry?.floss).toBe(true);
      expect(entry?.shower).toBe(false);
      expect(entry?.shake).toBe(true);
    });

    it('should persist checkbox state after toggling back and forth', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Toggle on
      await simulateUpdateField(db, today, 'breakfast', 'true');
      let entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry?.breakfast).toBe(true);

      // Toggle off
      await simulateUpdateField(db, today, 'breakfast', 'false');
      entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry?.breakfast).toBe(false);

      // Toggle on again
      await simulateUpdateField(db, today, 'breakfast', 'true');
      entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry?.breakfast).toBe(true);
    });
  });

  describe('Form Action: copyYesterdayWalk', () => {
    it('should copy walk data from yesterday to today', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Simulate: User clicks "copy yesterday" button
      const result = await simulateCopyYesterdayWalk(db, today, '1.57', '5');

      expect(result.success).toBe(true);

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry?.walkDistance).toBe(1.57);
      expect(entry?.walkIncline).toBe(5);
    });

    it('should preserve other fields when copying walk data', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Set up: today already has some data
      await simulateUpdateField(db, today, 'weight', '180');
      await simulateUpdateField(db, today, 'breakfast', 'true');

      // Copy walk data
      await simulateCopyYesterdayWalk(db, today, '1.57', '5');

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry?.weight).toBe(180);
      expect(entry?.breakfast).toBe(true);
      expect(entry?.walkDistance).toBe(1.57);
      expect(entry?.walkIncline).toBe(5);
    });
  });

  describe('User Workflow Simulation', () => {
    it('should handle a complete morning logging session', async () => {
      const today = new Date().toISOString().split('T')[0];

      // User logs weight
      await simulateUpdateField(db, today, 'weight', '180.2');

      // User copies yesterday's walk
      await simulateCopyYesterdayWalk(db, today, '1.57', '5');

      // User checks off morning habits one by one
      await simulateUpdateField(db, today, 'breakfast', 'true');
      await simulateUpdateField(db, today, 'brush', 'true');
      await simulateUpdateField(db, today, 'floss', 'true');
      await simulateUpdateField(db, today, 'shower', 'true');
      await simulateUpdateField(db, today, 'shake', 'true');

      // Verify final state
      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();

      expect(entry?.weight).toBe(180.2);
      expect(entry?.walkDistance).toBe(1.57);
      expect(entry?.walkIncline).toBe(5);
      expect(entry?.breakfast).toBe(true);
      expect(entry?.brush).toBe(true);
      expect(entry?.floss).toBe(true);
      expect(entry?.shower).toBe(true);
      expect(entry?.shake).toBe(true);
    });

    it('should handle editing past days', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const dateStr = threeDaysAgo.toISOString().split('T')[0];

      // User realizes they forgot to log 3 days ago
      await simulateUpdateField(db, dateStr, 'weight', '181');
      await simulateUpdateField(db, dateStr, 'breakfast', 'true');
      await simulateUpdateField(db, dateStr, 'brush', 'true');
      // Forgot to floss that day
      await simulateUpdateField(db, dateStr, 'floss', 'false');

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, dateStr)).get();

      expect(entry?.weight).toBe(181);
      expect(entry?.breakfast).toBe(true);
      expect(entry?.brush).toBe(true);
      expect(entry?.floss).toBe(false);
    });

    it('should handle rapid checkbox toggles', async () => {
      const today = new Date().toISOString().split('T')[0];

      // User rapidly clicks breakfast checkbox multiple times
      await simulateUpdateField(db, today, 'breakfast', 'true');
      await simulateUpdateField(db, today, 'breakfast', 'false');
      await simulateUpdateField(db, today, 'breakfast', 'true');
      await simulateUpdateField(db, today, 'breakfast', 'false');
      await simulateUpdateField(db, today, 'breakfast', 'true');

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();
      expect(entry?.breakfast).toBe(true); // Final state
    });

    it('should handle keyboard navigation updates (Tab through row)', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Simulate: User tabs through numeric fields, entering values
      // Weight -> Tab -> Walk -> Tab -> Incline
      await simulateUpdateField(db, today, 'weight', '180');
      await simulateUpdateField(db, today, 'walkDistance', '1.57');
      await simulateUpdateField(db, today, 'walkIncline', '5');

      const entry = db.select().from(fitnessEntries).where(eq(fitnessEntries.date, today)).get();

      expect(entry?.weight).toBe(180);
      expect(entry?.walkDistance).toBe(1.57);
      expect(entry?.walkIncline).toBe(5);
    });
  });

  describe('Data Loading (Page Load)', () => {
    it('should load entries within date range', async () => {
      const { start, end, dates, today } = getDateRange();

      // Seed some data
      const pastDates = dates.filter(d => d <= today).slice(0, 3);
      for (const date of pastDates) {
        await simulateUpdateField(db, date, 'weight', '180');
      }

      // Query like the page load does
      const entries = db
        .select()
        .from(fitnessEntries)
        .where(and(gte(fitnessEntries.date, start), lte(fitnessEntries.date, end)))
        .all();

      expect(entries.length).toBe(3);
    });

    it('should return empty for dates with no data', async () => {
      const { start, end } = getDateRange();

      // Don't seed any data

      const entries = db
        .select()
        .from(fitnessEntries)
        .where(and(gte(fitnessEntries.date, start), lte(fitnessEntries.date, end)))
        .all();

      expect(entries.length).toBe(0);
    });
  });
});
