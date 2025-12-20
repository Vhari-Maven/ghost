import { db } from '$lib/db';
import { shoppingItems, type ShoppingStatus, SHOPPING_STATUSES } from '$lib/db/schema';
import { eq, asc, max, like } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ShoppingItemData = {
  id: number;
  title: string;
  notes: string | null;
  status: string;
  sortOrder: number;
  orderedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateShoppingItemInput = {
  title: string;
  notes?: string | null;
};

export type UpdateShoppingItemInput = {
  itemId: number;
  title: string;
  notes?: string | null;
};

export type MoveShoppingItemInput = {
  itemId: number;
  status: ShoppingStatus;
  sortOrder: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Query Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all shopping items grouped by status
 */
export async function getShoppingItemsByStatus(): Promise<{
  toBuyItems: ShoppingItemData[];
  orderedItems: ShoppingItemData[];
}> {
  const allItems = await db
    .select()
    .from(shoppingItems)
    .orderBy(asc(shoppingItems.sortOrder));

  // To Buy items sorted by sortOrder
  const toBuyItems = allItems
    .filter((item) => item.status === 'to_buy')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Ordered items sorted by orderedAt descending (most recent first)
  const orderedItems = allItems
    .filter((item) => item.status === 'ordered')
    .sort((a, b) => {
      if (a.orderedAt && b.orderedAt) {
        return b.orderedAt.localeCompare(a.orderedAt);
      }
      return b.sortOrder - a.sortOrder;
    });

  return { toBuyItems, orderedItems };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shopping Item Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new shopping item
 */
export async function createShoppingItem(input: CreateShoppingItemInput): Promise<{ itemId: number }> {
  const { title, notes } = input;

  // Get the max sortOrder for the to_buy column
  const maxOrder = await db
    .select({ max: max(shoppingItems.sortOrder) })
    .from(shoppingItems)
    .where(eq(shoppingItems.status, 'to_buy'))
    .get();

  const newSortOrder = (maxOrder?.max ?? -1) + 1;

  const result = await db
    .insert(shoppingItems)
    .values({
      title: title.trim(),
      notes: notes?.trim() || null,
      status: 'to_buy',
      sortOrder: newSortOrder,
    })
    .returning({ id: shoppingItems.id });

  return { itemId: result[0].id };
}

/**
 * Update a shopping item's title and notes
 */
export async function updateShoppingItem(input: UpdateShoppingItemInput): Promise<void> {
  const { itemId, title, notes } = input;

  await db
    .update(shoppingItems)
    .set({
      title: title.trim(),
      notes: notes?.trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(shoppingItems.id, itemId));
}

/**
 * Delete a shopping item
 */
export async function deleteShoppingItem(itemId: number): Promise<void> {
  await db.delete(shoppingItems).where(eq(shoppingItems.id, itemId));
}

/**
 * Move a shopping item to a different column/status
 */
export async function moveShoppingItem(input: MoveShoppingItemInput): Promise<void> {
  const { itemId, status, sortOrder } = input;

  // Get current item to check if status changed
  const currentItem = await db.select().from(shoppingItems).where(eq(shoppingItems.id, itemId)).get();

  if (!currentItem) {
    throw new Error('Item not found');
  }

  const updateData: Record<string, unknown> = {
    status,
    sortOrder,
    updatedAt: new Date().toISOString(),
  };

  // Set orderedAt when moving to ordered
  if (status === 'ordered' && currentItem.status !== 'ordered') {
    updateData.orderedAt = new Date().toISOString();
  }

  // Clear orderedAt when moving back to to_buy
  if (status === 'to_buy' && currentItem.status === 'ordered') {
    updateData.orderedAt = null;
  }

  await db.update(shoppingItems).set(updateData).where(eq(shoppingItems.id, itemId));
}

/**
 * Reorder items within a column
 */
export async function reorderColumn(itemIds: number[]): Promise<void> {
  for (let i = 0; i < itemIds.length; i++) {
    await db
      .update(shoppingItems)
      .set({ sortOrder: i, updatedAt: new Date().toISOString() })
      .where(eq(shoppingItems.id, itemIds[i]));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Delete shopping items matching a pattern (for E2E test cleanup)
 */
export async function cleanupTestItems(pattern: string): Promise<void> {
  await db.delete(shoppingItems).where(like(shoppingItems.title, pattern));
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function isValidShoppingStatus(status: string): status is ShoppingStatus {
  return SHOPPING_STATUSES.includes(status as ShoppingStatus);
}

export function parseItemId(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}
