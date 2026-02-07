# Project Pay Items API Specification

| Field | Value |
|-------|-------|
| Date | 2026-02-06 |
| Feature | Project Pay Items CRUD |
| Component | API / Backend |

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Architecture](#architecture)
- [Implementation Patterns](#implementation-patterns)
- [API Reference](#api-reference)
- [Future Improvement Guidelines](#future-improvement-guidelines)

## Overview

This specification documents the Project Pay Items CRUD API, which enables programmatic management of project-pay-item records. Each record links a project to a pay item with quantity and unit rate, supporting FDOT-style reporting and contract tracking. The implementation follows the repository-service-controller pattern used across the codebase and extends `AbstractRepository`, `AbstractService`, and `AbstractController`.

**Purpose**: Allow API consumers to list, create, update, and delete project pay items with validation of foreign keys (project, pay_item), decimal fields (contracted_quantity, unit_rate, stockpile_billed), and optional expand for relations.

**Fits into system**: Sits alongside other CRUD APIs (projects, pay-items, invoices, etc.). The `project_pay_item` model bridges `project` and `pay_item` and feeds into `event_quantity` for quantity tracking.

## Problem Statement

Before this implementation:

- **Missing API**: No REST endpoints existed for project pay items. The `project_pay_item` model existed in the Prisma schema but had no API surface.
- **Inconsistent patterns**: Other entities (projects, pay-items, customers) already used the abstract stack; project pay items were not exposed.
- **No programmatic access**: Clients could not create or manage project-pay-item records via the API for quantity/rate configuration.

**Why the change was necessary**: The calendar system needs project pay items to be configurable via API for contract setup, reporting, and integration workflows.

## Solution

The solution implements a full CRUD API following existing patterns:

1. **Thin route handlers** in `src/app/api/project-pay-items/` that delegate to the controller
2. **ProjectPayItemController** with typed `handleGet`, `handlePost`, `handlePatch`, `handleDelete` and support for `?project_id=`, `?pay_item_id=` filters and `?expanded=true`
3. **ProjectPayItemService** with validation, FK existence checks, and API-friendly `project_id`/`pay_item_id` normalization
4. **ProjectPayItemRepository** extending `AbstractRepository` with `findByProjectId` and `findByPayItemId` helpers

**Design decisions**:
- Accept raw `project_id` and `pay_item_id` in request bodies (API-friendly) and normalize to Prisma relation format in the service
- Use typed helpers (`getProjectIdFromData`, `getPayItemIdFromData`, etc.) instead of `any` casts for type adherence
- Support `?expanded=true` to include `project` and `pay_item` relations in responses
- Validate that project and pay_item exist before create/update

## Architecture

### File Locations

```
src/app/api/project-pay-items/
├── route.ts              # GET (list), POST (create)
└── [id]/route.ts         # GET, PATCH, DELETE by ID

src/server/
├── controllers/ProjectPayItemController.ts
├── services/ProjectPayItemService.ts
└── repositories/ProjectPayItemRepository.ts

tests/
├── server/controllers/ProjectPayItemController.test.ts
├── server/services/ProjectPayItemService.test.ts
├── server/repositories/ProjectPayItemRepository.test.ts
└── utils/mockPrismaProjectPayItem.ts

docs/postman/project-pay-items.postman_collection.json
```

### Component Flow (ASCII)

```
┌─────────────────────────────┐     ┌────────────────────────────────────┐     ┌─────────────────────────────────┐
│  route.ts                   │────▶│  ProjectPayItemController          │────▶│  ProjectPayItemService           │
│  GET /api/project-pay-items │     │  handleGet / handlePost / etc.     │     │  listWithExpand / create / etc.  │
│  POST /api/project-pay-items│     │  parseExpand, parseQueryParams     │     │  validate, beforeCreate, etc.    │
└─────────────────────────────┘     └────────────────────────────────────┘     └───────────────┬─────────────────┘
                                                                                               │
                                                                                               ▼
                                                                              ┌─────────────────────────────────┐
                                                                              │  ProjectPayItemRepository        │
                                                                              │  findMany / findUnique / create  │
                                                                              │  findByProjectId / findByPayItemId│
                                                                              └─────────────────────────────────┘
```

### Prisma Model

```prisma
model project_pay_item {
  id                  Int       @id @default(autoincrement())
  project_id          Int       @map("project_id")
  pay_item_id         Int       @map("pay_item_id")
  contracted_quantity Decimal   @db.Decimal(10, 2) @map("contracted_quantity")
  unit_rate           Decimal   @db.Decimal(10, 2) @map("unit_rate")
  is_original         Boolean   @default(true) @map("is_original")
  stockpile_billed    Decimal   @default(0) @db.Decimal(10, 2) @map("stockpile_billed")
  notes               String?   @db.Text
  begin_station       String?   @db.VarChar @map("begin_station")
  end_station         String?   @db.VarChar @map("end_station")
  status              String?   @db.VarChar
  locate_ticket       String?   @db.VarChar @map("locate_ticket")
  LF_RT               String?   @db.VarChar @map("LF_RT")
  onsite_review       String?   @db.VarChar @map("onsite_review")

  project        project         @relation(fields: [project_id], references: [id])
  pay_item       pay_item        @relation(fields: [pay_item_id], references: [id])
  event_quantities event_quantity[]

  @@map("project_pay_item")
}
```

## Implementation Patterns

### Pattern: API-Friendly Foreign Keys

**Concept**: Accept raw `project_id` and `pay_item_id` in request bodies instead of requiring Prisma relation format (`project: { connect: { id: 1 } }`). The service normalizes to relations and strips raw IDs before Prisma.

**Implementation**:

Controller accepts body with optional `project_id` / `pay_item_id`:

```typescript
// ProjectPayItemController.ts, lines 110, 139
const body = await this.parseBody<Prisma.project_pay_itemCreateInput & { project_id?: number; pay_item_id?: number }>(req)
```

Service uses typed helpers to read IDs and normalize:

```typescript
// ProjectPayItemService.ts, lines 218-285
private getProjectIdFromData(data): number | undefined {
  const withIds = data as Record<string, unknown>
  if (typeof withIds.project_id === "number") return withIds.project_id
  if (data.project?.connect?.id !== undefined) return data.project.connect.id
  return undefined
}
```

**When to use**: Any entity with FK relations where API consumers prefer sending `{ project_id: 1 }` over `{ project: { connect: { id: 1 } } }`.

**Benefits**: Simpler API surface; clearer error messages.

**Caveats**: Must strip raw `*_id` from processed data before Prisma create/update.

---

### Pattern: Service listWithExpand for Expandable Queries

**Concept**: When controllers need optional relation expansion, expose a service method that delegates to `repository.findMany` with `include` when expand is requested, otherwise to `list()`.

**Implementation**:

```typescript
// ProjectPayItemService.ts, lines 34-44
async listWithExpand(
  filters?: Prisma.project_pay_itemWhereInput,
  expandOptions?: { include?: Prisma.project_pay_itemInclude },
  pagination?: PaginationOptions,
  client?: PrismaClient | Prisma.TransactionClient
): Promise<Prisma.project_pay_itemGetPayload<{}>[]> {
  if (expandOptions?.include) {
    return this.repository.findMany(filters, expandOptions, client)
  }
  return this.list(filters, pagination, client)
}
```

Controller calls `listWithExpand` instead of accessing `(service as any).repository`:

```typescript
// ProjectPayItemController.ts, line 91
const projectPayItems = await this.service.listWithExpand(filters, expandOptions)
```

**When to use**: Any list endpoint that supports `?expanded=true` or similar.

**Benefits**: Type-safe; no controller access to repository; single source of truth for expand behavior.

---

### Pattern: Shared beforeCreate / beforeUpdate Helpers

**Concept**: Extract validation, normalization, and defaults into small private helpers. Use them in both `beforeCreate` and `beforeUpdate` to avoid duplication.

**Implementation**:

```typescript
// ProjectPayItemService.ts, lines 377-414
protected async beforeCreate(data): Promise<Prisma.project_pay_itemCreateInput> {
  const processed = { ...data }
  const { projectId, payItemId } = this.extractForeignKeyIds(data)
  await this.validateForeignKeys(projectId, payItemId)
  this.normalizeRelationsAndStripIds(data, processed)
  this.setCreateDefaults(processed)
  this.trimStringFields(processed, false)
  this.normalizeDecimalFields(processed, false)
  return processed
}
```

Helpers: `extractForeignKeyIds`, `validateForeignKeys`, `normalizeRelationsAndStripIds`, `trimStringFields`, `normalizeDecimalFields`, `setCreateDefaults`.

**When to use**: Entities with similar create/update flows (FK validation, string trimming, decimal normalization).

**Benefits**: DRY; easier to maintain; consistent behavior.

---

### Pattern: Typed Filters in Controller

**Concept**: Use Prisma types for filter objects instead of `any`. Build filters incrementally from query params.

**Implementation**:

```typescript
// ProjectPayItemController.ts, lines 76-88
const filters: Prisma.project_pay_itemWhereInput = {}
if (projectIdFilter && typeof projectIdFilter === "string") {
  const projectId = parseInt(projectIdFilter, 10)
  if (!isNaN(projectId)) filters.project_id = projectId
}
if (payItemIdFilter && typeof payItemIdFilter === "string") {
  const payItemId = parseInt(payItemIdFilter, 10)
  if (!isNaN(payItemId)) filters.pay_item_id = payItemId
}
```

**When to use**: All list endpoints with query-param filters.

**Benefits**: Type safety; clear intent; no `any` casts.

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/project-pay-items` | List all; optional `?project_id=`, `?pay_item_id=`, `?expanded=true` |
| GET | `/api/project-pay-items/:id` | Get by ID; optional `?expanded=true` |
| POST | `/api/project-pay-items` | Create; body: `project_id`, `pay_item_id`, `contracted_quantity`, `unit_rate`, optional fields |
| PATCH | `/api/project-pay-items/:id` | Update by ID |
| DELETE | `/api/project-pay-items/:id` | Delete by ID |

**Required on create**: `project_id`, `pay_item_id`, `contracted_quantity`, `unit_rate` (all validated; FKs must reference existing records).

**Optional**: `stockpile_billed` (default 0), `is_original` (default true), `notes`, `begin_station`, `end_station`, `status`, `locate_ticket`, `LF_RT`, `onsite_review`.

**Errors**: 400 (validation), 404 (not found), 409 (conflict), 500 (internal).

## Future Improvement Guidelines

1. **Use repository helpers in controller**: `findByProjectId` and `findByPayItemId` exist but are unused. When filtering by a single FK, consider calling `service.listByProjectId(id)` or `service.listByPayItemId(id)` for consistency.

2. **Postman collection**: `docs/postman/project-pay-items.postman_collection.json` documents endpoints. Keep it updated when the API changes.

3. **Test typing**: Test files use `as any` in factories. Consider typed factories where feasible; document any intentional `any` in abstract test configs.

4. **Related specs**: See `.cursor/specs/projectEndpoint.md` and `.cursor/specs/abstractEntityArchitecture.md` for project and architecture patterns.
