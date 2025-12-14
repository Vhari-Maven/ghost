import { expect, type Page, type Locator } from '@playwright/test';

type ColumnName = 'Todo' | 'In Progress' | 'Done';

/**
 * Page Object Model for the Tasks kanban board.
 * Encapsulates locators and common actions to keep tests clean and maintainable.
 */
export class TasksPage {
  readonly page: Page;
  readonly testRunId: string;

  // Form locators (visible ones depend on which column's form is open)
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly labelsButton: Locator;
  readonly saveButton: Locator;

  // Label modal locators
  readonly newLabelButton: Locator;
  readonly labelNameInput: Locator;
  readonly createLabelButton: Locator;
  readonly createLabelModal: Locator;

  // Delete confirmation modal locators
  readonly deleteModal: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.testRunId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Form locators - these target the visible form (only one open at a time)
    this.titleInput = page.locator('input[placeholder="Task title..."]');
    this.descriptionInput = page.locator('textarea[placeholder="Description (optional)"]').first();
    this.submitButton = page.locator('button[type="submit"]', { hasText: 'Add' });
    this.cancelButton = page.locator('button', { hasText: 'Cancel' }).first();
    this.labelsButton = page.locator('button', { hasText: 'Labels' });
    this.saveButton = page.locator('button[type="submit"]', { hasText: 'Save' });

    // Label modal locators
    this.newLabelButton = page.locator('button', { hasText: '+ New label' });
    this.labelNameInput = page.locator('input[placeholder="Label name"]');
    this.createLabelButton = page.locator('button[type="submit"]', { hasText: 'Create' });
    this.createLabelModal = page.locator('h3', { hasText: 'Create New Label' });

