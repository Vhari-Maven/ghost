import { db } from '$lib/db';
import { fitnessGoals } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export interface FitnessGoalsData {
  targetWeight: number | null;
}

// Get or create fitness goals (singleton row)
export async function getFitnessGoals(): Promise<FitnessGoalsData> {
  const existing = await db.select().from(fitnessGoals).limit(1);

  if (existing.length === 0) {
    // Create default row with no target set
    const result = await db.insert(fitnessGoals).values({}).returning();
    return {
      targetWeight: result[0].targetWeight
    };
  }

  return {
    targetWeight: existing[0].targetWeight
  };
}

// Update target weight
export async function setTargetWeight(weight: number | null): Promise<void> {
  const existing = await db.select().from(fitnessGoals).limit(1);

  if (existing.length === 0) {
    await db.insert(fitnessGoals).values({
      targetWeight: weight
    });
  } else {
    await db.update(fitnessGoals)
      .set({
        targetWeight: weight,
        updatedAt: new Date().toISOString()
      })
      .where(eq(fitnessGoals.id, existing[0].id));
  }
}

// Get just the target weight (convenience function for analytics)
export async function getTargetWeight(): Promise<number | null> {
  const goals = await getFitnessGoals();
  return goals.targetWeight;
}
