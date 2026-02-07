# Specification: Customer Endpoint

## Goal

Implement RESTful CRUD endpoints for the new `customer` Prisma model using the shared repository → service → controller stack so that customer data is managed consistently with the rest of the architecture.

## User Stories

- As a backend engineer, I want every model to reuse the abstract base classes so that functionality and errors flow predictably across the stack.
- As an API consumer, I want to create, read, update, and delete customers with validated payloads and consistent HTTP responses.

## Specific Requirements

**Customer DTO**

- The Prisma `customer` model includes `id`, `name`, `address`, `phone_number`, `email`, `notes`, `created_at`, `project[]`.
- Ensure the repository, service, and controller always use `Prisma.customerCreateInput`/`customerUpdateInput` and `customerGetPayload` to keep type safety.
- Normalize strings (trim/trimmed) before persisting; keep `notes` optional.
- Email must be unique (enforced both in Prisma schema and via service validation).

**Customer Repository**

- Create `CustomerRepository` in `src/server/repositories/CustomerRepository.ts` extending `AbstractRepository`.
- Implement `getModelName()` returning `'customer'`.
- Add helper methods like `findByEmail(email)` and `searchByName(query)` for reuse.
- Keep filtering/pagination logic reusable for other services.

**Customer Service**

- Create `CustomerService` under `src/server/services/CustomerService.ts` extending `AbstractService`.
- Inject `CustomerRepository`.
- Override `validate()` to require `name`, `address`, and `phone_number`, validate email format if present, and sanitize whitespace.
- Override `beforeCreate`/`beforeUpdate` to enforce email uniqueness via the repository and reject duplicates with `ConflictError`.
- Implement business method `mergeOrCreateByEmail(payload)` to upsert using email as key when provided.

**Customer Controller**

- Create `CustomerController` in `src/server/controllers/CustomerController.ts` extending `AbstractController`.
- Inject `CustomerService`.
- Implement `handleGet()` supporting list (with optional `search` query) and individual fetch by ID (via `parseId`).
- Implement `handlePost()` to create customers, returning 201 and `successResponse`.
- Implement `handlePatch()` and `handleDelete()` against parsed IDs with appropriate validations and statuses.
- Use `badRequestResponse`, `notFoundResponse`, and `errorResponse` for consistent JSON output.

**API Routes**

- Add `src/app/api/customers/route.ts` (GET list, POST create).
- Add `src/app/api/customers/[id]/route.ts` (GET by id, PATCH, DELETE).
- Each handler instantiates `CustomerController` and delegates to `handleX`.
- Follow naming conventions (plural `/customers`) and ensure proper HTTP verbs/status codes.

**Error Handling**

- Rely on `DomainError` subclasses (`ValidationError`, `ConflictError`, `NotFoundError`) for consistent responses.
- Translate Prisma unique constraint (`P2002`) into 409 Conflict via the service.
- Return 422 for business validation failures, 400 for malformed body/IDs, and 404 for missing customers.

## Visual Design

N/A

## Existing Code to Leverage

**Abstract Base**

- Use `AbstractRepository`, `AbstractService`, `AbstractController`, and the domain error helper in `src/server/base`.

**Prisma Schema**

- The `customer` model in `prisma/schema.prisma` defines the DTO that powers the repository/service layers.

**Employee Endpoint**

- Mirror the structure in `createEmployeeEndpoint.md` for repository/service/controller/testing patterns and API responses.

## Testing Requirements

Match the layered tests described in the employee spec:

**Test Structure**

- `tests/server/repositories/CustomerRepository.test.ts`
- `tests/server/services/CustomerService.test.ts`
- `tests/server/controllers/CustomerController.test.ts`

**Abstract Test Suites**

- Use `createAbstractRepositoryTests`, `createAbstractServiceTests`, and `createAbstractControllerTests` for generic coverage.
- Configure factory functions (valid/invalid inputs, unique IDs, where clauses).
- Keep these abstract files out of direct test runs.

**Entity-Specific Implementation**

- Each test file must call the abstract factory and add custom checks for email uniqueness, search helpers, and validation errors.
- Customer service tests should cover the new upsert/merge method plus custom validation hooks (`beforeCreate`, `beforeUpdate`).
- Controller tests must verify GET list/ID, POST, PATCH, DELETE paths plus consistent error responses.

**Mock Prisma**

- Provide `tests/utils/mockPrismaCustomer.ts` to extend the shared mock with customer delegates and helpers (`addCustomer`, `clearCustomers`, etc.).
- Throw Prisma errors (P2002, P2025) where needed to test conflict/not-found handling.

**Execution**

- Run `npm test -- tests/server`.
- Run targeted suites (`tests/server/repositories`, `tests/server/services/CustomerService.test.ts`).
- Use `npx vitest tests/server` for watch mode.

## Out of Scope

- Frontend customer UI or design work.
- Bulk imports/exports or integrations with external CRM systems.
- Authentication, authorization, or rate-limiting logic.
- Advanced audit logs beyond Prisma timestamps.
