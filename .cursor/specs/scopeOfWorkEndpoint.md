# Specification: Scope of Work API Endpoints
%
## Goal

Provide RESTful CRUD coverage for the `scope_of_work` entity using the repository-service-controller pattern so stakeholders can programmatically manage scope descriptors with consistent validation and error handling.

## User Stories

- As a backend developer, I need scope-of-work endpoints that mirror other entities to reuse the established abstract stack (repository → service → controller → route).
- As an API consumer, I want to list, add, update, and remove scope entries with clear validation feedback and conflict handling.

## Specific Requirements

**Scope of Work Repository Implementation**

- Create `ScopeOfWorkRepository` extending `AbstractRepository` in `src/server/repositories/ScopeOfWorkRepository.ts`.
- Use Prisma types: `Prisma.scope_of_workGetPayload<{}>`, `Prisma.scope_of_workCreateInput`, `Prisma.scope_of_workUpdateInput`, `Prisma.scope_of_workWhereUniqueInput`, `Prisma.scope_of_workWhereInput`.
- Implement `modelName()` returning `'scope_of_work'`.
- Add `findByDescription(description: string)` to support uniqueness checks.
- Add `findByIds(ids: number[])` helper (optional but useful for future validations involving events).

**Scope of Work Service Implementation**

- Create `ScopeOfWorkService` extending `AbstractService` in `src/server/services/ScopeOfWorkService.ts`.
- Inject `ScopeOfWorkRepository`.
- Override `validate()` to enforce:
  - `description` is required, trimmed, non-empty string, and no longer than 255 characters.
- Override `beforeCreate()` to ensure `description` is unique via `findByDescription`; throw `ConflictError` on duplicates.
- Override `beforeUpdate()` to check uniqueness when `description` changes compared to the existing record.
- Keep hooks extensible for potential future reporting needs (e.g., `beforeDelete` if restrictions arise).

**Scope of Work Controller Implementation**

- Create `ScopeOfWorkController` extending `AbstractController` in `src/server/controllers/ScopeOfWorkController.ts`.
- Inject `ScopeOfWorkService`.
- Implement handlers:
  - `handleGet()` should return the full list when no filters are provided, support optional `?description=` substring filtering, and allow fetching a single record by ID (404 if missing).
  - `handlePost()` should create a scope from `{ description }` and respond with 201 plus the created payload.
  - `handlePatch()` should update the description for a given ID; reject if the record is missing or validation fails.
  - `handleDelete()` should delete by ID and return 204 on success or 404 if not found.
- Map domain errors using base helpers (`ValidationError` → 400, `ConflictError` → 409, `NotFoundError` → 404).
- Ensure unexpected errors are propagated (500) rather than swallowed.

**API Route Handlers**

- `src/app/api/scope-of-works/route.ts` should handle `GET` (list with optional filters) and `POST` (create) requests.
- `src/app/api/scope-of-works/[id]/route.ts` should handle `GET`, `PATCH`, and `DELETE`, validating that `id` is a positive integer and responding with 400 if malformed.
- Route handlers should instantiate `ScopeOfWorkController` (and implicitly its service/repository) or use shared factories, and delegate to controller methods with proper `NextRequest/NextResponse` usage and `async/await`.
- Implement try/catch to translate thrown `HttpError` types into HTTP responses while avoiding duplication of logic already handled by controller helpers.

**Data Validation**

- `description` is required, trimmed, non-empty, <= 255 characters, and unique.
- Return 400 with clear field error messages when validation fails.
- Return 409 on uniqueness conflicts (description already exists).

**Error Handling**

- Validation failures → 400 with detailed messages.
- Not found → 404 with clarifying message.
- Prisma unique constraint violations on `description` → 409 `ConflictError`.
- Unexpected runtime errors pass through as 500.

## Visual Design

N/A

## Existing Code to Leverage

- Use the abstract base classes in `src/server/base/` (Repository, Service, Controller, error types from `types.ts`).
- Use `getPrisma()` from `src/lib/db` and Prisma-generated types from `@prisma/client`.
- Follow routing patterns established by other entities (e.g., `customers`) for dependency wiring.

## Testing Requirements

**Test Structure**

- Add repository, service, and controller tests in `tests/server/repositories`, `tests/server/services`, and `tests/server/controllers` respectively, mirroring the abstract factory approach.

**Repository Tests**

- Import `createAbstractRepositoryTests` from `tests/server/repositories/AbstractRepository.test.ts`.
- Configure with:
  - `repositoryClass`: `ScopeOfWorkRepository`
  - `modelName`: `'scope_of_work'`
  - Input factories for create, update, unique lookup, and where clauses.
  - `extendMockPrisma` helper that exposes scope-of-work delegate methods.
- Add tests covering custom methods like `findByDescription` and `findByIds`.

**Service Tests**

- Import `createAbstractServiceTests` and configure with the same factory methods plus `createInvalidInput()` for description validation.
- Add tests for:
  - Description validation rules.
  - Uniqueness enforcement in `beforeCreate` and `beforeUpdate`.

**Controller Tests**

- Import `createAbstractControllerTests` and configure with:
  - `controllerClass`: `ScopeOfWorkController`
  - `apiPath`: `/api/scope-of-works`
  - Factories for good/bad inputs and mock record creation.
- Supplement with tests covering filtering, not-found errors, and conflict responses.

**Mock Prisma Setup**

- Extend `MockPrisma` to support `scope_of_work` delegate (findMany, findUnique, create, update, delete, count).
- Throw appropriate `Prisma.PrismaClientKnownRequestError` instances in simulated conflict or validation cases.
- Provide helper `addScopeOfWork()` for test data seeding.

**Test Execution**

- Run `npm test -- tests/server` for full suite, or target layers/files as needed.

**What Gets Tested**

- All abstract CRUD behaviors via factories.
- Scope-specific validation, uniqueness, and query helpers.

## Out of Scope

- Frontend UI for managing scopes.
- Authorization, role/permission checks, or external HR integrations.
- Bulk import/export or automations external to basic CRUD.
