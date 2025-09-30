Project: My Calendar — Daily Report Audit (current state)

Entry Points and Callers
- Current generator entry: snapshotsToPdfPuppeteer in src/server/reports/pdfPuppeteer.ts
- Callers:
  - GET /api/reports/daily at src/app/api/reports/daily/route.ts
  - POST /api/reports/daily/generate at src/app/api/reports/daily/generate/route.ts
  - Reports UI: src/app/reports/page.tsx lists recent files and triggers weekly generation; Calendar UI triggers daily generation via POST (see src/components/CalendarWithData.tsx:1235)
- Legacy renderer still present: src/server/reports/pdfEdge.ts (pdf-lib) but not used by the daily routes after the switch.

Renderer Technology
- Puppeteer (server HTML→PDF), headless true, printBackground on.
- HTML shell + CSS loaded from src/reports/daily/styles.css.
- pdf-lib retained only for legacy (not used by daily endpoints).

Page, Margins, Scale
- Page: US Letter 8.5×11 in, portrait.
- Margins: 0.5 in on all sides (Puppeteer pdf options and @page margin).
- Scale: CSS transform on a wrapper with scale = 0.60; transform-origin top-left; wrapper width is adjusted so the scaled content remains centered within margins.

Fonts and Typography
- Fonts declared via @font-face in src/reports/daily/styles.css:
  - Calibri Regular/Bold (expects TTFs at /public/fonts)
  - Fallback: Carlito Regular/Bold (expects TTFs at /public/fonts), then system sans-serif
- Sizes: Title 16 pt; Project 11 pt; Body 10 pt; Small 9 pt.
- Bold only for Project/Company, Invoice, Payment, Vendor, Time (others regular).

Grid and Borders
- Single job row uses fixed fractional widths derived from weights (sum 255.60):
  - Status 11.29, Project 109.86, Invoice 18, Crew 60, Work 12.43, Payroll 8.43, Payment 18.73, Vendor 8.43, Time 8.43
  - Computed as flex-basis % in the renderer with vertical dividers between columns (border-right: 0.5 pt)
- Job card outer border: 2 pt black; internal horizontal line at top of first row is suppressed; subsequent rows (if any) use 0.5 pt hairlines.
- Padding: 6 pt top/bottom, 8 pt left/right; gap between job cards: 8 pt.
- Vertical alignment: center by default; Crew column allows wrapping with fixed line height 14 pt.

Data and Ordering
- Data: DaySnapshot produced by src/server/reports/queries.ts (maps Prisma Event rows).
- Sorting: Implemented vendor priority JORGE → TONY → CHRIS → others A–Z; tie-breaker by project.
- SHOP/NO WORK: Not sourced from Unassigned (localStorage) yet; current server pipeline does not pull Yard/Shop or No Work assignments.

API Shape
- GET /api/reports/daily?date=YYYY-MM-DD&calendarId=...&download=pdf → returns application/pdf; if download=pdf, sets Content-Disposition filename "Daily-Report-YYYY-MM-DD.pdf".
- POST /api/reports/daily/generate { date, vendor?, force? } → stores PDF/XLSX, returns URLs; now uses Puppeteer for PDF.
- Temp file serving: src/app/api/reports/tmp/[id]/route.ts; storage abstraction at src/server/blob.ts (Vercel Blob or local artifacts/reports).

Reference and Verification
- Provided reference: /mnt/data/Daily 9-25-25.pdf (not accessible in this environment). No visual diff has been executed yet.
- VERIFICATION.md and visual tests not implemented yet in this branch.

Current Gaps vs Excel Reference
- Fonts: Calibri/Carlito must be provided under /public/fonts for exact metrics.
- SHOP/NO WORK: Needs server-accessible source (API or DB) to include those sections after vendor-sorted jobs.
- Pixel parity: Fine-tuning of scale/margins/internal paddings may be required after comparing to the reference (±1–2 pt adjustments permitted).

Conclusion
- The daily report now renders via Puppeteer with the required page setup, scaling, grid proportions, and typographic rules. To reach pixel-perfect parity with the Excel/Sheets reference, we need the font files, integrate SHOP/NO WORK from Unassigned logic on the server, and add a visual diff workflow to tune spacing precisely.
