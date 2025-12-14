import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { fitnessEntries } from '$lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

function getDateRange(): { start: string; end: string; dates: string[] } {
  const today = new Date();
  const dates: string[] = [];

  // 5 days before and 5 days after today
  for (let i = -5; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return {
    start: dates[0],
    end: dates[dates.length - 1],
    dates
  };
}

export const load: PageServerLoad = async () => {
  const { start, end, dates } = getDateRange();
  const today = new Date().toISOString().split('T')[0];

  // Fetch existing entries in date range
  const entries = await db
    .select()
    .from(fitnessEntries)
    .where(and(gte(fitnessEntries.date, start), lte(fitnessEntries.date, end)));

  // Create a map for quick lookup
  const entryMap = new Map(entries.map((e) => [e.date, e]));

  // Build the full date range with entries (or empty placeholders)
  const rows = dates.map((date) => {
    const existing = entryMap.get(date);
    const isPast = date <= today;

    return {
      date,
      isToday: date === today,
      isPast,
      isFuture: date > today,
      entry: existing || null
    };
  });

  return { rows, today };
};

export const actions: Actions = {
  updateField: async ({ request }) => {
    const formData = await request.formData();
    const date = formData.get('date') as string;
    const field = formData.get('field') as string;
    const value = formData.get('value') as string;

    const today = new Date().toISOString().split('T')[0];

    // Don't allow updates to future dates
    if (date > today) {
      return { success: false, error: 'Cannot update future dates' };
    }

    // Check if entry exists
    const existing = await db
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
      await db
        .update(fitnessEntries)
        .set(updateData)
        .where(eq(fitnessEntries.date, date));
    } else {
      await db.insert(fitnessEntries).values({
        date,
        ...updateData
      });
    }

    return { success: true };
  }
};
