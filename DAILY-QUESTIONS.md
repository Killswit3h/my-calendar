Daily Report – Open Questions and Proposed Defaults

Ambiguity: Scale vs Margins
- Spec mentions “scaled down to 40% of the original printed area,” but Unknowns say “compute margins so layout width = 60% of printable width.”
- Proposal:
  - Option A (transform): Render full-size layout (7.5 in content width after 0.5 in margins) and apply a print-only CSS transform scale(0.6) centered.
  - Option B (margins): Compute margins so content box equals 60% of printable width without transform. If Letter 8.5×11 and we use symmetric margins M, content width = 8.5 − 2M. Set 8.5 − 2M = 0.6 × 8.5 ⇒ M = 1.7 in. That yields content width 5.1 in. Please confirm A or B, and confirm the target scale (40% vs 60%).

Exact Margins (proposed if using margins approach)
- Top: 1.7 in
- Right: 1.7 in
- Bottom: 1.7 in
- Left: 1.7 in
(These implement a 60% content width centered without transforms.)

Typography (Calibri only)
- Title: 18 pt, bold, centered.
- Column headers (if shown): 10 pt, bold.
- Body cells: 10.5 pt (Calibri), regular.
- Small/auxiliary (e.g., notes metadata): 9 pt.
Confirm these exact sizes; adjust if your reference PDF uses different metrics.

Borders and Spacing
- Outer border (around each job block and the main table perimeter): 2.0 pt solid black.
- Internal grid lines (row/column separators): 0.5 pt solid black (hairline in print).
- Cell padding (top/right/bottom/left): 6 pt / 8 pt / 6 pt / 8 pt.
- Gap between job blocks (if separate blocks are used): 10 pt.
Confirm thickness/padding to match your Excel print.

Grid Column Proportions (from spec)
- Relative widths (sum ≈ 255.60):
  - Status: 11.29
  - Project/Company: 109.86
  - Invoice: 18.00
  - Crew Members: 60.00
  - Work: 12.43
  - Payroll: 8.43
  - Payment: 18.73
  - Vendor: 8.43
  - Time: 8.43
- Implementation: width% = value / 255.60 × 100%. Confirm these exact numbers.

Bold vs Regular (confirm)
- Bold: Project/Company, Invoice, Payment, Vendor, Time.
- Regular: Status, Crew Members, Work, Payroll.

Notes Section
- Location: Full-width area at bottom of the page for special information (global, not per job).
- Truncation policy: propose max 6 lines with ellipsis; overflow continues to next page if blocks continue. Confirm desired line cap and whether to allow multi-page notes.

Keep Job Block Unbroken Across Pages
- Proposal: Yes. Use page-break-inside: avoid (HTML print) or measure block height and break before rendering (renderer programmatic).
  - If a block does not fit, move it entirely to the next page.

Sorting
- Vendor priority: JORGE > TONY > CHRIS > others (alpha).
- Within same vendor: sort by Project/Company ascending, then Invoice ascending.
Confirm this exact rule.

SHOP and NO WORK Integration
- Source of truth: Current UI marks Yard/Shop and No Work in client-only local storage (lib/yard.ts, lib/absent.ts). Server PDF needs a persistent source.
- Proposal: Add API input or server store for the selected date listing employee IDs for SHOP and NO WORK. We will render them as special rows placed:
  - Option A: At the top section before vendor-sorted jobs.
  - Option B: At the bottom after all jobs.
Please confirm A or B, and the precise visual formatting (e.g., Status cell shows SHOP/NO WORK, other columns blank except Crew Members).

Renderer Choice
- Proposal: Use Playwright/Puppeteer for HTML→PDF to achieve pixel-accurate match, system Calibri usage, and easier grid layout; disable dark mode for print.
- Alternative: Continue with pdf-lib but requires manual layout measurements and embedding Calibri TTF files; more time to tune.
Please confirm preferred renderer.

API Shape
- Requested: /api/reports/daily?date=YYYY-MM-DD&download=pdf with input { date, calendarId }.
- Current: POST /api/reports/daily/generate with { date, vendor?, force? }.
- Proposal: Implement the requested GET endpoint as a thin wrapper around the existing generator, accepting optional calendarId (currently unused) and returning application/pdf with a stable filename Daily-Report-YYYY-MM-DD.pdf.
Confirm endpoint and filename format.

Sample Data Fixture
- We will prepare 6 jobs covering vendors JORGE/TONY/CHRIS/Other, plus one SHOP and one NO WORK, and long Notes to test truncation. Confirm if you have a specific reference dataset or we should synthesize.

