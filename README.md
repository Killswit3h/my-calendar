# My Calendar Starter (Next.js + Prisma + FullCalendar v6)

## Quickstart

1. Unzip this into a new folder, open in VS Code.
2. Create `.env` (already added in this repo) and adjust `DATABASE_URL`/`DIRECT_URL` for your Postgres.
3. Install deps:
   ```bash
   npm install
   ```
4. Start a local Postgres with Docker (optional):
   ```bash
   docker compose up -d db
   ```
   Then initialize DB:
   ```bash
   npx prisma db push   # or: npx prisma migrate dev -n init
   npx prisma studio    # add a Calendar row and copy its id
   ```
5. Run:
   ```bash
   npm run dev
   ```
6. Visit:
   - `/` shows a demo calendar (no DB)
   - `/calendar/<YOUR_CALENDAR_ID>` shows your DB-backed calendar with add/drag.

Dev without DB:

- If Postgres is temporarily unavailable, API GETs return empty lists and POST/updates return `503 Database unavailable` instead of crashing. This keeps the app usable until the DB is up.

Notes:

- FullCalendar CSS is imported from the plugin (`@fullcalendar/daygrid/index.css`) inside the component to avoid module path issues.
- Prisma Client is provided via `src/lib/prisma.ts` singleton.

## Local PostgreSQL Database Setup

This project includes a Docker Compose configuration for running a local PostgreSQL database, which is useful for development without affecting production data.

### Prerequisites

#### 1. Install Docker Desktop

1. Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
2. Open Docker Desktop and wait until it shows "Docker Desktop is running" in the menu bar
3. Verify installation:
   ```bash
   docker --version
   ```

#### 2. Install PostgreSQL Client Tools

You'll need `psql`, `pg_dump`, and `pg_restore` for database operations. Install via Homebrew:

```bash
brew install libpq
brew link --force libpq
```

Add to your PATH (add this line to `~/.zshrc`):

