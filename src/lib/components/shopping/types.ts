import type { ColumnConfig } from '$lib/components/kanban/types';

export type ShoppingItem = {
  id: number;
  title: string;
  notes: string | null;
  status: string;
  sortOrder: number;
  orderedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShoppingStatus = 'to_buy' | 'ordered';

export const SHOPPING_COLUMNS: Record<ShoppingStatus, ColumnConfig<ShoppingStatus>> = {
  to_buy: {
    id: 'to_buy',
    title: 'To Buy',
    canMoveLeft: false,
    canMoveRight: true,
    rightTarget: 'ordered',
    emptyMessage: 'No items to buy',
  },
  ordered: {
    id: 'ordered',
    title: 'Ordered',
    canMoveLeft: true,
    canMoveRight: false,
    leftTarget: 'to_buy',
    isCompletedColumn: true,
    emptyMessage: 'No ordered items',
  },
};
