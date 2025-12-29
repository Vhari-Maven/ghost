import { test, expect } from '@playwright/test';
import { TasksPage } from './helpers/tasks-page';

test.describe('Tasks Kanban Board', () => {
  let tasks: TasksPage;

  test.beforeEach(async ({ page }) => {
    tasks = new TasksPage(page);
    await tasks.goto();
  });

  test.afterEach(async () => {
    await tasks.cleanup();
  });

  test('should display the tasks page with three columns', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Tasks');
    await expect(page.locator('h2', { hasText: 'Todo' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'In Progress' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Done' })).toBeVisible();
  });

  test('should show add task button in Todo column', async () => {
    await expect(tasks.addTaskButton()).toBeVisible();
  });

  test('should open add task form when clicking add button', async () => {
    await tasks.openAddForm();

    await expect(tasks.titleInput).toBeVisible();
    await expect(tasks.descriptionInput).toBeVisible();
    await expect(tasks.submitButton).toBeVisible();
    await expect(tasks.cancelButton).toBeVisible();
  });

  test('should create a new task', async () => {
    const taskName = tasks.uniqueName('My test task');
    const description = tasks.uniqueName('Test description');

    await tasks.createTask(taskName, { description });

    await tasks.expectTaskInColumn(taskName, 'Todo');
    const card = tasks.taskCard(taskName);
    await expect(card.locator('p', { hasText: description })).toBeVisible();
  });

  test('should create task without description', async () => {
    const taskName = tasks.uniqueName('Task without description');

    await tasks.createTask(taskName);

    await tasks.expectTaskInColumn(taskName, 'Todo');
  });

  test('should cancel adding a task', async () => {
    await tasks.openAddForm();
    await tasks.titleInput.fill('Task to cancel');
    await tasks.cancelButton.click();

    await expect(tasks.titleInput).not.toBeVisible();
    await expect(tasks.addTaskButton()).toBeVisible();
  });

  test('should disable add button when title is empty', async () => {
    await tasks.openAddForm();

    await expect(tasks.submitButton).toBeDisabled();
  });

  test('should edit a task', async () => {
    const taskName = tasks.uniqueName('Task to edit');
    const editedName = tasks.uniqueName('Edited task');

    await tasks.createTask(taskName);
    await tasks.editTask(taskName, { title: editedName });

    await expect(tasks.taskTitle(editedName)).toBeVisible();
  });

  test('should move task from Todo to In Progress', async () => {
    const taskName = tasks.uniqueName('Task to move');

    await tasks.createTask(taskName);
    await tasks.moveTaskRight(taskName, 'Todo');

    await tasks.expectTaskInColumn(taskName, 'In Progress');
  });

  test('should delete a task', async () => {
    const taskName = tasks.uniqueName('Task to delete');

    await tasks.createTask(taskName);
    await tasks.deleteTask(taskName);

    await expect(tasks.taskTitle(taskName)).not.toBeVisible();
  });

  test('should show label picker when creating task', async () => {
    await tasks.openAddForm();
    await tasks.openLabelPicker();

    // Should see default labels
    await expect(tasks.labelButton('bug')).toBeVisible();
    await expect(tasks.labelButton('feature')).toBeVisible();
    await expect(tasks.labelButton('improvement')).toBeVisible();
  });

  test('should create task with labels', async () => {
    const taskName = tasks.uniqueName('Labeled task');

    await tasks.createTask(taskName, { labels: ['bug'] });

    await tasks.expectTaskHasLabel(taskName, 'bug');
  });

  test('should navigate to tasks page from nav', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Tasks', exact: true }).click();

    await expect(page).toHaveURL('/tasks');
    await expect(page.locator('h1')).toHaveText('Tasks');
  });

  test('should show create label modal', async () => {
    await tasks.openAddForm();
    await tasks.openLabelPicker();
    await tasks.newLabelButton.click();

    await expect(tasks.createLabelModal).toBeVisible();
    await expect(tasks.labelNameInput).toBeVisible();
  });

  test('should create a new label', async () => {
    await tasks.openAddForm();
    await tasks.openLabelPicker();
    await tasks.createLabel('customlabel');

    // Close and reopen to verify label persisted
    await tasks.cancelButton.click();
    await tasks.openAddForm();
    await tasks.openLabelPicker();

    await expect(tasks.labelButton('customlabel')).toBeVisible();
  });
});

test.describe('Tasks - Drag and Drop', () => {
  let tasks: TasksPage;

  test.beforeEach(async ({ page }) => {
    tasks = new TasksPage(page);
    await tasks.goto();
  });

  test.afterEach(async () => {
    await tasks.cleanup();
  });

  test('should drag task from Todo to In Progress column', async ({ page }) => {
    const taskName = tasks.uniqueName('Drag task');

    await tasks.createTask(taskName);
    await tasks.expectTaskInColumn(taskName, 'Todo');

    await tasks.dragTask(taskName, 'Todo', 'In Progress');

    // Verify task moved (before reload)
    await tasks.expectTaskInColumn(taskName, 'In Progress');
    await tasks.expectTaskNotInColumn(taskName, 'Todo');

    // Reload to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    await tasks.expectTaskInColumn(taskName, 'In Progress');
    await tasks.expectTaskNotInColumn(taskName, 'Todo');
  });

  test('should drag task from In Progress to Done column', async ({ page }) => {
    const taskName = tasks.uniqueName('Drag to done');

    // Create task and move to In Progress via button
    await tasks.createTask(taskName);
    await tasks.moveTaskRight(taskName, 'Todo');
    await tasks.expectTaskInColumn(taskName, 'In Progress');

    // Drag to Done
    await tasks.dragTask(taskName, 'In Progress', 'Done');

    // Verify task moved (before reload)
    await tasks.expectTaskInColumn(taskName, 'Done');
    await tasks.expectTaskNotInColumn(taskName, 'In Progress');

    // Reload to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    await tasks.expectTaskInColumn(taskName, 'Done');
    await tasks.expectTaskNotInColumn(taskName, 'In Progress');
  });

  test('should reorder tasks within Todo column', async ({ page }) => {
    const task1 = tasks.uniqueName('First task');
    const task2 = tasks.uniqueName('Second task');

    await tasks.createTask(task1);
    await tasks.createTask(task2);

    // Both should be in Todo
    await tasks.expectTaskInColumn(task1, 'Todo');
    await tasks.expectTaskInColumn(task2, 'Todo');

    // Drag first task below second (reorder within column)
    const firstCard = tasks.taskCard(task1, 'Todo');
    const secondCard = tasks.taskCard(task2, 'Todo');
    await firstCard.dragTo(secondCard, { targetPosition: { x: 50, y: 80 } });

    // Both should still be in Todo (not moved to another column)
    await tasks.expectTaskInColumn(task1, 'Todo');
    await tasks.expectTaskInColumn(task2, 'Todo');

    // Reload to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    await tasks.expectTaskInColumn(task1, 'Todo');
    await tasks.expectTaskInColumn(task2, 'Todo');
  });
});

test.describe('Tasks - Done Column Behavior', () => {
  let tasks: TasksPage;

  test.beforeEach(async ({ page }) => {
    tasks = new TasksPage(page);
    await tasks.goto();
  });

  test.afterEach(async () => {
    await tasks.cleanup();
  });

  test('should show "Show all" button when more than 5 done tasks', async ({ page }) => {
    // Create 6 tasks and move them all to Done
    for (let i = 1; i <= 6; i++) {
      const taskName = tasks.uniqueName(`Done task ${i}`);

      await tasks.createTask(taskName);
      await tasks.moveTaskRight(taskName, 'Todo'); // -> In Progress
      await tasks.moveTaskRight(taskName, 'In Progress'); // -> Done
    }

    await expect(page.locator('button', { hasText: /show all/i })).toBeVisible();
  });
});
