import { expect, test } from '@playwright/test'

test.describe('Dashboard shell', () => {
  test('loads dashboard, captures light/dark screenshots, and opens calendar', async ({ page, context }) => {
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="dashboard-hero"]')

    await page.setViewportSize({ width: 1440, height: 900 })

    await expect(page).toHaveScreenshot('dashboard-light.png', { animations: 'disabled', fullPage: true })

    const themeToggle = page.getByRole('button', { name: /toggle theme/i })
    await themeToggle.click()
    await page.waitForTimeout(250)
    await expect(page).toHaveScreenshot('dashboard-dark.png', { animations: 'disabled', fullPage: true, maxDiffPixelRatio: 0.01 })

    await page.getByRole('link', { name: /open calendar/i }).first().click()
    await page.waitForURL('**/calendar/**')
    await expect(page).toHaveURL(/\/calendar\//)
  })
})
