import { test, expect } from '@playwright/test'

test.describe('Planner Todos', () => {
  test('can add, organize, and complete a task', async ({ page }) => {
    await page.goto('/planner/todos')

    const input = page.getByTestId('new-todo-input')
    await expect(input).toBeVisible()

    const title = 'Playwright smoke task'
    await input.fill(title)
    await page.keyboard.press('Enter')

    const todoRow = page.getByTestId('todo-item').filter({ hasText: title })
    await expect(todoRow).toBeVisible()

    // Open detail pane
    await todoRow.getByTestId('todo-open-detail').click()

    // Star the item using row action
    const starButton = todoRow.getByRole('button', { name: /mark important/i })
    await starButton.click()

    // Due today via detail pane input
    const today = new Date()
    const iso = today.toISOString().slice(0, 10)
    const dueInput = page.locator('[data-testid="due-date-input"]')
    await dueInput.fill(iso)
    await dueInput.blur()

    // Add a step and rename it
    await page.getByRole('button', { name: /add step/i }).click()
    const stepInput = page.getByRole('textbox').filter({ hasValue: 'New step' }).first()
    await stepInput.fill('Confirm site access')
    await stepInput.blur()

    // Mark complete from detail pane
    await page.getByRole('button', { name: /mark complete/i }).first().click()

    // Verify flags reflected in list view
    await expect(todoRow).toContainText('Playwright smoke task')
    await expect(todoRow.getByRole('button', { name: /remove star/i })).toBeVisible()
  })
})
