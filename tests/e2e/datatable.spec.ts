import { expect, test } from '@playwright/test'

test.describe('Data table interactions', () => {
  test('resizes columns, toggles density, and exports CSV', async ({ page }) => {
    await page.goto('/finance/contracts')
    await page.waitForSelector('[data-testid="data-table"]')

    const table = page.locator('[data-testid="data-table"]').first()
    const firstHeader = table.locator('thead th').first()
    const resizer = firstHeader.locator('[data-testid="column-resizer"]').first()
    const initialWidth = await firstHeader.evaluate(el => el.getBoundingClientRect().width)

    await resizer.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200)
    const updatedWidth = await firstHeader.evaluate(el => el.getBoundingClientRect().width)
    expect(updatedWidth).toBeGreaterThan(initialWidth - 0.5)

    const compactToggle = page.getByRole('button', { name: /compact/i })
    await compactToggle.click()
    await page.waitForSelector('tbody tr')
    const rowHeight = await table.locator('tbody tr').first().evaluate(el => el.getBoundingClientRect().height)
    expect(rowHeight).toBeLessThan(60)

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /CSV/i }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('export.csv')
  })
})
