import { expect, test } from '@playwright/test'

test.describe('Sidebar navigation', () => {
  test('highlights active route', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/dashboard')
    await page.waitForTimeout(200)

    const dashboardLink = page.locator('[data-nav-key="dashboard"]').first()
    await expect(dashboardLink).toHaveAttribute('aria-current', 'page')

    await page.goto('/inventory/items')
    const inventoryLink = page.locator('[data-nav-key="inventory"]').first()
    await expect(inventoryLink).toHaveAttribute('aria-current', 'page')
  })
})
