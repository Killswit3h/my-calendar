# Tech Stack

## Application
- Next.js 15 (App Router), React, TypeScript.
- Tailwind with Material 3-inspired styling; dark mode and glassmorphism patterns.
- FullCalendar for scheduling; month-view all-day events use exclusive `end` dates. All-day events store `YYYY-MM-DD` format; preserve existing timezone handling.

## Data & backend
- Prisma 6 ORM.
- Neon Postgres (pooled and direct URLs); no schema changes unless explicitly requested.
- Next.js API routes / server actions as the primary interface; reuse existing endpoints for quantities, checklists, notes, and calendar-installed quantities.

## Documents & exports
- `pdf-lib` for PDF generation.
- CSV export for pay applications (planned), aligned to contract quantities, stockpile deductions, and change orders.

## Platform & DevOps
- Vercel + Cloudflare deployment targets.
- Environment variables live in `.env` (Neon pooled/direct URLs, etc.); do not regenerate automatically.

## UI/UX constraints
- Preserve existing dashboard shelf + content pane layout; avoid flex/grid refactors unless required.
- Apple-inspired, Material 3-styled components; no Bootstrap or legacy styling frameworks.

