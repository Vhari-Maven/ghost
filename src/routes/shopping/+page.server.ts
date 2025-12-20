import type { PageServerLoad, Actions } from './$types';
import {
  getShoppingItemsByStatus,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  moveShoppingItem,
  reorderColumn,
  cleanupTestItems,
  isValidShoppingStatus,
  parseItemId,
} from '$lib/services/shopping';

export const load: PageServerLoad = async () => {
  const itemsByStatus = await getShoppingItemsByStatus();
  return itemsByStatus;
};

export const actions: Actions = {
  createItem: async ({ request }) => {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const notes = formData.get('notes') as string | null;

    if (!title?.trim()) {
      return { success: false, error: 'Title is required' };
    }

    const result = await createShoppingItem({ title, notes });
    return { success: true, itemId: result.itemId };
  },

  updateItem: async ({ request }) => {
    const formData = await request.formData();
    const itemId = parseItemId(formData.get('itemId') as string);
    const title = formData.get('title') as string;
    const notes = formData.get('notes') as string | null;

    if (!itemId) {
      return { success: false, error: 'Invalid item ID' };
    }

    if (!title?.trim()) {
      return { success: false, error: 'Title is required' };
    }

    await updateShoppingItem({ itemId, title, notes });
    return { success: true };
  },

  deleteItem: async ({ request }) => {
    const formData = await request.formData();
    const itemId = parseItemId(formData.get('itemId') as string);

    if (!itemId) {
      return { success: false, error: 'Invalid item ID' };
    }

    await deleteShoppingItem(itemId);
    return { success: true };
  },

  moveItem: async ({ request }) => {
    const formData = await request.formData();
    const itemId = parseItemId(formData.get('itemId') as string);
    const status = formData.get('status') as string;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

    if (!itemId) {
      return { success: false, error: 'Invalid item ID' };
    }

    if (!isValidShoppingStatus(status)) {
      return { success: false, error: 'Invalid status' };
    }

    try {
      await moveShoppingItem({ itemId, status, sortOrder });
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  reorderColumn: async ({ request }) => {
    const formData = await request.formData();
    const itemIdsJson = formData.get('itemIds') as string;

    if (!itemIdsJson) {
      return { success: false, error: 'No item IDs provided' };
    }

    let itemIds: number[];
    try {
      itemIds = JSON.parse(itemIdsJson);
    } catch {
      return { success: false, error: 'Invalid item IDs format' };
    }

    await reorderColumn(itemIds);
    return { success: true };
  },

  cleanupTestItems: async ({ request }) => {
    const formData = await request.formData();
    const pattern = formData.get('pattern') as string;

    if (!pattern) {
      return { success: false, error: 'Pattern is required' };
    }

    await cleanupTestItems(pattern);
    return { success: true };
  },
};
