import puppeteer from 'puppeteer'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import type { DailyReport } from '@/server/reports/mapToDailyReport'
import { renderDailyHTML } from '@/server/reports/templates/daily-html'

export async function dailyTableToPdf(data: DailyReport): Promise<Uint8Array> {
  const html = renderDailyHTML(data)
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_REGION
  const browser = isServerless
    ? await puppeteerCore.launch({
        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
        executablePath: await chromium.executablePath(),
        headless: true,
        defaultViewport: chromium.defaultViewport,
      })
    : await puppeteer.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.emulateMediaType('screen')
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'Letter',
      landscape: true,
      printBackground: true,
      margin: { top: '0.25in', right: '0.25in', bottom: '0.25in', left: '0.25in' },
    })
    return new Uint8Array(pdf)
  } finally {
    await browser.close().catch(() => {})
  }
}

