# db-v2-1 Setup Instructions

This file captures the steps to stand up the new PostgreSQL database `db-v2-1` (port 5433) and load the `gfcHubDB.sql` schema that lives under `sql/init`.

## 1. Pre-reqs
- Install Docker Desktop and make sure it is running (`docker --version`).
- Install PostgreSQL CLI tools (`psql`, `pg_dump`, `pg_restore`) via Homebrew and add `/opt/homebrew/opt/libpq/bin` to your `$PATH` (or `/usr/local/opt/libpq/bin` on Intel).

## 2. Ensure SQL files are in place
```bash
mkdir -p sql/init
# copy gfcHubDB.sql into sql/init/ (exists already from spec)
```

## 3. Update docker-compose
Add a `db-v2-1` service that mirrors the `db-v2` setup:
```yaml
  db-v2-1:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gfchub_v2_1
    ports:
      - "5433:5432"
    volumes:
      - pgdata-v2-1:/var/lib/postgresql/data
      - ./sql/init:/docker-entrypoint-initdb.d:ro
```
Keep an associated volume `pgdata-v2-1`. The SQL file in `./sql/init` runs automatically the first time the container starts.

## 4. Set `.env` to point at the new DB
```bash
DATABASE_URL="postgresql://user:password@localhost:5433/gfchub_v2_1?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5433/gfchub_v2_1?schema=public"
```
You can keep `DATABASE_URL_OLD`/`DIRECT_URL_OLD` pointing at the 5432 service for reference.

## 5. Start the container and verify
```bash
docker compose up -d db-v2-1
docker compose ps
docker compose logs db-v2-1
```
Look for the `CREATE TABLE` statements from `gfcHubDB.sql`.

## 6. Apply Prisma tooling
```bash
cp prisma/schema.prisma prisma/schema.old.prisma
npx prisma db pull --url "postgresql://user:password@localhost:5433/gfchub_v2_1?schema=public"
npx prisma generate
npx prisma migrate dev --name init_gfchub_v2_1
npx prisma studio
```
The `db pull` command regenerates `prisma/schema.prisma` with the new models described by the spec (employees, projects, events, etc.). `migrate dev` records the schema state.

## 7. Daily workflow
- Use `docker compose start db-v2-1`/`docker compose stop db-v2-1` to manage the container.
- Use `.env` to switch between the new and legacy databases: change `DATABASE_URL`/`DIRECT_URL` as needed.
- After schema changes, repeat `npx prisma migrate dev --name <desc>` and `npx prisma generate`.

## 8. Troubleshooting quick commands
- Check container status/logs: `docker compose ps`, `docker compose logs db-v2-1`, `docker compose logs -f db-v2-1`
- Re-run SQL manually: `docker compose exec -T db-v2-1 psql -U user -d gfchub_v2_1 < sql/init/gfcHubDB.sql`
- Clean restart: `docker compose down -v db-v2-1` (drops data) or `docker compose restart db-v2-1`

Save this file near the repo root for future reference when you want to spin up `db-v2-1`. EOF