---
name: New Database Setup with Docker & Prisma
overview: Set up a new PostgreSQL database container (port 5433) alongside the existing one, initialize it with the new schema (gfcHubDB.sql), then use Prisma to introspect and generate TypeScript models for type-safe database access.
todos:
  - id: fix-sql-typo
    content: "Fix typo in gfcHubDB.sql line 63: varchat → varchar"
    status: completed
  - id: create-folders
    content: Create sql/init/ directory structure and move SQL file
    status: completed
  - id: update-docker-compose
    content: Add db-v2 service to docker-compose.yml with port 5433
    status: completed
  - id: start-new-db
    content: Start db-v2 container and verify SQL initialization
    status: completed
  - id: update-env
    content: Update .env with new DATABASE_URL pointing to port 5433
    status: completed
  - id: backup-schema
    content: Backup existing prisma/schema.prisma before introspection
    status: completed
  - id: introspect-db
    content: Run prisma db pull to generate new schema from database
    status: completed
  - id: review-schema
    content: Review generated schema.prisma and adjust as needed
    status: completed
  - id: generate-client
    content: Run prisma generate to create TypeScript types
    status: completed
  - id: init-migrations
    content: Run prisma migrate dev to create baseline migration
    status: completed
  - id: test-connection
    content: Test connection with Prisma Studio
    status: completed
---

# New Database Setup with Docker & Prisma

## Overview

Create a parallel database setup allowing you to develop against the new schema while keeping production data accessible in the old database.

## Architecture

```mermaid
flowchart TB
    subgraph docker [Docker Environment]
        oldDB[Old DB Container<br/>Port 5432<br/>Current Schema]
        newDB[New DB Container<br/>Port 5433<br/>New Schema]
    end
    
    subgraph app [Application]
        prismaOld[Prisma Client - Old Schema<br/>PORT 5432]
        prismaNew[Prisma Client - New Schema<br/>PORT 5433]
    end
    
    subgraph files [File Structure]
        sqlFiles[sql/<br/>gfcHubDB.sql<br/>future-migrations.sql]
        prismaFolder[prisma/<br/>schema.prisma<br/>migrations/]
    end
    
    sqlFiles -->|Initialize| newDB
    newDB -->|Introspect| prismaFolder
    prismaFolder -->|Generate| prismaNew
    
    oldDB -.->|Keep for reference| prismaOld
```

## Folder Structure

```
my-calendar/
├── sql/                          # NEW - Raw SQL files
│   ├── init/
│   │   └── gfcHubDB.sql         # Initial schema (move from root)
│   └── archive/                  # Optional: old SQL dumps
│       └── old-schema-backup.sql
│
├── prisma/
│   ├── schema.prisma            # Will be REGENERATED from SQL
│   ├── migrations/              # Future Prisma migrations
│   │   └── (Prisma will manage this)
│   └── seeds/                   # Keep existing seed files
│
├── docker-compose.yml           # Update with new db-v2 service
└── .env                         # Update DATABASE_URL for new DB
```

## Critical Issue Found

**Bug in gfcHubDB.sql line 63:** `"end_station" varchat` should be `varchar`

## Implementation Steps

### Step 1: Fix SQL Typo

**File:** [sql/init/gfcHubDB.sql](sql/init/gfcHubDB.sql)

Line 63 has typo: `"end_station" varchat` → should be `varchar`

### Step 2: Create Folder Structure

Create `sql/init/` directory and move SQL file:
```bash
mkdir -p sql/init
mv gfcHubDB.sql sql/init/gfcHubDB.sql
```

### Step 3: Update Docker Compose

**File:** [docker-compose.yml](docker-compose.yml)

Add new database service alongside existing one:

```yaml
version: '3.9'
services:
  db:
    # OLD database - keep running
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  db-v2:
    # NEW database with new schema
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gfchub_v2
    ports:
      - "5433:5432"  # Different host port
    volumes:
      - pgdata-v2:/var/lib/postgresql/data
      - ./sql/init:/docker-entrypoint-initdb.d:ro  # Auto-run SQL on first start

volumes:
  pgdata:    # Old database volume
  pgdata-v2: # New database volume
```

**Key points:**
- Old DB stays on port 5432
- New DB runs on port 5433
- SQL file auto-executes on first container start via `/docker-entrypoint-initdb.d`

### Step 4: Start New Database

