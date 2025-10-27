# Finance Labor Cost Dashboard

The Finance → Labor Cost feature aggregates scheduled events, employee assignments, and hourly rates into a per-job, per-day cost view. Data is stored in the `LaborDaily` table and exposed via REST endpoints and dashboards.

## Prerequisites

1. **Environment variables**

   ```
   FINANCE_LABOR_ENABLED=true
   LABOR_DEFAULT_DAY_HOURS=8
   LABOR_OVERTIME_THRESHOLD=8
   LABOR_OT_MULTIPLIER=1.5
   ```

   Hours defaults to `LABOR_DEFAULT_DAY_HOURS` unless an assignment override is provided. When both `LABOR_OVERTIME_THRESHOLD` and `LABOR_OT_MULTIPLIER` are set, hours over the threshold use the overtime multiplier.

2. **Database migration & seed**

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

   The seed script inserts demo calendars, employees with rate history, multi-day events, and assignments.

3. **Refresh daily data**

   Run the builder to (re)populate `LaborDaily` for a range:

   ```bash
   npx tsx scripts/build-labor-daily.ts --start 2024-10-01 --end 2024-10-31
   ```

   (A cron job can call the `buildLaborDaily` helper nightly.)

## Data model

| Table | Description |
| --- | --- |
| `EventAssignment` | Links events to employees. Optional `dayOverride` + `hours` allow per-day adjustments. |
| `HourlyRate` | Historical hourly rates per employee. Latest effective rate ≤ day is used; `Employee.hourlyRate` is the fallback. |
| `LaborDaily` | Denormalized per-event-day row (`jobId`, `employeeId`, `hours`, `regularCost`, `overtimeCost`, totals, etc.). A materialized view `labor_daily_v` exposes the minimal projection. |

Assignments and rates use ET (America/New_York). Multi-day events are exploded into ET days via `splitEventIntoETDays`, accounting for DST.

## REST API

All endpoints are idempotent and require `FINANCE_LABOR_ENABLED=true`.

### `GET /api/finance/labor/summary?start=YYYY-MM-DD&end=YYYY-MM-DD`

Aggregates totals by job. The builder runs for the requested range before returning results.

```json
{
  "range": { "start": "2024-10-01", "end": "2024-10-31" },
  "generated": {
    "rowsInserted": 96,
    "missingRates": [{ "employeeId": "e3", "day": "2024-10-16" }]
  },
  "totals": {
    "jobs": 4,
    "hours": 192,
    "cost": 5472,
    "employees": 12,
    "days": 22,
    "averageRate": 28.5
  },
  "summary": [
    {
      "jobId": "JOB-001",
      "jobName": "I-95 Temp Fence",
      "days": 6,
      "employees": 3,
      "employeeIds": ["adrian-ramos", "ventura-hernandez", "ramiro-valle"],
      "employeeNames": {
        "adrian-ramos": "Adrian Ramos",
        "ventura-hernandez": "Ventura Hernandez",
        "ramiro-valle": "Ramiro Valle"
      },
      "hours": 96,
      "cost": 2736,
      "averageRate": 28.5
    }
  ]
}
```

### `GET /api/finance/labor/job/:jobId?start=YYYY-MM-DD&end=YYYY-MM-DD`

Returns per-day rows and crew breakdown for the specified job.

```json
{
  "job": { "id": "JOB-001", "name": "I-95 Temp Fence" },
  "totals": {
    "days": 6,
    "employees": 3,
    "hours": 96,
    "cost": 2736,
    "averageRate": 28.5
  },
  "days": [
    {
      "day": "2024-10-16",
      "hours": 32,
      "cost": 928,
      "employees": [
        {
          "employeeId": "adrian-ramos",
          "employeeName": "Adrian Ramos",
          "hours": 10,
          "regularHours": 8,
          "overtimeHours": 2,
          "rate": 26,
          "regularCost": 208,
          "overtimeCost": 78,
          "totalCost": 286,
          "eventId": "evt-101",
          "eventTitle": "I-95 Night Shift",
          "note": "Overtime assist"
        }
      ]
    }
  ]
}
```

### `POST /api/finance/assignments`

Upserts an event assignment row.

Request body:

```json
{
  "eventId": "evt-101",
  "employeeId": "adrian-ramos",
  "dateOverride": "2024-10-16",
  "hours": 10,
  "note": "Overtime assist"
}
```

Response:

```json
{
  "assignment": {
    "id": "evt-101-adrian-ramos-2024-10-16",
    "eventId": "evt-101",
    "employeeId": "adrian-ramos",
    "dateOverride": "2024-10-16",
    "hours": 10,
    "note": "Overtime assist"
  }
}
```

## UI

* `/finance` &mdash; Summary dashboard with filters for date range, job, and crew. Displays metrics, table, and warnings for missing rates.
* `/finance/job/:jobId` &mdash; Drill-in view with per-day breakdown, overtime markers, and CSV export.

Both routes return 404 when `FINANCE_LABOR_ENABLED` is false.

## Development flow

1. `npx prisma migrate deploy`
2. `npx prisma db seed`
3. (Optional) import historical events/assignments from `prod-events.json` or another export:
   ```bash
   npx tsx scripts/import-prod-events.ts --file prod-events.json
   ```
   - Provide `--calendar-map=prod-calendars.json` to map hashed calendar ids to friendly names.
   - Review any warnings for descriptions that could not be matched to employees and adjust those events manually.
4. `npm run dev`
5. Navigate to `/finance` to explore the dashboard. Use the filters to regenerate data and open job detail pages to export CSVs. Rebuild the `labor_daily` table as needed via `npx tsx scripts/build-labor-daily.ts --start YYYY-MM-DD --end YYYY-MM-DD`.

Tests covering ET splitting and the builder live under `tests/time` and `tests/finance`.
