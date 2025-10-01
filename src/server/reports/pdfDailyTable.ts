import puppeteer from 'puppeteer'
import type { DailyReport } from '@/server/reports/mapToDailyReport'
import { renderDailyHTML } from '@/server/reports/templates/daily-html'

export async function dailyTableToPdf(data: DailyReport): Promise<Uint8Array> {
  const html = renderDailyHTML(data)
  const browser = await puppeteer.launch({ headless: true })
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