    // Delete confirmation modal locators
    this.deleteModal = page.locator('h3', { hasText: 'Delete Task' });
    this.confirmDeleteButton = page.locator('.fixed button[type="submit"]', { hasText: 'Delete' });
    this.cancelDeleteButton = page.locator('.fixed button', { hasText: 'Cancel' });
  }

  /** Get the add task button for a specific column */
  addTaskButton(column: ColumnName = 'Todo'): Locator {
    return this.column(column).locator('button', { hasText: 'Add task' });
  }

  /** Generate a unique task name scoped to this test run */
  uniqueName(baseName: string): string {
    return `[test-${this.testRunId}] ${baseName}`;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Column & Task Locators
  // ─────────────────────────────────────────────────────────────────────────────

  /** Get a column container by name */
  column(name: 'Todo' | 'In Progress' | 'Done'): Locator {
    return this.page
      .locator('div.min-w-\\[300px\\]')
      .filter({ has: this.page.locator('h2', { hasText: name }) });
  }

  /** Get the drag-and-drop zone within a column */
  dropZone(columnName: 'Todo' | 'In Progress' | 'Done'): Locator {
    return this.column(columnName).locator('[role="list"]');
  }

  /** Get a task card, optionally scoped to a specific column */
  taskCard(taskName: string, column?: 'Todo' | 'In Progress' | 'Done'): Locator {
    const scope = column ? this.column(column) : this.page;
    return scope.locator('.group').filter({ hasText: taskName }).first();
  }

  /** Get a task's title heading, optionally scoped to a specific column */
  taskTitle(taskName: string, column?: 'Todo' | 'In Progress' | 'Done'): Locator {
    const scope = column ? this.column(column) : this.page;
    return scope.locator('h3', { hasText: taskName });
  }

  /** Get a label button in the label picker */
  labelButton(labelName: string): Locator {
    return this.page.locator('button', { hasText: labelName });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────────────────

  /** Navigate to the tasks page and wait for it to load */
  async goto(): Promise<void> {
    await this.page.goto('/tasks');
    await this.page.waitForLoadState('networkidle');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Task Actions
  // ─────────────────────────────────────────────────────────────────────────────

  /** Open the add task form in a specific column (defaults to Todo) */
  async openAddForm(column: ColumnName = 'Todo'): Promise<void> {
    await this.addTaskButton(column).click();
    await expect(this.titleInput).toBeVisible();
  }

  /** Create a new task with optional description, labels, and target column */
  async createTask(
    title: string,
    options?: { description?: string; labels?: string[]; column?: ColumnName }
  ): Promise<void> {
    const targetColumn = options?.column ?? 'Todo';
    await this.openAddForm(targetColumn);
    await this.titleInput.fill(title);

    if (options?.description) {
      await this.descriptionInput.fill(options.description);
    }

    if (options?.labels?.length) {
      await this.labelsButton.click();
      for (const label of options.labels) {
        await this.labelButton(label).click();
      }
    }

    await this.submitButton.click();
    await expect(this.taskTitle(title, targetColumn)).toBeVisible();
  }

  /** Edit an existing task's title and/or description */
  async editTask(
    taskName: string,
    newValues: { title?: string; description?: string }
  ): Promise<void> {
    const card = this.taskCard(taskName);
    await card.hover();
    await card.locator('button[title="Edit"]').click();

    const editTitleInput = this.page.locator('input[name="title"]').last();
    await expect(editTitleInput).toBeVisible();

    if (newValues.title) {
      await editTitleInput.clear();
      await editTitleInput.fill(newValues.title);
    }

    if (newValues.description !== undefined) {
      const editDescInput = this.page.locator('textarea[name="description"]').last();
      await editDescInput.clear();
      await editDescInput.fill(newValues.description);
    }

    await this.saveButton.click();

    // Wait for the edit to complete
    const expectedTitle = newValues.title || taskName;
    await expect(this.taskTitle(expectedTitle)).toBeVisible();
  }

  /** Move a task to the right using the arrow button */
  async moveTaskRight(
    taskName: string,
    fromColumn?: 'Todo' | 'In Progress' | 'Done'
  ): Promise<void> {
    const card = this.taskCard(taskName, fromColumn);
    await card.hover();
    await card.locator('button[title="Move right"]').click();
    // Brief wait for the move to process
    await this.page.waitForTimeout(300);
  }

  /** Move a task to the left using the arrow button */
  async moveTaskLeft(
    taskName: string,
    fromColumn?: 'Todo' | 'In Progress' | 'Done'
  ): Promise<void> {
    const card = this.taskCard(taskName, fromColumn);
    await card.hover();
    await card.locator('button[title="Move left"]').click();
    await this.page.waitForTimeout(300);
  }

  /** Drag a task from one column to another */
  async dragTask(
    taskName: string,
    from: 'Todo' | 'In Progress' | 'Done',
    to: 'Todo' | 'In Progress' | 'Done'
  ): Promise<void> {
    const taskCard = this.taskCard(taskName, from);
    const targetZone = this.dropZone(to);

    const taskBox = await taskCard.boundingBox();
    const targetBox = await targetZone.boundingBox();

    if (!taskBox || !targetBox) {
      throw new Error(`Could not get bounding boxes for drag operation`);
    }

    // Calculate center points
    const startX = taskBox.x + taskBox.width / 2;
    const startY = taskBox.y + taskBox.height / 2;
    const endX = targetBox.x + targetBox.width / 2;
    const endY = targetBox.y + targetBox.height / 2;

    // Perform the drag with explicit mouse events for svelte-dnd-action compatibility
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.waitForTimeout(100); // Let dnd-action register the drag
    await this.page.mouse.move(endX, endY, { steps: 10 });
    await this.page.waitForTimeout(100);
    await this.page.mouse.up();
    await this.page.waitForTimeout(300); // Let the drop be processed
  }

  /** Delete a task using the confirmation modal */
  async deleteTask(taskName: string): Promise<void> {
    const card = this.taskCard(taskName);
    await card.hover();
    await card.locator('button[title="Delete"]').click();

    // Wait for modal and confirm deletion
    await expect(this.deleteModal).toBeVisible();
    await this.confirmDeleteButton.click();

    await expect(this.taskTitle(taskName)).not.toBeVisible();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Label Actions
  // ─────────────────────────────────────────────────────────────────────────────

  /** Open the label picker (must have add form open first) */
  async openLabelPicker(): Promise<void> {
    await this.labelsButton.click();
    await expect(this.newLabelButton).toBeVisible();
  }

  /** Create a new label via the modal */
  async createLabel(name: string): Promise<void> {
    await this.newLabelButton.click();
    await expect(this.createLabelModal).toBeVisible();
    await this.labelNameInput.fill(name);
    await this.createLabelButton.click();
    await expect(this.createLabelModal).not.toBeVisible();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Assertions
  // ─────────────────────────────────────────────────────────────────────────────

  /** Assert that a task is visible in a specific column */
  async expectTaskInColumn(
    taskName: string,
    column: 'Todo' | 'In Progress' | 'Done'
  ): Promise<void> {
    await expect(this.taskTitle(taskName, column)).toBeVisible();
  }

  /** Assert that a task is NOT visible in a specific column */
  async expectTaskNotInColumn(
    taskName: string,
    column: 'Todo' | 'In Progress' | 'Done'
  ): Promise<void> {
    await expect(this.taskTitle(taskName, column)).not.toBeVisible();
  }

  /** Assert that a task has a specific label */
  async expectTaskHasLabel(taskName: string, labelName: string): Promise<void> {
    const card = this.taskCard(taskName);
    await expect(card.locator('span', { hasText: labelName })).toBeVisible();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────────────────

  /** Clean up all tasks created by this test run */
  async cleanup(): Promise<void> {
    await this.page.request.post('/tasks?/cleanupTestTasks', {
      form: { pattern: `[test-${this.testRunId}]%` },
    });
  }
}
