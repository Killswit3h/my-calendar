const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('http://localhost:3000/calendar/cme9wqhpe0000ht8sr5o3a6wf', { waitUntil: 'networkidle' });
  await page.waitForSelector('.fc-toolbar-title');

  // Switch to month view to ensure consistent starting state.
  try {
    await page.click('button:has-text("Month")');
  } catch {}

  const targetLabel = 'September 2025';
  for (let i = 0; i < 24; i++) {
    const title = await page.textContent('.fc-toolbar-title');
    if (title && title.includes(targetLabel)) break;
    await page.click('.fc-next-button');
    await page.waitForTimeout(300);
  }

  // Switch to week view to show timed slot and all-day row.
  try {
    await page.click('button:has-text("Week")');
    await page.waitForTimeout(500);
  } catch {}

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'artifacts/calendar-view.png', fullPage: true });
  await browser.close();
})();
