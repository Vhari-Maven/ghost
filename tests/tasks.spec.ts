import { test, expect, type Page } from '@playwright/test';

// Each test gets a unique run ID to avoid cleanup conflicts during parallel runs
let testRunId: string;

// Use unique task names per test with the test run ID
function uniqueName(baseName: string) {
  return `[test-${testRunId}] ${baseName}`;
}

// Clean up test tasks created by this specific test run
async function cleanupTestTasks(page: Page) {
  // Delete all tasks created by this test run (they all start with [test-{runId}])
  await page.request.post('/tasks?/cleanupTestTasks', {
    form: { pattern: `[test-${testRunId}]%` }
  });
}

test.describe('Tasks Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    // Generate a unique ID for this test run
    testRunId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await page.goto('/tasks');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    // Clean up any test tasks created during the test
    await cleanupTestTasks(page);
  });

  test('should display the tasks page with three columns', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toHaveText('Tasks');

    // Check all three columns exist
    await expect(page.locator('h2', { hasText: 'Todo' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'In Progress' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Done' })).toBeVisible();
  });

  test('should show add task button in Todo column', async ({ page }) => {
    const addButton = page.locator('button', { hasText: 'Add task' });
    await expect(addButton).toBeVisible();
  });

  test('should open add task form when clicking add button', async ({ page }) => {
    // Click add task button
    await page.locator('button', { hasText: 'Add task' }).click();

    // Wait for form to appear
    await page.waitForTimeout(100);

    // Form should appear with title input
    const titleInput = page.locator('input[placeholder="Task title..."]');
    await expect(titleInput).toBeVisible();

    const descInput = page.locator('textarea[placeholder="Description (optional)"]');
    await expect(descInput).toBeVisible();

    await expect(page.locator('button[type="submit"]', { hasText: 'Add' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Cancel' })).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    const taskName = uniqueName('My test task');
    const description = uniqueName('Test description');

    // Open add form
    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);

    // Fill in the form
    await page.locator('input[placeholder="Task title..."]').fill(taskName);
    await page.locator('textarea[placeholder="Description (optional)"]').first().fill(description);

    // Submit
    await page.locator('button[type="submit"]', { hasText: 'Add' }).click();

    // Wait for submission
    await page.waitForTimeout(500);

    // Task should appear in the Todo column
    await expect(page.locator('h3', { hasText: taskName })).toBeVisible();
    // Verify description is on the task card
    const taskCard = page.locator('.group').filter({ hasText: taskName }).first();
    await expect(taskCard.locator('p', { hasText: description })).toBeVisible();
  });

  test('should create task without description', async ({ page }) => {
    const taskName = uniqueName('Task without description');

    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);

    await page.locator('input[placeholder="Task title..."]').fill(taskName);
    await page.locator('button[type="submit"]', { hasText: 'Add' }).click();

    await page.waitForTimeout(500);
    await expect(page.locator('h3', { hasText: taskName })).toBeVisible();
  });

  test('should cancel adding a task', async ({ page }) => {
    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);

    await page.locator('input[placeholder="Task title..."]').fill('Task to cancel');
    await page.locator('button', { hasText: 'Cancel' }).click();

    // Form should be closed
    await expect(page.locator('input[placeholder="Task title..."]')).not.toBeVisible();
    // Add button should be back
    await expect(page.locator('button', { hasText: 'Add task' })).toBeVisible();
  });

  test('should disable add button when title is empty', async ({ page }) => {
    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);

    // The submit Add button should be disabled when title is empty
    const submitButton = page.locator('button[type="submit"]', { hasText: 'Add' });
    await expect(submitButton).toBeDisabled();
  });

  test('should edit a task', async ({ page }) => {
    const taskName = uniqueName('Task to edit');
    const editedName = uniqueName('Edited task');

    // First create a task
    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);
    await page.locator('input[placeholder="Task title..."]').fill(taskName);
    await page.locator('button[type="submit"]', { hasText: 'Add' }).click();

    // Wait for task to appear
    await page.waitForTimeout(500);
    await expect(page.locator('h3', { hasText: taskName })).toBeVisible();

    // Hover to reveal edit button and click it
    const taskCard = page.locator('.group').filter({ hasText: taskName }).first();
    await taskCard.hover();
    await taskCard.locator('button[title="Edit"]').click();

    // Edit form should appear - wait a bit
    await page.waitForTimeout(200);

    // When editing, the card is replaced by a form - find the input by name within the column
    const editInput = page.locator('input[name="title"]').last();
    await editInput.clear();
    await editInput.fill(editedName);

    // Save
    await page.locator('button[type="submit"]', { hasText: 'Save' }).click();
    await page.waitForTimeout(500);

    // Check edited title appears
    await expect(page.locator('h3', { hasText: editedName })).toBeVisible();
  });

  test('should move task from Todo to In Progress', async ({ page }) => {
    const taskName = uniqueName('Task to move');

    // Create a task
    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);
    await page.locator('input[placeholder="Task title..."]').fill(taskName);
    await page.locator('button[type="submit"]', { hasText: 'Add' }).click();

    await page.waitForTimeout(500);
    await expect(page.locator('h3', { hasText: taskName })).toBeVisible();

    // Hover to reveal move button and click right arrow
    const taskCard = page.locator('.group').filter({ hasText: taskName }).first();
    await taskCard.hover();
    await taskCard.locator('button[title="Move right"]').click();

    await page.waitForTimeout(500);

    // The task should still be visible (now in In Progress column)
    await expect(page.locator('h3', { hasText: taskName })).toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    const taskName = uniqueName('Task to delete');

    // Create a task
    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);
    await page.locator('input[placeholder="Task title..."]').fill(taskName);
    await page.locator('button[type="submit"]', { hasText: 'Add' }).click();

    await page.waitForTimeout(500);
    await expect(page.locator('h3', { hasText: taskName })).toBeVisible();

    // Set up dialog handler before triggering delete
    page.on('dialog', dialog => dialog.accept());

    // Hover and click delete
    const taskCard = page.locator('.group').filter({ hasText: taskName }).first();
    await taskCard.hover();
    await taskCard.locator('button[title="Delete"]').click();

    await page.waitForTimeout(500);

    // Task should be gone
    await expect(page.locator('h3', { hasText: taskName })).not.toBeVisible();
  });

  test('should show label picker when creating task', async ({ page }) => {
    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);

    // Click labels button
    await page.locator('button', { hasText: 'Labels' }).click();
    await page.waitForTimeout(100);

    // Should see default labels
    await expect(page.locator('button', { hasText: 'bug' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'feature' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'improvement' })).toBeVisible();
  });

  test('should create task with labels', async ({ page }) => {
    const taskName = uniqueName('Labeled task');

    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);
    await page.locator('input[placeholder="Task title..."]').fill(taskName);

    // Open label picker and select a label
    await page.locator('button', { hasText: 'Labels' }).click();
    await page.waitForTimeout(100);
    await page.locator('button', { hasText: 'bug' }).click();

    // Submit
    await page.locator('button[type="submit"]', { hasText: 'Add' }).click();
    await page.waitForTimeout(500);

    // Task should appear with the label
    await expect(page.locator('h3', { hasText: taskName })).toBeVisible();
    // The label chip should be visible on the task card
    const taskCard = page.locator('.group').filter({ hasText: taskName }).first();
    await expect(taskCard.locator('span', { hasText: 'bug' })).toBeVisible();
  });

  test('should navigate to tasks page from nav', async ({ page }) => {
    // Start from home
    await page.goto('/');

    // Click Tasks nav link
    await page.locator('a', { hasText: 'Tasks' }).click();

    // Should be on tasks page
    await expect(page).toHaveURL('/tasks');
    await expect(page.locator('h1')).toHaveText('Tasks');
  });

  test('should show create label modal', async ({ page }) => {
    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);
    await page.locator('button', { hasText: 'Labels' }).click();
    await page.waitForTimeout(100);

    // Click new label button
    await page.locator('button', { hasText: '+ New label' }).click();
    await page.waitForTimeout(100);

    // Modal should appear
    await expect(page.locator('h3', { hasText: 'Create New Label' })).toBeVisible();
    await expect(page.locator('input[placeholder="Label name"]')).toBeVisible();
  });

  test('should create a new label', async ({ page }) => {
    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);
    await page.locator('button', { hasText: 'Labels' }).click();
    await page.waitForTimeout(100);
    await page.locator('button', { hasText: '+ New label' }).click();
    await page.waitForTimeout(100);

    // Fill in label name
    await page.locator('input[placeholder="Label name"]').fill('customlabel');

    // Click create
    await page.locator('button[type="submit"]', { hasText: 'Create' }).click();
    await page.waitForTimeout(500);

    // Modal should close
    await expect(page.locator('h3', { hasText: 'Create New Label' })).not.toBeVisible();

    // The label picker is still open, and the new label should now be visible
    // Note: the page reloads after form submission, so the label picker might close
    // Let's check if the label was created by opening it again

    // Close and reopen the add task form to get fresh state
    await page.locator('button', { hasText: 'Cancel' }).click();
    await page.waitForTimeout(200);

    await page.locator('button', { hasText: 'Add task' }).click();
    await page.waitForTimeout(100);
    await page.locator('button', { hasText: 'Labels' }).click();
    await page.waitForTimeout(100);

    // Now check for the new label
    await expect(page.locator('button', { hasText: 'customlabel' })).toBeVisible();
  });
});

test.describe('Tasks - Done Column Behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Generate a unique ID for this test run
    testRunId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTasks(page);
  });

  test('should show "Show all" button when more than 5 done tasks', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Create 6 tasks and move them all to done
    const taskNames: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const taskName = uniqueName(`Done task ${i}`);
      taskNames.push(taskName);

      await page.locator('button', { hasText: 'Add task' }).click();
      await page.waitForTimeout(100);
      await page.locator('input[placeholder="Task title..."]').fill(taskName);
      await page.locator('button[type="submit"]', { hasText: 'Add' }).click();
      await page.waitForTimeout(300);

      // Move to In Progress
      let taskCard = page.locator('.group').filter({ hasText: taskName }).first();
      await taskCard.hover();
      await taskCard.locator('button[title="Move right"]').click();
      await page.waitForTimeout(300);

      // Move to Done
      taskCard = page.locator('.group').filter({ hasText: taskName }).first();
      await taskCard.hover();
      await taskCard.locator('button[title="Move right"]').click();
      await page.waitForTimeout(300);
    }

    // Should see "Show all" button
    await expect(page.locator('button', { hasText: /show all/i })).toBeVisible();
  });
});
