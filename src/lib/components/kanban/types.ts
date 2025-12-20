export type BaseItem = {
  id: number;
  sortOrder: number;
};

export type ColumnConfig<TStatus extends string = string> = {
  id: TStatus;
  title: string;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  leftTarget?: TStatus;
  rightTarget?: TStatus;
  isCompletedColumn?: boolean;
  emptyMessage?: string;
};

export type DndEventDetail<T> = {
  items: T[];
  info: { source: string; trigger: string };
};
