<script lang="ts">
  import type { PageData } from './$types';
  import { SOURCES, TRIGGERS } from 'svelte-dnd-action';
  import { KanbanColumn, ConfirmModal } from '$lib/components/kanban';
  import {
    ShoppingCard,
    AddShoppingItemForm,
    SHOPPING_COLUMNS,
    type ShoppingItem,
    type ShoppingStatus,
  } from '$lib/components/shopping';

  let { data }: { data: PageData } = $props();

  // ─────────────────────────────────────────────────────────────────────────────
  // Item State
  // ─────────────────────────────────────────────────────────────────────────────

  // Local state for items (will be updated by drag-and-drop)
  // svelte-ignore state_referenced_locally
  let toBuyItems = $state([...data.toBuyItems] as ShoppingItem[]);
  // svelte-ignore state_referenced_locally
  let orderedItems = $state([...data.orderedItems] as ShoppingItem[]);

  // Track last known data reference to detect actual page navigations/reloads
  // svelte-ignore state_referenced_locally
  let lastDataRef = data;

  // Only sync when the data object itself changes (navigation/reload), not on reactivity updates
  $effect.pre(() => {
    if (data !== lastDataRef) {
      lastDataRef = data;
      toBuyItems = [...data.toBuyItems] as ShoppingItem[];
      orderedItems = [...data.orderedItems] as ShoppingItem[];
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UI State
  // ─────────────────────────────────────────────────────────────────────────────

  // Add form state
  let addFormOpen = $state(false);
  let newItemTitle = $state('');
  let newItemNotes = $state('');

  // Edit state
  let editingItemId = $state<number | null>(null);
  let editTitle = $state('');
  let editNotes = $state('');

  // Delete confirmation state
  let itemToDelete = $state<ShoppingItem | null>(null);

  // Ordered column state (show all toggle)
  let showAllOrdered = $state(false);

  const flipDurationMs = 200;

  // ─────────────────────────────────────────────────────────────────────────────
  // Item Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  function setItemsForColumn(columnId: ShoppingStatus, items: ShoppingItem[]) {
    if (columnId === 'to_buy') toBuyItems = items;
    else orderedItems = items;
  }

  function getItemsForColumn(columnId: ShoppingStatus): ShoppingItem[] {
    return columnId === 'to_buy' ? toBuyItems : orderedItems;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Edit Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  function startEdit(item: ShoppingItem) {
    editingItemId = item.id;
    editTitle = item.title;
    editNotes = item.notes || '';
  }

  function cancelEdit() {
    editingItemId = null;
    editTitle = '';
    editNotes = '';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Delete Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  function requestDelete(item: ShoppingItem) {
    itemToDelete = item;
  }

  function cancelDelete() {
    itemToDelete = null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Add Form Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  function openAddForm() {
    addFormOpen = true;
  }

  function resetAddForm() {
    newItemTitle = '';
    newItemNotes = '';
    addFormOpen = false;
  }

  function clearAddFormForNextItem() {
    // Clear fields but keep form open for rapid entry
    newItemTitle = '';
    newItemNotes = '';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Drag and Drop Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  function handleDndConsider(columnId: ShoppingStatus) {
    return (e: CustomEvent<{ items: ShoppingItem[] }>) => {
      setItemsForColumn(columnId, e.detail.items);
    };
  }

  function handleDndFinalize(columnId: ShoppingStatus) {
    return (e: CustomEvent<{ items: ShoppingItem[]; info: { source: string; trigger: string } }>) => {
      const { items, info } = e.detail;
      setItemsForColumn(columnId, items);

      // Only persist if this was a drop (not just a cancel)
      if (info.source === SOURCES.POINTER && info.trigger === TRIGGERS.DROPPED_INTO_ZONE) {
        persistColumnOrder(columnId, items);
      }
    };
  }

  async function persistColumnOrder(columnId: ShoppingStatus, items: ShoppingItem[]) {
    // Use fetch to persist without triggering SvelteKit's automatic data reload
    // This prevents the snap-back issue during drag-and-drop

    // First, update status for any items that changed columns
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status !== columnId) {
        const formData = new FormData();
        formData.append('itemId', String(item.id));
        formData.append('status', columnId);
        formData.append('sortOrder', String(i));

        await fetch('?/moveItem', {
          method: 'POST',
          body: formData,
        });

        // Update local status so subsequent operations know the new status
        item.status = columnId;
      }
    }

    // Then persist the column order
    const formData = new FormData();
    formData.append('itemIds', JSON.stringify(items.map((item) => item.id)));

    await fetch('?/reorderColumn', {
      method: 'POST',
      body: formData,
    });
  }
</script>

<div class="h-[calc(100vh-120px)] flex flex-col">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-bold flex items-center gap-3">
      <img src="/icon-shopping.svg" alt="" class="w-8 h-8" />
      Shopping List
    </h1>
  </div>

  <div class="flex-1 flex gap-4 overflow-x-auto pb-4">
    <!-- To Buy Column -->
    <KanbanColumn
      columnConfig={SHOPPING_COLUMNS.to_buy}
      items={toBuyItems}
      {flipDurationMs}
      onItemsChange={(items) => (toBuyItems = items)}
      onDndConsider={handleDndConsider('to_buy')}
      onDndFinalize={handleDndFinalize('to_buy')}
    >
      {#snippet renderCard(item: ShoppingItem)}
        <ShoppingCard
          {item}
          columnId="to_buy"
          isEditing={editingItemId === item.id}
          {editTitle}
          {editNotes}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onEditTitleChange={(v) => (editTitle = v)}
          onEditNotesChange={(v) => (editNotes = v)}
          onRequestDelete={requestDelete}
        />
      {/snippet}

      {#snippet addForm()}
        <AddShoppingItemForm
          isOpen={addFormOpen}
          title={newItemTitle}
          notes={newItemNotes}
          onToggleForm={openAddForm}
          onTitleChange={(v) => (newItemTitle = v)}
          onNotesChange={(v) => (newItemNotes = v)}
          onReset={resetAddForm}
          onItemCreated={clearAddFormForNextItem}
        />
      {/snippet}
    </KanbanColumn>

    <!-- Ordered Column -->
    <KanbanColumn
      columnConfig={SHOPPING_COLUMNS.ordered}
      items={orderedItems}
      {flipDurationMs}
      showAll={showAllOrdered}
      onItemsChange={(items) => (orderedItems = items)}
      onDndConsider={handleDndConsider('ordered')}
      onDndFinalize={handleDndFinalize('ordered')}
      onToggleShowAll={() => (showAllOrdered = !showAllOrdered)}
    >
      {#snippet renderCard(item: ShoppingItem)}
        <ShoppingCard
          {item}
          columnId="ordered"
          isEditing={editingItemId === item.id}
          {editTitle}
          {editNotes}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onEditTitleChange={(v) => (editTitle = v)}
          onEditNotesChange={(v) => (editNotes = v)}
          onRequestDelete={requestDelete}
          isOrdered={true}
        />
      {/snippet}
    </KanbanColumn>
  </div>

  <!-- Delete Confirmation Modal -->
  <ConfirmModal
    isOpen={itemToDelete !== null}
    title="Delete Item"
    message="Are you sure you want to delete this item? This action cannot be undone."
    confirmText="Delete"
    cancelText="Cancel"
    formAction="?/deleteItem"
    formData={itemToDelete ? { itemId: itemToDelete.id } : undefined}
    onCancel={cancelDelete}
  />

  <div class="mt-2 text-xs text-[var(--color-text-muted)]">
    Drag items between columns • Hover over cards to see actions
  </div>
</div>
