# Event Quantities API & Controller Helpers Specification

| Field | Value |
|-------|-------|
| Date | 2026-02-06 |
| Feature | Event Quantities CRUD API; shared controller helpers |
| Component | API / Backend |

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Architecture](#architecture)
- [Implementation Patterns](#implementation-patterns)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Future Improvement Guidelines](#future-improvement-guidelines)

## Overview

This specification documents (1) the **Event Quantities CRUD API**, which allows listing, creating, updating, and deleting event-quantity records (linking events to project pay items with quantity and notes), and (2) the **shared controller helpers** introduced to avoid duplicated query/expand parsing across controllers. The event-quantities implementation follows the same repository–service–controller pattern used elsewhere (see [Project Pay Items API](20260206_project-pay-items-api.md)).

**Purpose**: Expose event quantities via REST for FDOT-style reporting and quantity tracking; standardize optional integer query params and `?expanded=true` handling in controllers.

**Fits into system**: Event quantities sit between `event` and `project_pay_item`; the API supports filtering by `event_id` and `project_pay_item_id` and optional relation expansion. The controller helpers are used by both Event Quantity and Project Pay Item controllers.

## Problem Statement

- **Missing API**: The `event_quantity` model existed in the Prisma schema but had no API surface; clients could not manage event quantities programmatically.
- **Duplicated controller logic**: Controllers were repeating logic for parsing optional integer query params and for building `include` when `?expanded=true`, leading to duplication and drift.
- **Inconsistent delete response**: Some DELETE handlers returned 200 with a body; REST convention for successful delete with no body is 204 No Content.

**Why the change was necessary**: The calendar needs event quantities configurable via API for reporting and integrations; controller code needed to stay DRY and consistent.

## Solution

1. **Event Quantities CRUD API**: Thin route handlers, `EventQuantityController`, `EventQuantityService`, and `EventQuantityRepository` with validation, FK existence checks, API-friendly `event_id`/`project_pay_item_id` in request bodies, and `?expanded=true` support.
2. **Shared controller helpers** in `src/server/base/controllerHelpers.ts`: `parseOptionalIntParam` (query param → `number | undefined`) and `parseExpandToInclude` (generic `?expanded=true` → `{ include }`). Both Event Quantity and Project Pay Item controllers use these helpers.
3. **DELETE returns 204**: Event quantity and project pay item DELETE handlers return `NextResponse(null, { status: 204 })` with no body.

## Architecture

### File Locations

**Event Quantities API**

```
src/app/api/event-quantities/
├── route.ts              # GET (list), POST (create)
└── [id]/route.ts         # GET, PATCH, DELETE by ID

src/server/
├── controllers/EventQuantityController.ts
├── services/EventQuantityService.ts
└── repositories/EventQuantityRepository.ts
```

**Shared helpers (used by event-quantities and project-pay-items)**

```
src/server/base/controllerHelpers.ts   # parseOptionalIntParam, parseExpandToInclude
```

**Tests**

```
tests/
├── server/controllers/EventQuantityController.test.ts
├── server/services/EventQuantityService.test.ts
├── server/repositories/EventQuantityRepository.test.ts
└── utils/mockPrismaEventQuantity.ts
```

### Component Flow (ASCII)

```
┌─────────────────────────────┐     ┌────────────────────────────────────┐     ┌─────────────────────────────────┐
│  route.ts                   │────▶│  EventQuantityController           │────▶│  EventQuantityService            │
│  GET /api/event-quantities  │     │  handleGet / handlePost / etc.     │     │  listWithExpand / create / etc.  │
│  POST /api/event-quantities │     │  parseExpand (via helper)          │     │  validate, beforeCreate, etc.    │
└─────────────────────────────┘     │  parseOptionalIntParam (helper)    │     │  FK validation, normalize IDs   │
                                    └────────────────────────────────────┘     └───────────────┬─────────────────┘
                                                                                              │
                                                                                              ▼
                                                                             ┌─────────────────────────────────┐
                                                                             │  EventQuantityRepository         │
                                                                             │  findMany / findUnique / create  │
                                                                             │  findByEventId / findByProjectPayItemId │
                                                                             └─────────────────────────────────┘
```

### Prisma Model

```prisma
model event_quantity {
  id                  Int       @id @default(autoincrement())
  event_id            Int       @map("event_id")
  project_pay_item_id Int       @map("project_pay_item_id")
  quantity            Decimal   @db.Decimal(10, 2)
  notes               String?   @db.Text

  event           event            @relation(fields: [event_id], references: [id])
  project_pay_item project_pay_item @relation(fields: [project_pay_item_id], references: [id])

  @@map("event_quantity")
}
```

## Implementation Patterns

### 1. Shared controller helpers

| Aspect | Detail |
|--------|--------|
| **Concept** | Centralize parsing of optional integer query params and `?expanded=true` so controllers stay thin and consistent. |
| **Implementation** | `src/server/base/controllerHelpers.ts` exports: |
| | **`parseOptionalIntParam(value)`** — Accepts `string \| string[] \| undefined` (e.g. from `queryParams.event_id`). Returns `number \| undefined`; returns `undefined` if missing, empty, or invalid. Uses `parseInt` and checks `Number.isInteger(n) && !isNaN(n)`. |
| | **`parseExpandToInclude<T>(expanded, includeShape)`** — Generic. If `expanded` is the string `"true"` (or first element of array), returns `{ include: includeShape }`; otherwise `{}`. Controllers pass their Prisma `Include` shape (e.g. `{ event: true, project_pay_item: true }`). |
| **When to use** | Any controller that supports optional integer query filters or `?expanded=true`; use these helpers instead of inlining parse logic. |
| **Example** | See `EventQuantityController` and `ProjectPayItemController`: they call `parseOptionalIntParam(queryParams.event_id)` and `parseExpandToInclude(expanded, { event: true, project_pay_item: true })`. |

### 2. API-friendly foreign keys in request body

| Aspect | Detail |
|--------|--------|
| **Concept** | Accept simple `event_id` and `project_pay_item_id` in POST/PATCH bodies; normalize to Prisma relation format in the service and strip raw `*_id` before Prisma create/update. |
| **Implementation** | Controller parses body as `Prisma.event_quantityCreateInput & { event_id?: number; project_pay_item_id?: number }`. Service uses helpers (`getEventIdFromData`, `getProjectPayItemIdFromData`) to read either raw `*_id` or `event: { connect: { id } }` style, validates FKs exist, then in `beforeCreate`/`beforeUpdate` builds `event: { connect: { id } }` and `project_pay_item: { connect: { id } }` and removes `event_id`/`project_pay_item_id` from the payload passed to Prisma. |
| **When to use** | Any entity whose API accepts simple FK IDs in the body; keep normalization and FK checks in the service layer. |

### 3. listWithExpand in service

| Aspect | Detail |
|--------|--------|
| **Concept** | Support optional relation inclusion for list/get by accepting `expandOptions` and passing `include` to the repository when present. |
| **Implementation** | Service exposes `listWithExpand(filters, expandOptions?, pagination?, client?)`. If `expandOptions?.include` is set, call `repository.findMany(filters, expandOptions, client)`; otherwise delegate to `list(filters, pagination, client)`. Controller builds `expandOptions` via `parseExpandToInclude` and passes it to `getById`/`listWithExpand`/`create`/`update` as appropriate. |
| **When to use** | Any CRUD resource that supports `?expanded=true` to include relations in the response. |

### 4. DELETE returns 204 No Content

| Aspect | Detail |
|--------|--------|
| **Concept** | Successful DELETE with no response body should return 204 per REST convention. |
| **Implementation** | In the controller’s `handleDelete`, after `await this.service.delete(id)`, return `new NextResponse(null, { status: 204 })` instead of `successResponse({ message: "..." }, 200)`. Abstract controller tests accept either 200 or 204 for delete so existing tests remain valid. |
| **When to use** | All resource DELETE handlers that do not return a body. |

## API Reference

### Event quantities

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/event-quantities` | List all. Optional query: `event_id`, `project_pay_item_id` (integer filters), `expanded=true` (include `event`, `project_pay_item`). |
| GET | `/api/event-quantities/[id]` | Get one by ID. Optional: `expanded=true`. |
| POST | `/api/event-quantities` | Create. Body: `event_id`, `project_pay_item_id` (required), `quantity` (required, non-negative number/string/Decimal), `notes` (optional string). Optional: `?expanded=true`. |
| PATCH | `/api/event-quantities/[id]` | Update by ID. Body: same fields as create, all optional. Optional: `?expanded=true`. |
| DELETE | `/api/event-quantities/[id]` | Delete by ID. Returns **204 No Content** with no body. |

**Validation**: `event_id` and `project_pay_item_id` must be positive integers and must reference existing records. `quantity` must be non-negative and finite. `notes` must be a string if present (trimmed). Service normalizes `event_id`/`project_pay_item_id` to Prisma relations and validates FK existence before create/update.

**Errors**: 400 validation, 404 not found, 409 conflict (repository), 500 internal. Responses use `AbstractController.errorResponse` shape.

## Testing

- **Controller**: `EventQuantityController.test.ts` uses `createAbstractControllerTests`. Delete response is 204; tests use typed mocks (no `any`). Mock Prisma is extended via `mockPrismaEventQuantity`.
- **Service**: `EventQuantityService.test.ts` uses `createAbstractServiceTests`; covers validation, FK checks, and normalization.
- **Repository**: `EventQuantityRepository.test.ts` uses `createAbstractRepositoryTests`; `mockPrismaEventQuantity` provides typed delegate (e.g. `create(args: Prisma.event_quantityCreateArgs)`).
- **Mock**: `tests/utils/mockPrismaEventQuantity.ts` extends `MockPrisma` with `event_quantity` delegate; Prisma model name is `"event_quantity"` (snake_case).

## Future Improvement Guidelines

- When adding new CRUD controllers with optional integer query params or `?expanded=true`, reuse `parseOptionalIntParam` and `parseExpandToInclude` from `controllerHelpers.ts`.
- Any new resource that supports DELETE with no body should return 204; keep abstract controller tests aligned (200/204 acceptable for delete if needed during migration).
- Event quantity validation and normalization patterns (decimal quantity, notes trim, FK normalization) can be reused for other decimal/FK-heavy entities; keep validation in the service and use Prisma types throughout.
