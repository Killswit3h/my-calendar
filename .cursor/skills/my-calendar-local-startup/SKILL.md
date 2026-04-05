---
name: my-calendar-local-startup
description: Starts the my-calendar Next.js app locally with Docker Postgres, Prisma, and npm dev server. Use when onboarding, running the app for the first time, fixing local DB connection, or when the user asks how to start the project, docker compose, or local development setup.
---

# my-calendar — local startup

## Prerequisites

- **Node.js**: Current LTS recommended (no `engines` field in root `package.json`).
- **Docker Desktop** (or compatible engine): only needed if you run Postgres via Compose.
- **npm**: `npm install` at repo root.

## 1) Environment file

- Copy `.env.example` to `.env` if you do not already have `.env`.
- Set **`DATABASE_URL`** and **`DIRECT_URL`** to a Postgres URL Prisma can reach.

### If you use the repo’s Docker Postgres (`docker-compose.yml`)

The compose file defines:

- User: `user`
- Password: `password`
- Database: `db`
- Port: `5432` on the host

Use **both** variables with that database (same URL is fine for local Postgres):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/db"
DIRECT_URL="postgresql://user:password@localhost:5432/db"
```

**Note:** `.env.example` shows `my_calendar` / `username:password`; that does **not** match the default `docker-compose.yml` credentials. Either align `.env` to compose as above, or change compose/env together intentionally.

### Optional env (feature-specific)

- **S3 / Vercel Blob / Web Push**: see `.env.example` — not required for basic calendar/API dev.
- **`PRISMA_ACCELERATE_URL`**: relevant for edge/accelerate flows; local `next dev` typically uses `DATABASE_URL` / `DIRECT_URL`.

## 2) Start Postgres (Docker)

From the repository root:

```bash
docker compose up -d db
```

Check status:

```bash
docker compose ps
```

Stop (when done):

```bash
docker compose stop db
```

## 3) Install dependencies

```bash
npm install
```

Root `postinstall` runs Prisma `generate` (and may reference a `my-calendar-main` prefix in scripts). If install fails on that step, treat it as an environment/path issue: the **root** `prisma/schema.prisma` is the source of truth for this app.

## 4) Apply database schema

Prefer migrations when they exist in `prisma/migrations/`:

```bash
npx prisma migrate dev
```

For a throwaway local DB only, `npx prisma db push` is acceptable (see `README.md` quickstart).

Optional: open Prisma Studio:

```bash
npx prisma studio
```

## 5) Run the Next.js dev server

```bash
npm run dev
```

Default dev URL is printed by Next (typically `http://localhost:3000`).

## 6) Useful routes (from `README.md`)

- `/` — demo calendar (no DB required for basic view).
- `/calendar/<CALENDAR_ID>` — DB-backed calendar (needs a calendar row and valid `DATABASE_URL`).

## 7) Production / hosted DB

If using Neon or another hosted Postgres, set `DATABASE_URL` and `DIRECT_URL` per the provider (pooled vs direct URLs as they document). Docker Compose is then optional.

## Quick reference

| Step              | Command                          |
|-------------------|----------------------------------|
| DB up             | `docker compose up -d db`        |
| Deps              | `npm install`                    |
| Schema            | `npx prisma migrate dev`         |
| App               | `npm run dev`                    |
| Prod-style server | `npm run build` then `npm start` |

## Related docs

- Repo quickstart: `README.md` (Quickstart section).
- Speculative / alternate DB layout notes: `docs/specs/database-v2-setup.md` (may not match current `docker-compose.yml`).
