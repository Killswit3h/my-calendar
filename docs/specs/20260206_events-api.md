# Events API Specification

| Field | Value |
|-------|-------|
| Date | 2026-02-06 |
| Feature | Events CRUD API |
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

This specification documents the **Events CRUD API** (`/api/events`), which allows listing, creating, updating, and deleting calendar event records. Each event links a project, scope of work, and payment type (with optional invoice) and has start/end times, day-shift flag, and optional location and notes. The implementation follows the same repository–service–controller pattern and shared controller helpers used by [Event Quantities API](20260206_event-quantities-api-and-controller-helpers.md) and [Project Pay Items API](20260206_project-pay-items-api.md).

**Purpose**: Expose events via REST so clients can manage calendar events programmatically; support optional list filters and relation expansion.

**Fits into system**: Events are the core calendar entity; they reference project, scope_of_work, payment_type, and optionally invoice; they have assignments and quantities (event_quantity). The API supports filtering by these FKs and `?expanded=true` to include relation payloads.

## Problem Statement

- **Missing API**: The `event` model existed in the Prisma schema but had no REST API surface; clients could not create or manage events programmatically.
- **Inconsistent with other resources**: Other entities (event-quantities, project-pay-items, projects) already use the abstract stack and controller helpers; events were not exposed.

**Why the change was necessary**: The calendar needs events configurable via API for integrations, reporting, and programmatic scheduling.

## Solution

1. **Thin route handlers** in `src/app/api/events/` (GET/POST on collection, GET/PATCH/DELETE on `[id]`).
2. **EventController** with handleGet/handlePost/handlePatch/handleDelete; uses `parseOptionalIntParam` for `project_id`, `scope_of_work_id`, `payment_type_id`, `invoice_id`; uses `parseExpandToInclude` for `?expanded=true` (include project, scope_of_work, payment_type, invoice); DELETE returns 204 No Content.
3. **EventService** with validation (required FKs and start_time/end_time; optional invoice_id, is_day_shift, location, notes); FK existence checks; API-friendly `project_id`/`scope_of_work_id`/`payment_type_id`/`invoice_id` normalized to Prisma relations; ISO date strings for start_time/end_time converted to Date; listWithExpand and getById with expand.
4. **EventRepository** (existing) unchanged; list filtering is done in the controller via where.

## Architecture

### File Locations

```
src/app/api/events/
├── route.ts              # GET (list), POST (create)
└── [id]/route.ts         # GET, PATCH, DELETE by ID

src/server/
├── controllers/EventController.ts
├── services/EventService.ts
└── repositories/EventRepository.ts

tests/
├── server/controllers/EventController.test.ts
├── server/services/EventService.test.ts
├── server/repositories/EventRepository.test.ts
└── utils/mockPrismaEvent.ts

docs/postman/events.postman_collection.json
```

### Component Flow

```
┌─────────────────────────────┐     ┌────────────────────────────────────┐     ┌─────────────────────────────────┐
│  route.ts                   │────▶│  EventController                   │────▶│  EventService                    │
│  GET /api/events            │     │  handleGet / handlePost / etc.     │     │  listWithExpand / create / etc.  │
│  POST /api/events           │     │  parseExpand (via helper)          │     │  validate, beforeCreate, etc.    │
└─────────────────────────────┘     │  parseOptionalIntParam (helper)   │     │  FK validation, date normalization│
                                    └────────────────────────────────────┘     └───────────────┬─────────────────┘
                                                                                              │
                                                                                              ▼
                                                                             ┌─────────────────────────────────┐
                                                                             │  EventRepository                  │
                                                                             │  findMany / findUnique / create   │
                                                                             │  update / delete                  │
                                                                             └─────────────────────────────────┘
```

### Prisma Model

```prisma
model event {
  id               Int       @id @default(autoincrement())
  project_id       Int       @map("project_id")
  scope_of_work_id Int       @map("scope_of_work_id")
  payment_type_id  Int       @map("payment_type_id")
  invoice_id       Int?      @map("invoice_id")
  start_time       DateTime  @map("start_time")
  end_time         DateTime  @map("end_time")
  is_day_shift     Boolean   @default(true) @map("is_day_shift")
  location         String?   @db.VarChar
  notes            String?   @db.Text
  created_at       DateTime  @default(now()) @map("created_at")
  updated_at       DateTime  @default(now()) @updatedAt @map("updated_at")

  project        project            @relation(fields: [project_id], references: [id])
  scope_of_work  scope_of_work      @relation(fields: [scope_of_work_id], references: [id])
  payment_type   payment_type       @relation(fields: [payment_type_id], references: [id])
  invoice        invoice?           @relation(fields: [invoice_id], references: [id])
  assignments    event_assignment[]
  quantities     event_quantity[]

  @@map("event")
}
```