```bash
# Start the new database container
docker compose up -d db-v2

# Verify it's running
docker compose ps

# Check logs to confirm SQL executed
docker compose logs db-v2

# Expected output: CREATE TABLE statements, no errors
```

### Step 5: Update Environment Variables

**File:** `.env`

Add new connection string for v2 database:

```bash
# Old database (keep for reference)
DATABASE_URL_OLD="postgresql://user:password@localhost:5432/db?schema=public"
DIRECT_URL_OLD="postgresql://user:password@localhost:5432/db?schema=public"

# New database (active development)
DATABASE_URL="postgresql://user:password@localhost:5433/gfchub_v2?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5433/gfchub_v2?schema=public"
```

### Step 6: Backup Old Prisma Schema

Before regenerating, save the old schema for reference:

```bash
cp prisma/schema.prisma prisma/schema.old.prisma
mkdir -p sql/archive
```

### Step 7: Introspect New Database

Use Prisma to read the SQL schema and generate `schema.prisma`:

```bash
# Pull schema from new database
npx prisma db pull

# This will overwrite prisma/schema.prisma with new models
```

**Expected output:**
- `prisma/schema.prisma` updated with: `employee`, `payment_type`, `scope_of_work`, `pay_item`, `customer`, `project`, `project_pay_item`, `event`, `event_assignment`, `event_quantity`, `invoice`
- All foreign keys and indexes preserved

### Step 8: Review Generated Schema

**File:** [prisma/schema.prisma](prisma/schema.prisma)

Check for:
- Correct data types (especially `decimal` fields)
- Foreign key relationships match your SQL
- Index definitions
- Unique constraints

**Common adjustments needed:**
```prisma
// Prisma may infer Int, but you want String IDs
model employee {
  id Int @id  // May need to change to String or add @default(autoincrement())
}

// Add default values that SQL has
model project {
  status String @default("ACTIVE")
  created_at DateTime @default(now())
}
```

### Step 9: Generate Prisma Client

```bash
# Generate TypeScript types and client
npx prisma generate

# This creates types in node_modules/.prisma/client
```

### Step 10: Initialize Prisma Migrations

Create initial migration from introspected schema:

```bash
# Create baseline migration
npx prisma migrate dev --name init_gfchub_v2

# This creates: prisma/migrations/TIMESTAMP_init_gfchub_v2/
```

**Important:** This migration will match your existing database state.

### Step 11: Test Database Connection

Create a quick test script or use Prisma Studio:

```bash
# Open Prisma Studio to browse data
npx prisma studio

# Should connect to localhost:5433
```

### Step 12: Update Application Code

**Gradually migrate** API routes to use new schema:

```typescript
// Before (old schema)
import { prisma } from '@/lib/prisma'
const events = await prisma.event.findMany()  // Old Event model

// After (new schema)
const events = await prisma.event.findMany({
  include: {
    project: true,
    event_assignment: {
      include: { employee: true }
    }
  }
})
```

## Future Workflow (After Setup)

### Making Schema Changes

**Use Prisma Migrate (not raw SQL):**

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_employee_position

# 3. Prisma generates SQL and applies it
# 4. TypeScript types auto-update
```

### If You Need Raw SQL

For complex migrations:

```bash
# 1. Create empty migration
npx prisma migrate dev --create-only --name custom_migration

# 2. Edit the generated .sql file in prisma/migrations/
# 3. Apply it
npx prisma migrate dev
```

## Testing Strategy

1. **Dual databases running** - switch between them by changing `.env`
2. **Test new schema** thoroughly before migrating production
3. **Data migration script** (future) to copy old → new if needed

## Rollback Plan

If issues arise:

```bash
# Stop new database
docker compose stop db-v2

# Revert .env to old DATABASE_URL
# Restore old schema.prisma
cp prisma/schema.old.prisma prisma/schema.prisma

# Regenerate old client
npx prisma generate
```

## Notes

- Old database remains untouched on port 5432
- New database is isolated on port 5433
- Can develop/test against new schema without risk
- Production database unaffected until you're ready to migrate
- Keep `sql/init/gfcHubDB.sql` as documentation of initial structure

## Verification Checklist

After completion:

- [x] `db-v2` container running on port 5433
- [x] Can connect: `psql -h localhost -p 5433 -U user -d gfchub_v2`
- [x] All 11 tables created in new database
- [x] `prisma/schema.prisma` has all new models
- [x] `npx prisma generate` completes successfully
- [x] Prisma Studio shows new schema
- [x] No TypeScript errors in IDE

