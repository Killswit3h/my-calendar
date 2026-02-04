# Specification: Project API Endpoints
%
## Goal

Provide RESTful CRUD coverage for the `project` entity using the repository-service-controller pattern so projects can be managed programmatically with consistent validation and error handling standards as other entities.

## User Stories

- As a backend developer, I need project endpoints that follow the existing abstract stack (repository → service → controller → route) so CRUD behavior stays consistent.
- As an API consumer, I want to list, add, update, and delete projects while the system enforces required fields, uniqueness on project names, validates customer references, and returns clear errors.

## Specific Requirements

**Project Repository Implementation**

- Create `ProjectRepository` extending `AbstractRepository` in `src/server/repositories/ProjectRepository.ts`.
- Use Prisma types: `Prisma.projectGetPayload<{}>`, `Prisma.projectCreateInput`, `Prisma.projectUpdateInput`, `Prisma.projectWhereUniqueInput`, `Prisma.projectWhereInput`.
- Implement `getModelName()` returning `'project'`.
- Add `findByName(name: string)` for uniqueness checks.
- Add `findByIds(ids: number[])` helper for potential bulk validations.
- Add `findByCustomerId(customerId: number)` helper for filtering projects by customer.

**Project Service Implementation**

- Create `ProjectService` extending `AbstractService` in `src/server/services/ProjectService.ts`.
- Inject `ProjectRepository`.
- Override `validate()` to enforce:
  - `name` is required, trimmed, non-empty string, and at most 255 characters.
  - `location` is required, trimmed, non-empty string, and at most 255 characters.
  - `retainage` is required and must be a valid Decimal/number (non-negative).
  - `vendor` is required, trimmed, non-empty string, and at most 255 characters.
  - `customer_id` is optional integer (must reference valid customer if provided).
  - `is_payroll` is optional boolean (defaults to false if not provided).
  - `is_EEO` is optional boolean (defaults to false if not provided).
  - `status` is optional string (defaults to "ACTIVE" if not provided).
- Note: `created_at` and `updated_at` are automatically handled by Prisma defaults and should not be included in create/update inputs.
- Override `beforeCreate()` to ensure name uniqueness using the repository helper and throw `ConflictError` for duplicates. Set defaults for optional fields.
- Override `beforeUpdate()` to verify uniqueness when `name` changes. Update `updated_at` timestamp automatically via Prisma.
- Keep hooks (e.g., `beforeDelete`) open for future business rules if needed (e.g., preventing deletion if project has associated events).

**Project Controller Implementation**

- Create `ProjectController` extending `AbstractController` in `src/server/controllers/ProjectController.ts`.
- Inject `ProjectService`.
- Implement handlers:
  - `handleGet()` should return the full list when no filters are provided, allow optional `?name=`, `?location=`, `?vendor=`, and `?customer_id=` filtering, and support fetching a single record by ID (404 if missing).
  - `handlePost()` should create a project from `{ name, location, retainage, vendor, customer_id?, is_payroll?, is_EEO?, status? }` and respond with 201 plus the created record.
  - `handlePatch()` should update the provided fields for a given ID, rejecting missing IDs or validation failures.
  - `handleDelete()` should delete by ID and return 200 (or 204 per project standard) on success or 404 if not found.
- Map domain errors via base helpers (`ValidationError`, `ConflictError`, `NotFoundError`) and let unexpected errors surface as 500.

**API Route Handlers**

- `src/app/api/projects/route.ts` should handle `GET` (list/filter) and `POST` (create).
- `src/app/api/projects/[id]/route.ts` should handle `GET`, `PATCH`, and `DELETE`, validating that `id` is a positive integer (400 if malformed).
- Route handlers should instantiate `ProjectController` (and its service/repository) following the pattern used by other entities, delegating to controller methods with `async/await`.
- Use try/catch to translate domain errors to HTTP responses while avoiding redundant error handling already present in the controller helpers.

**Data Validation**

- `name` is required, trimmed, non-empty, <= 255 characters, and unique.
- `location` is required, trimmed, non-empty, <= 255 characters.
- `retainage` is required, must be a valid Decimal/number (non-negative).
- `vendor` is required, trimmed, non-empty, <= 255 characters.
- `customer_id` is optional integer (validates customer exists if provided).
- `is_payroll` is optional boolean (defaults to false).
- `is_EEO` is optional boolean (defaults to false).
- `status` is optional string (defaults to "ACTIVE").
- `created_at` and `updated_at` are automatically set by Prisma and should not be included in requests.
- Return 400 for validation failures and 409 for uniqueness conflicts.

**Error Handling**

- Validation failures → 400.
- Not found → 404.
- Prisma unique constraint violations on `name` → 409 `ConflictError`.
- Invalid customer_id reference → 400 `ValidationError`.
- Unexpected runtime errors pass through as 500.

## Visual Design

N/A

## Existing Code to Leverage

- Reuse `src/server/base/` abstract classes (Repository, Service, Controller, and error helpers).
- Use `getPrisma()` from `src/lib/db` and Prisma-generated types.
- Follow routing patterns from existing controllers (e.g., `payment-types`, `invoices`) for wiring.

## Testing Requirements

**Test Structure**

- Add repository, service, and controller tests under `tests/server/repositories`, `tests/server/services`, and `tests/server/controllers`, respectively, using the abstract test factories.

**Repository Tests**

- Import `createAbstractRepositoryTests` and configure with:
  - `repositoryClass`: `ProjectRepository`
  - `modelName`: `'project'`
  - Factory functions for valid create, update, unique lookup, and where filters.
  - An `extendMockPrisma` helper that exposes `project` delegate methods.
- Add tests for custom helpers (`findByName`, `findByIds`, `findByCustomerId`).

**Service Tests**

- Import `createAbstractServiceTests` and configure with the same factories plus `createInvalidInput`.
- Add tests covering:
  - Name, location, vendor validation rules (required, trimmed, length limits).
  - Retainage validation (required, non-negative Decimal).
  - Optional fields (`customer_id`, `is_payroll`, `is_EEO`, `status`) default handling.
  - Uniqueness enforcement in `beforeCreate` and `beforeUpdate`.
  - Customer reference validation (if customer_id provided).

**Controller Tests**

- Import `createAbstractControllerTests` and configure with:
  - `controllerClass`: `ProjectController`
  - `apiPath`: `/api/projects`
  - Input factories for good/invalid data and mock record creation.
- Supplement with tests for filtering by name, location, vendor, customer_id, not-found responses, and conflict errors.

**Mock Prisma Setup**

- Extend `MockPrisma` to support `project` delegate methods (findMany, findUnique, create, update, delete, count).
- Throw Prisma `PrismaClientKnownRequestError` for simulated unique/conflict scenarios.
- Provide helpers like `addProject()` for seeding test data.
- Mock customer relationship for foreign key validation tests.

**Test Execution**

- Run `npm test -- tests/server` or target specific layers/files as necessary.

**What Gets Tested**

- Abstract CRUD behavior through factory tests.
- Project-specific validation, uniqueness logic, and helper methods.
- Automatic timestamp handling (created_at, updated_at).

## Out of Scope

- Frontend UI for managing projects.
- Authentication/authorization beyond the domain errors already handled.
- Project exports/imports or integrations outside of CRUD.
- Business logic for preventing deletion when project has associated events (can be added later via `beforeDelete` hook).
- Complex project status workflows or state transitions.