## Implementation Patterns

### 1. Shared controller helpers

Same as [Event Quantities API](20260206_event-quantities-api-and-controller-helpers.md#1-shared-controller-helpers): use `parseOptionalIntParam(queryParams.project_id)` (and same for `scope_of_work_id`, `payment_type_id`, `invoice_id`) and `parseExpandToInclude(expanded, { project: true, scope_of_work: true, payment_type: true, invoice: true })`.

### 2. API-friendly foreign keys and dates

- **Request body**: Accept raw `project_id`, `scope_of_work_id`, `payment_type_id`, `invoice_id` (optional). Service normalizes to Prisma relation format and strips raw `*_id` before create/update. For optional `invoice_id`, PATCH can set `invoice_id: null` (or omit) to leave unchanged; use relation `{ disconnect: true }` when clearing invoice on update.
- **Dates**: Accept `start_time` and `end_time` as ISO date strings or Date; service parses strings to Date and validates (valid date, end_time >= start_time).

### 3. listWithExpand

Service exposes `listWithExpand(filters, expandOptions?, pagination?, client?)`. When `expandOptions?.include` is set, repository findMany is called with include; otherwise delegate to list(). Controller builds expand options via parseExpandToInclude and passes them to getById/listWithExpand/create/update as appropriate.

### 4. DELETE returns 204 No Content

Controller handleDelete returns `new NextResponse(null, { status: 204 })` with no body. Abstract controller tests accept 200 or 204 for delete.

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events` | List all. Optional query: `project_id`, `scope_of_work_id`, `payment_type_id`, `invoice_id` (integer filters), `expanded=true` (include project, scope_of_work, payment_type, invoice). |
| GET | `/api/events/[id]` | Get one by ID. Optional: `expanded=true`. |
| POST | `/api/events` | Create. Body: `project_id`, `scope_of_work_id`, `payment_type_id` (required), `start_time`, `end_time` (required, ISO date strings), `invoice_id` (optional), `is_day_shift` (optional, default true), `location`, `notes` (optional). Optional: `?expanded=true`. |
| PATCH | `/api/events/[id]` | Update by ID. Body: same fields as create, all optional. Optional: `?expanded=true`. |
| DELETE | `/api/events/[id]` | Delete by ID. Returns **204 No Content** with no body. |

**Validation**: FKs must be positive integers and reference existing records. `start_time` and `end_time` must be valid dates; `end_time` must be on or after `start_time`. `location` max 255 characters; `notes` and `location` are trimmed. Service normalizes FKs to Prisma relations and validates FK existence before create/update.

**Errors**: 400 validation, 404 not found, 409 conflict (repository), 500 internal. Responses use `AbstractController.errorResponse` shape.

## Testing

- **Controller**: `EventController.test.ts` uses `createAbstractControllerTests` with EventController, apiPath `/api/events`, createValidInput (API-friendly body with project_id, scope_of_work_id, payment_type_id, start_time, end_time as ISO strings), createInvalidInput (end before start), createUpdateInput, addMockRecord (via mock addEvent and addProject/addScopeOfWork/addPaymentType). Delete response is 204.
- **Service**: `EventService.test.ts` uses `createAbstractServiceTests`; custom tests cover validation (missing project_id/scope_of_work_id, missing start_time/end_time, end before start, project not found).
- **Repository**: `EventRepository.test.ts` uses `createAbstractRepositoryTests`; `mockPrismaEvent` provides full event delegate and minimal project/scope_of_work/payment_type/invoice findUnique for FK validation.
- **Mock**: `tests/utils/mockPrismaEvent.ts` extends MockPrisma with `event` (findMany, findUnique, findFirst, create, update, delete, count) and minimal delegates for project, scope_of_work, payment_type, invoice; helpers addProject, addScopeOfWork, addPaymentType, addInvoice, addEvent.

## Future Improvement Guidelines

- When adding date-range list filters (e.g. `?start_after=`, `?end_before=`), use typed parsing and pass through to repository where; preserve timezone handling if the codebase uses date-fns-tz elsewhere.
- Event assignments and quantities are not exposed in this API; add separate endpoints or nested resources if required.
- Consider supporting `?invoice_id=null` or `?has_invoice=false` for listing events with no invoice.
