# Specification: Payment Type API Endpoints

%

## Goal

Provide RESTful CRUD coverage for the `payment_type` entity using the repository-service-controller pattern so payment types can be managed programmatically with the same validation and error handling standards as other lookup tables.

## User Stories

- As a backend developer, I need payment type endpoints that follow the existing abstract stack (repository → service → controller → route) so CRUD behavior stays consistent.
- As an API consumer, I want to list, add, update, and delete payment types while the system enforces uniqueness and returns clear errors.

## Specific Requirements

**Payment Type Repository Implementation**

- Create `PaymentTypeRepository` extending `AbstractRepository` in `src/server/repositories/PaymentTypeRepository.ts`.
- Use Prisma types: `Prisma.payment_typeGetPayload<{}>`, `Prisma.payment_typeCreateInput`, `Prisma.payment_typeUpdateInput`, `Prisma.payment_typeWhereUniqueInput`, `Prisma.payment_typeWhereInput`.
- Implement `getModelName()` returning `'payment_type'`.
- Add `findByDescription(description: string)` for uniqueness checks.
- Add `findByIds(ids: number[])` helper for potential bulk validations.

**Payment Type Service Implementation**

- Create `PaymentTypeService` extending `AbstractService` in `src/server/services/PaymentTypeService.ts`.
- Inject `PaymentTypeRepository`.
- Override `validate()` to enforce:
  - `description` is required, trimmed, non-empty string, and at most 255 characters.
- Override `beforeCreate()` to ensure description uniqueness using the repository helper and throw `ConflictError` for duplicates.
- Override `beforeUpdate()` to verify uniqueness when `description` changes.
- Keep hooks (e.g., `beforeDelete`) open for future business rules if needed.

**Payment Type Controller Implementation**

- Create `PaymentTypeController` extending `AbstractController` in `src/server/controllers/PaymentTypeController.ts`.
- Inject `PaymentTypeService`.
- Implement handlers:
  - `handleGet()` should return the full list when no filters are provided, allow optional `?description=` substring matching, and support fetching a single record by ID (404 if missing).
  - `handlePost()` should create a payment type from `{ description }` and respond with 201 plus the created record.
  - `handlePatch()` should update the description for a given ID, rejecting missing IDs or validation failures.
  - `handleDelete()` should delete by ID and return 200 (or 204 per project standard) on success or 404 if not found.
- Map domain errors via base helpers (`ValidationError`, `ConflictError`, `NotFoundError`) and let unexpected errors surface as 500.

**API Route Handlers**

- `src/app/api/payment-types/route.ts` should handle `GET` (list/filter) and `POST` (create).
- `src/app/api/payment-types/[id]/route.ts` should handle `GET`, `PATCH`, and `DELETE`, validating that `id` is a positive integer (400 if malformed).
- Route handlers should instantiate `PaymentTypeController` (and its service/repository) following the pattern used by other entities, delegating to controller methods with `async/await`.
- Use try/catch to translate domain errors to HTTP responses while avoiding redundant error handling already present in the controller helpers.

**Data Validation**

- `description` is required, trimmed, non-empty, <= 255 characters, and unique.
- Return 400 for validation failures and 409 for uniqueness conflicts.

**Error Handling**

- Validation failures → 400.
- Not found → 404.
- Prisma unique constraint violations on `description` → 409 `ConflictError`.
- Unexpected runtime errors pass through as 500.

## Visual Design

N/A

## Existing Code to Leverage

- Reuse `src/server/base/` abstract classes (Repository, Service, Controller, and error helpers).
- Use `getPrisma()` from `src/lib/db` and Prisma-generated types.
- Follow routing patterns from existing controllers (e.g., `employees`, `scope-of-works`) for wiring.

## Testing Requirements

**Test Structure**

- Add repository, service, and controller tests under `tests/server/repositories`, `tests/server/services`, and `tests/server/controllers`, respectively, using the abstract test factories.

**Repository Tests**

- Import `createAbstractRepositoryTests` and configure with:
  - `repositoryClass`: `PaymentTypeRepository`
  - `modelName`: `'payment_type'`
  - Factory functions for valid create, update, unique lookup, and where filters.
  - An `extendMockPrisma` helper that exposes `payment_type` delegate methods.
- Add tests for custom helpers (`findByDescription`, `findByIds`).

**Service Tests**

- Import `createAbstractServiceTests` and configure with the same factories plus `createInvalidInput`.
- Add tests covering:
  - Description validation rules.
  - Uniqueness enforcement in `beforeCreate` and `beforeUpdate`.

**Controller Tests**

- Import `createAbstractControllerTests` and configure with:
  - `controllerClass`: `PaymentTypeController`
  - `apiPath`: `/api/payment-types`
  - Input factories for good/invalid data and mock record creation.
- Supplement with tests for filtering, not-found responses, and conflict errors.

**Mock Prisma Setup**

- Extend `MockPrisma` to support `payment_type` delegate methods (findMany, findUnique, create, update, delete, count).
- Throw Prisma `PrismaClientKnownRequestError` for simulated unique/conflict scenarios.
- Provide helpers like `addPaymentType()` for seeding test data.

**Test Execution**

- Run `npm test -- tests/server` or target specific layers/files as necessary.

**What Gets Tested**

- Abstract CRUD behavior through factory tests.
- Payment-type-specific validation, uniqueness logic, and helper methods.

## Out of Scope

- Frontend UI for managing payment types.
- Authentication/authorization beyond the domain errors already handled.
- Payment type exports/imports or integrations outside of CRUD.
