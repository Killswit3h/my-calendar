# Event Assignments API Specification

| Field | Value |
|-------|-------|
| Date | 2026-02-06 |
| Feature | Event Assignments CRUD API |
| Component | API / Backend |

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Testing](#testing)

## Overview

This specification documents the **Event Assignments CRUD API** (`/api/event-assignments`), which allows listing, creating, updating, and deleting event-assignment records (linking events to employees). The implementation follows the same repository–service–controller pattern and shared controller helpers used by [Event Quantities API](20260206_event-quantities-api-and-controller-helpers.md) and [Events API](20260206_events-api.md).

**Purpose**: Expose event assignments via REST so clients can manage which employees are assigned to which events programmatically.

**Fits into system**: Event assignments sit between `event` and `employee`; the API supports filtering by `event_id` and `employee_id`, optional relation expansion (`?expanded=true`), and enforces the unique constraint `(event_id, employee_id)` with 409 Conflict on duplicate.

## Architecture

### File Locations

```
src/app/api/event-assignments/
├── route.ts              # GET (list), POST (create)
└── [id]/route.ts         # GET, PATCH, DELETE by ID

src/server/
├── controllers/EventAssignmentController.ts
├── services/EventAssignmentService.ts
└── repositories/EventAssignmentRepository.ts

tests/
├── server/controllers/EventAssignmentController.test.ts
├── server/services/EventAssignmentService.test.ts
├── server/repositories/EventAssignmentRepository.test.ts
└── utils/mockPrismaEventAssignment.ts
```

### Prisma Model

```prisma
model event_assignment {
  id          Int @id @default(autoincrement())
  event_id    Int @map("event_id")
  employee_id Int @map("employee_id")

  event    event    @relation(fields: [event_id], references: [id])
  employee employee @relation(fields: [employee_id], references: [id])

  @@unique([event_id, employee_id])
  @@map("event_assignment")
}
```

### Implementation Patterns

- **Controller helpers**: `parseOptionalIntParam(queryParams.event_id)`, `parseOptionalIntParam(queryParams.employee_id)`, `parseExpandToInclude(expanded, { event: true, employee: true })`.
- **API-friendly body**: Accept `event_id` and `employee_id` in POST/PATCH; service normalizes to Prisma relations and validates FK existence.
- **Uniqueness**: Service checks `(event_id, employee_id)` before create/update; throws `ConflictError` ("An assignment for this event and employee already exists") → 409.
- **DELETE**: Returns 204 No Content with no body.

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/event-assignments` | List all. Optional query: `event_id`, `employee_id` (integer filters), `expanded=true` (include `event`, `employee`). |
| GET | `/api/event-assignments/[id]` | Get one by ID. Optional: `expanded=true`. |
| POST | `/api/event-assignments` | Create. Body: `event_id`, `employee_id` (required). Optional: `?expanded=true`. |
| PATCH | `/api/event-assignments/[id]` | Update by ID. Body: `event_id`, `employee_id` (optional). Optional: `?expanded=true`. |
| DELETE | `/api/event-assignments/[id]` | Delete by ID. Returns **204 No Content** with no body. |

**Validation**: `event_id` and `employee_id` must be positive integers and must reference existing records. Duplicate `(event_id, employee_id)` returns 409 Conflict.

**Errors**: 400 validation, 404 not found, 409 conflict (duplicate or repository P2002), 500 internal. Responses use `AbstractController.errorResponse` shape.

## Testing

- **Controller**: `EventAssignmentController.test.ts` uses `createAbstractControllerTests`; custom tests for filter by `event_id`, filter by `employee_id`, and DELETE returns 204.
- **Service**: `EventAssignmentService.test.ts` uses `createAbstractServiceTests`; custom tests for validation (missing event_id/employee_id, event/employee not found) and uniqueness (duplicate on create, duplicate on update).
- **Repository**: `EventAssignmentRepository.test.ts` uses `createAbstractRepositoryTests`; custom tests for `findByEventId`, `findByEmployeeId`, `findFirstByEventAndEmployee`.
- **Mock**: `mockPrismaEventAssignment.ts` extends MockPrisma with `event_assignment` delegate, `event`/`employee` findUnique for FK validation, and P2002 on duplicate create.
