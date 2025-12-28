import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { mealPrepSettings } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

// Get or create the settings row (single row table)
async function getSettings() {
  let settings = db.select().from(mealPrepSettings).where(eq(mealPrepSettings.id, 1)).get();

  if (!settings) {
    // Create default settings
    const result = db.insert(mealPrepSettings).values({
      id: 1,
      breakfast: true,
      salmon: true,
      beanSoup: true,
      medBowl: true
    }).returning().get();
    settings = result;
  }

  return settings;
}

export const load: PageServerLoad = async () => {
  const settings = await getSettings();

  return {
    settings: {
      breakfast: settings.breakfast,
      salmon: settings.salmon,
      beanSoup: settings.beanSoup,
      medBowl: settings.medBowl
    }
  };
};

export const actions: Actions = {
  updateSettings: async ({ request }) => {
    const formData = await request.formData();

    // Checkboxes only send value when checked, so we check for presence
    const breakfast = formData.has('breakfast');
    const salmon = formData.has('salmon');
    const beanSoup = formData.has('beanSoup');
    const medBowl = formData.has('medBowl');

    db.update(mealPrepSettings)
      .set({
        breakfast,
        salmon,
        beanSoup,
        medBowl,
        updatedAt: new Date().toISOString()
      })
      .where(eq(mealPrepSettings.id, 1))
      .run();

    return { success: true };
  }
};