```bash
echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Note:** On Intel Macs, use `/usr/local/opt/libpq/bin` instead of `/opt/homebrew/opt/libpq/bin`.

Verify installation:

```bash
psql --version
pg_dump --version
pg_restore --version
```

**NOTE**: If this returns a `zsh: command not found` error, restart your terminal.

```bash
docker compose exec db psql -U user -d db
```

### Starting the Local Database

1. Navigate to the project directory:

   ```bash
   cd /path/to/my-calendar
   ```

2. Start the PostgreSQL container:

   ```bash
   docker compose up -d db
   ```

3. Verify it's running:

   ```bash
   docker compose ps
   ```

   You should see the `db` service with status "Up". You can also check in Docker Desktop under "Containers".

### Database Connection Details

Once running, your local database connection string is:

```
postgresql://user:password@localhost:5432/db
```

### Testing the Connection

Test with `psql`:

```bash
psql -h localhost -U user -d db
```

When prompted, enter password: `password`

### Managing the Database

#### Start the database:

```bash
docker compose start db
# or
docker compose up -d db
```

#### Stop the database (keeps data):

```bash
docker compose stop db
```

#### Stop and remove the database (deletes all data):

```bash
docker compose down
```

#### Stop and remove everything including volumes (complete reset):

```bash
docker compose down -v
```

#### View database logs:

```bash
docker compose logs db
```

#### View real-time logs:

```bash
docker compose logs -f db
```

### Next Steps

After the database is running:

1. Apply Prisma migrations:

   ```bash
   npx prisma migrate dev
   ```

2. (Optional) Seed the database:

   ```bash
   npm run seed
   ```

3. Open Prisma Studio to view/edit data:
   ```bash
   npx prisma studio
   ```

### Troubleshooting

#### Port 5432 Already in Use

If you get an error that port 5432 is already in use:

1. Check what's using the port:

   ```bash
   lsof -i :5432
   ```

2. Stop any other PostgreSQL instances, or modify `docker-compose.yml` to use a different port:
   ```yaml
   ports:
     - "5433:5432" # Use 5433 instead
   ```

#### Container Won't Start

1. Check Docker Desktop is running
2. View container logs:
   ```bash
   docker compose logs db
   ```
3. Check container status:
   ```bash
   docker compose ps
   ```

#### Connection Refused

If you can't connect to the database:

1. Verify the container is running:

   ```bash
   docker compose ps
   ```

2. Check if the port is accessible:

   ```bash
   nc -zv localhost 5432
   ```

3. Restart the container:
   ```bash
   docker compose restart db
   ```

### Todo email notifications

- Configure Gmail credentials in `.env` (use an app password for best security):
  ```
  GMAIL_USER=guaranteedfencecorp@gmail.com
  GMAIL_PASS=your-app-password
  ```
- Edit any todo list (Sidebar → ⋯ → Edit) to set the notification email and toggle “Email me when new tasks are added.” The Robert/Pedro lists can each point to their respective work inboxes.
- When a new task is added to a configured list, the server sends a concise email via Gmail SMTP.

## Finance Labor Cost Dashboard

1. Enable the feature flag and overtime settings in `.env`:
   ```
   FINANCE_LABOR_ENABLED=true
   LABOR_DEFAULT_DAY_HOURS=8
   LABOR_OVERTIME_THRESHOLD=8
   LABOR_OT_MULTIPLIER=1.5
   ```
2. Apply the latest migrations (includes the new `Project` model and event links):
   ```bash
   npx prisma migrate dev -n "finance-labor"   # or `migrate deploy` in CI
   npx prisma generate
   ```
3. (Optional) load demo finance data (projects, events, assignments):
   ```bash
   SEED_FINANCE=1 npx prisma db seed
   ```
4. Start the app and open `/finance` for the project-level labor dashboard. Click “View detail” to drill into `/finance/job/<JOB_ID>` for daily crew breakdowns and CSV export.

### Finance Labor API

The dashboard calls a new aggregation endpoint that derives costs straight from calendar events and assignments.

```
GET /api/finance/labor?from=2025-10-01&to=2025-10-31
```

Example (truncated) response:

```json
{
  "range": { "from": "2025-10-01", "to": "2025-10-31" },
  "projects": [
    {
      "projectKey": "project:proj-guardrail-i95",
      "projectId": "proj-guardrail-i95",
      "projectName": "I-95 Guardrail Upgrade",
      "customerName": "FDOT District 4",
      "firstEvent": "2025-10-07T22:00:00.000Z",
      "lastEvent": "2025-10-18T12:00:00.000Z",
      "totalHours": 96,
      "totalCost": 2280,
      "employees": [
        {
          "employeeId": "adrian-ramos",
          "hours": 48,
          "cost": 1200,
          "payRate": 25,
          "missingPayRate": false
        }
      ],
      "warnings": [],
      "eventCount": 2
    }
  ],
  "summary": {
    "projects": 2,
    "totalHours": 168,
    "totalCost": 4488,
    "employees": 5,
    "warnings": 1
  }
}
```

Warnings surface missing project/customer links, zero-length events, or employees without pay rates. Totals are rounded to two decimals.

## FDOT pay item quantities

- New Prisma models `PayItem` and `EventQuantity` power per-event quantity tracking. Migrations live under `prisma/migrations/20250923094500_pay_items_quantities`.
- Manage the pay item catalog at `/admin/payitems` (search, inline edit, delete, CSV import, optional seed helper).
- Once an event is saved, the modal shows a **Quantities** editor: search pay items, enter quantities up to six decimals, optional station/notes, and save back to the server. Events with quantities display a “QTY” pill on the calendar.
- Run billing cut-off reports at `/reports/billing` with date range/customer filters plus CSV export.
- API additions live under `/api/payitems/*`, `/api/events/[id]/quantities`, and `/api/reports/quantities`.
- Tests for the import path, quantities upsert, and report filtering run via:
  ```bash
  npm test
  ```

## Customers (QuickBooks CSV → Customer Combobox)

This repo now includes a Customer directory and a typeahead combobox integrated with the event form.

- Prisma model: `Customer { id cuid() @id, name String @unique, createdAt DateTime @default(now()), updatedAt DateTime @updatedAt }`
- API:
  - `GET /api/customers?search=acme&limit=20` → `{ items: [{id,name}] }`
  - `POST /api/customers` with `{ name }` (server normalizes and upserts)
  - `GET /api/customers/:id`
- Import page: `/customers/import` (CSV file chooser + Import)

How to export from QuickBooks

- Export your customer list as CSV. Any columns are fine; we read the first non-empty of: `Display Name`, `Company`, or `Customer`.

How to import

1. Start the app and open `/customers/import`.
2. Choose your `.csv` (≤ 5 MB) and click Import.
3. The server parses, normalizes (trim + collapse spaces), de-dupes case-insensitively, and upserts.
4. A summary is shown (total / inserted / skipped / errors). The server logs the timestamp.

How to use in the calendar

- The Add/Edit Event modal replaces the Title field with a Customer combobox:
  - Type to search; suggestions come from `/api/customers`.
  - Arrow keys to move, Enter to select; Esc closes; Tab commits current text.
  - If no match, the first option is “Create ‘{text}’” which creates and selects a new customer.
  - After selection, a chip shows the chosen customer. The event `title` stores the customer name.

Migrations

- Add only the `Customer` model. To apply on servers:
  ```bash
  npm run prisma:migrate-customer # (in my-calendar-main)
  ```

Revert

- To undo the Customer table, drop the `Customer` table and the `Customer_name_key` index in your database, or roll back your migration.

## Design System

- Tokens: `src/lib/design-tokens.ts` and CSS variables in `src/styles/tokens.css`.
- Tailwind: extended in `tailwind.config.ts` with semantic colors, radii, shadows, typography, motion.
- UI primitives: `src/components/ui/` (Button, Input, Select, Card, Modal). More to come.
- Density: `src/lib/density.ts` provides a persisted comfortable/compact toggle hook.
- Usage: Prefer tokens and primitives; avoid raw hex/rgb and inline spacings.

## Reports subsystem

Server-rendered PDFs and Excel files for daily and weekly reports.

Env vars:

- `BLOB_READ_WRITE_TOKEN` (optional): if set, files are stored in Vercel Blob with public URLs. Otherwise files are written to `/tmp` and exposed via a temporary download route.
- `REPORT_TIMEZONE` (default `America/New_York`): timezone used to compute day boundaries for reports.

New Prisma models: `ReportFile`, `DailyReportSnapshot`, `WeeklyReportRequest` plus enums `ReportKind`, `WeeklyStatus`.

API routes (Node runtime):

- `POST /api/reports/daily/generate` `{ date: 'YYYY-MM-DD', vendor?: 'JORGE'|'TONY'|'CHRIS' }` → `{ pdfUrl, xlsxUrl }`
- `POST /api/reports/weekly/generate` `{ weekStart: 'YYYY-MM-DD', weekEnd: 'YYYY-MM-DD', vendor?: string }` → `{ pdfUrl }`
- `GET /api/reports/list` → `{ items: ReportFile[] }`
- `GET /api/reports/tmp/[id]` development-only streaming for /tmp fallback

Cron (Vercel):

- Daily, 05:00 America/New_York: call `POST /api/reports/daily/generate` for yesterday for each distinct vendor and for all-vendors (vendor=null).
- Weekly, Mondays 05:05 America/New_York: call `POST /api/reports/weekly/generate` for last Monday–Sunday for each vendor and all-vendors.

Notes:

- PDF: Puppeteer (`puppeteer-core`) + `@sparticuz/chromium` suitable for serverless. Letter landscape, 0.25in margins.
- Excel: `exceljs`. Sheet name is `YYYY-MM-DD`. Header frozen.
- Vendor filter propagates into queries and report headers.
- Duplicate generation within 24h returns the latest existing file.

## Drag-to-Assign (Employees → Calendar)

- Drag an employee from the Unassigned sidebar onto a day cell to open the Add Event modal prefilled with that employee.
- Drag onto an existing event to assign the employee to that event’s checklist.employees. Duplicate assignments are ignored.
- Keyboard: focus a free employee row and press Enter/Space to prefill a new event for the currently selected day.

Config (src/lib/dragAssign.ts):

- `DEFAULT_SHIFT_START_LOCAL` = `"07:00"`
- `DEFAULT_SHIFT_DURATION_MINUTES` = `480` (8h)
- `ALLOW_ALL_DAY_ON_DROP` = `true` (match current app’s day-cell behavior)

Debug tests: open `/debug/drag-assign` to see minimal unit checks for payload marshal/unmarshal and employee dedupe.
