import React from 'react'
import ReactDOMServer from 'react-dom/server'
import fs from 'fs'
import path from 'path'
import { JobCard, type JobEntry } from '@/components/pdf/JobCard'
import { launchReportBrowser } from '@/server/reports/launchBrowser'

export type ReportInput = {
  reportDate: string
  jobs: JobEntry[]
}

function htmlShell(body: string, styles: string, headerRight: string): { html: string; header: string; footer: string } {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>${styles}</style>
    </head>
    <body>
      ${body}
    </body>
  </html>`

  // Puppeteer header/footer templates:
  const header = `<div class="pdf-header"><div class="right">${headerRight}</div></div>`
  const footer = `<div class="pdf-footer">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`
  return { html, header, footer }
}

function sanitize(s: string): string {
  return (s || '').replace(/[<>]/g, (m) => (m === '<' ? '&lt;' : '&gt;'))
}

function toDateHeader(dateIso: string): string {
  const d = new Date(dateIso + 'T12:00:00Z')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function renderJobByJobPDF(input: ReportInput): Promise<Buffer> {
  const cssPath = path.join(process.cwd(), 'src', 'reports', 'job-by-job', 'styles.css')
  const styles = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : ''

  const jobs = input.jobs || []
  const left: JobEntry[] = []
  const right: JobEntry[] = []
  for (let i = 0; i < jobs.length; i++) {
    (i % 2 === 0 ? left : right).push(jobs[i]!)
  }

  const leftHtml = left.map((j, idx) => ReactDOMServer.renderToStaticMarkup(<JobCard key={`L${idx}`} job={j} />)).join('')
  const rightHtml = right.map((j, idx) => ReactDOMServer.renderToStaticMarkup(<JobCard key={`R${idx}`} job={j} />)).join('')

  const body = `
    <div class="jj-wrapper">
      <div class="jj-columns">
        <div class="jj-col">${leftHtml}</div>
        <div class="jj-col">${rightHtml}</div>
      </div>
    </div>
  `

  const headerDate = sanitize(toDateHeader(input.reportDate))
  const { html, header, footer } = htmlShell(body, styles, headerDate)

  const browser = await launchReportBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    await page.emulateMediaType('screen')
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.333in', right: '0.333in', bottom: '0.333in', left: '0.333in' },
      displayHeaderFooter: true,
      headerTemplate: header,
      footerTemplate: footer,
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close().catch(() => {})
  }
}

// Dev helper to render sample file
export async function __devRenderSample(outFile: string) {
  const sample: ReportInput = {
    reportDate: '2025-09-30',
    jobs: [
      { projectCompany: 'H & R PAVING, INC.:T6580', jobNumber: '11930-A', crewMembers: ['Esteban Sanchez','Robert Amparo Lloret'], workType: 'FENCE', payrollAffects: true, paymentTerm: 'Daily', vendor: 'JORGE', timeUnit: 'Day' },
      { projectCompany: 'ACME ROADWORKS:12345', jobNumber: 'RW-22', crewMembers: ['Maria Lopez','John Doe'], workType: 'GUARDRAIL', payrollAffects: false, paymentTerm: 'Weekly', vendor: 'TONY', timeUnit: 'Night', notes: 'Shift near MM 45' },
      { projectCompany: 'CITY OF MIAMI:BR-77', jobNumber: 'BR-77', crewMembers: ['A Smith'], workType: 'HANDRAIL', payrollAffects: true, paymentTerm: 'Daily', vendor: 'CHRIS', timeUnit: 'Day' },
      { projectCompany: 'H & R PAVING, INC.:T6581', jobNumber: '11930-B', crewMembers: ['Esteban Sanchez','Robert Amparo Lloret','Maria Lopez'], workType: 'TEMP_FENCE', payrollAffects: false, paymentTerm: 'Monthly', vendor: 'JORGE', timeUnit: 'Night', notes: 'Note wraps to multiple lines to verify layout and avoid splitting across pages.' },
    ],
  }
  const buf = await renderJobByJobPDF(sample)
  const outDir = path.dirname(outFile)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outFile, buf)
}
