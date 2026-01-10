# Specification: Invoice API Endpoints

%

## Goal

Provide RESTful CRUD coverage for the `invoice` entity using the repository-service-controller pattern so invoices can be managed programmatically with consistent validation and error handling standards as other entities.

## User Stories

- As a backend developer, I need invoice endpoints that follow the existing abstract stack (repository → service → controller → route) so CRUD behavior stays consistent.
- As an API consumer, I want to list, add, update, and delete invoices while the system enforces uniqueness on invoice numbers and returns clear errors.

## Specific Requirements

**Invoice Repository Implementation**

- Create `InvoiceRepository` extending `AbstractRepository` in `src/server/repositories/InvoiceRepository.ts`.
- Use Prisma types: `Prisma.invoiceGetPayload<{}>`, `Prisma.invoiceCreateInput`, `Prisma.invoiceUpdateInput`, `Prisma.invoiceWhereUniqueInput`, `Prisma.invoiceWhereInput`.
- Implement `getModelName()` returning `'invoice'`.
- Add `findByNumber(number: string)` for uniqueness checks.
- Add `findByIds(ids: number[])` helper for potential bulk validations.

**Invoice Service Implementation**

- Create `InvoiceService` extending `AbstractService` in `src/server/services/InvoiceService.ts`.
- Inject `InvoiceRepository`.
- Override `validate()` to enforce:
  - `number` is required, trimmed, non-empty string, and at most 255 characters.
  - `is_contract_invoice` is optional boolean (defaults to false if not provided).
- Override `beforeCreate()` to ensure number uniqueness using the repository helper and throw `ConflictError` for duplicates.
- Override `beforeUpdate()` to verify uniqueness when `number` changes.
- Keep hooks (e.g., `beforeDelete`) open for future business rules if needed (e.g., preventing deletion if invoice has associated events).

**Invoice Controller Implementation**

- Create `InvoiceController` extending `AbstractController` in `src/server/controllers/InvoiceController.ts`.
- Inject `InvoiceService`.
- Implement handlers:
  - `handleGet()` should return the full list when no filters are provided, allow optional `?number=` substring matching, and support fetching a single record by ID (404 if missing).
  - `handlePost()` should create an invoice from `{ number, is_contract_invoice? }` and respond with 201 plus the created record.
  - `handlePatch()` should update the number and/or is_contract_invoice for a given ID, rejecting missing IDs or validation failures.
  - `handleDelete()` should delete by ID and return 200 (or 204 per project standard) on success or 404 if not found.
- Map domain errors via base helpers (`ValidationError`, `ConflictError`, `NotFoundError`) and let unexpected errors surface as 500.

**API Route Handlers**

- `src/app/api/invoices/route.ts` should handle `GET` (list/filter) and `POST` (create).
- `src/app/api/invoices/[id]/route.ts` should handle `GET`, `PATCH`, and `DELETE`, validating that `id` is a positive integer (400 if malformed).
- Route handlers should instantiate `InvoiceController` (and its service/repository) following the pattern used by other entities, delegating to controller methods with `async/await`.
- Use try/catch to translate domain errors to HTTP responses while avoiding redundant error handling already present in the controller helpers.

**Data Validation**

- `number` is required, trimmed, non-empty, <= 255 characters, and unique.
- `is_contract_invoice` is optional boolean (defaults to false).
- Return 400 for validation failures and 409 for uniqueness conflicts.

**Error Handling**

- Validation failures → 400.
- Not found → 404.
- Prisma unique constraint violations on `number` → 409 `ConflictError`.
- Unexpected runtime errors pass through as 500.

## Visual Design

N/A

## Existing Code to Leverage

- Reuse `src/server/base/` abstract classes (Repository, Service, Controller, and error helpers).
- Use `getPrisma()` from `src/lib/db` and Prisma-generated types.
- Follow routing patterns from existing controllers (e.g., `payment-types`, `scope-of-works`) for wiring.

## Testing Requirements

**Test Structure**

- Add repository, service, and controller tests under `tests/server/repositories`, `tests/server/services`, and `tests/server/controllers`, respectively, using the abstract test factories.

**Repository Tests**

- Import `createAbstractRepositoryTests` and configure with:
  - `repositoryClass`: `InvoiceRepository`
  - `modelName`: `'invoice'`
  - Factory functions for valid create, update, unique lookup, and where filters.
  - An `extendMockPrisma` helper that exposes `invoice` delegate methods.
- Add tests for custom helpers (`findByNumber`, `findByIds`).

**Service Tests**

- Import `createAbstractServiceTests` and configure with the same factories plus `createInvalidInput`.
- Add tests covering:
  - Number validation rules (required, trimmed, length limits).
  - `is_contract_invoice` optional boolean handling.
  - Uniqueness enforcement in `beforeCreate` and `beforeUpdate`.

**Controller Tests**

- Import `createAbstractControllerTests` and configure with:
  - `controllerClass`: `InvoiceController`
  - `apiPath`: `/api/invoices`
  - Input factories for good/invalid data and mock record creation.
- Supplement with tests for filtering by number, not-found responses, and conflict errors.

**Mock Prisma Setup**

- Extend `MockPrisma` to support `invoice` delegate methods (findMany, findUnique, create, update, delete, count).
- Throw Prisma `PrismaClientKnownRequestError` for simulated unique/conflict scenarios.
- Provide helpers like `addInvoice()` for seeding test data.

**Test Execution**

- Run `npm test -- tests/server` or target specific layers/files as necessary.

**What Gets Tested**

- Abstract CRUD behavior through factory tests.
- Invoice-specific validation, uniqueness logic, and helper methods.

## Out of Scope

- Frontend UI for managing invoices.
- Authentication/authorization beyond the domain errors already handled.
- Invoice exports/imports or integrations outside of CRUD.
- Business logic for preventing deletion when invoice has associated events (can be added later via `beforeDelete` hook).
