 # Specification: Pay Item API Endpoints
 %
 ## Goal
 
 Provide RESTful CRUD coverage for the `pay_item` entity using the repository-service-controller pattern so the FDOT pay item catalog can be kept in sync with the rest of the system and shared validation / error handling stays consistent.
 
 ## User Stories
 
 - As a backend developer, I want pay item endpoints that reuse the established abstract stack (repository → service → controller → route) so the new catalog resources behave like existing lookup tables.
 - As an API consumer, I want to list, create, update, and remove pay items while the system enforces required fields and uniqueness, surfaces clear errors, and keeps the catalog normalized.
 
 ## Specific Requirements
 
 **Pay Item Repository Implementation**
 
 - Create `PayItemRepository` extending `AbstractRepository` in `src/server/repositories/PayItemRepository.ts`.
 - Use Prisma types: `Prisma.pay_itemGetPayload<{}>`, `Prisma.pay_itemCreateInput`, `Prisma.pay_itemUpdateInput`, `Prisma.pay_itemWhereUniqueInput`, `Prisma.pay_itemWhereInput`.
 - Implement `getModelName()` returning `'pay_item'`.
 - Add `findByNumber(number: string)` for uniqueness checks.
 - Add `findByIds(ids: number[])` helper for whoever might need to cross-reference catalog entries when validating relations.
 
 **Pay Item Service Implementation**
 
 - Create `PayItemService` extending `AbstractService` in `src/server/services/PayItemService.ts`.
 - Inject `PayItemRepository`.
 - Override `validate()` to enforce:
   - `number` is required, trimmed, uppercase (or normalized), matches the FDOT catalog pattern if available, and no more than 64 characters.
   - `description` is required, trimmed, non-empty, and <= 255 characters.
   - `unit` is required, trimmed, and <= 32 characters.
 - Override `beforeCreate()` to ensure the `number` is unique via `findByNumber`; throw `ConflictError` when a duplicate is found.
 - Override `beforeUpdate()` to re-run the uniqueness guard when `number` changes from the existing record.
 - Leave other hooks (e.g., `beforeDelete`) extensible for future catalog business rules.
 
 **Pay Item Controller Implementation**
 
 - Create `PayItemController` extending `AbstractController` in `src/server/controllers/PayItemController.ts`.
 - Inject `PayItemService`.
 - Implement handlers:
   - `handleGet()` should return the full catalog when no filters are supplied, allow optional `?number=` and `?description=` substring filtering, and support fetching a single record by ID (responding 404 when missing).
   - `handlePost()` should create a pay item from `{ number, description, unit }` and return 201 plus the created record.
   - `handlePatch()` should update the provided fields for a given ID, rejecting non-existent records or validation problems.
   - `handleDelete()` should delete by ID and return 204 (or consistent default) when successful or 404 when not found.
 - Map domain errors using the shared helpers (`ValidationError` → 400, `ConflictError` → 409, `NotFoundError` → 404) and let unexpected errors bubble into 500 responses.
 
 **API Route Handlers**
 
 - `src/app/api/pay-items/route.ts` should handle `GET` (list + filters) and `POST` (create).
 - `src/app/api/pay-items/[id]/route.ts` should handle `GET`, `PATCH`, and `DELETE`, coercing and validating that `id` is a positive integer and returning 400 if it is malformed.
 - Route handlers should instantiate `PayItemController` (and its service/repository) or use shared wiring helpers, delegate to controller methods with `async/await`, and wrap execution in a try/catch that leverages controller-level helpers to set the response status/body.
 
 **Data Validation**
 
 - `number`, `description`, and `unit` are all required, trimmed strings with reasonable length caps (`number` ≤ 64, `description` ≤ 255, `unit` ≤ 32).
 - `number` must be unique.
 - Return 400 with field-specific messages for validation failures and 409 when the uniqueness constraint fails.
 
 **Error Handling**
 
 - Validation failures → 400.
 - Not found → 404.
 - Prisma unique constraint violations on `number` → 409 (`ConflictError`).
 - Unexpected runtime issues propagate as 500.
 
 ## Visual Design
 
 N/A
 
 ## Existing Code to Leverage
 
 - Reuse the abstract base classes in `src/server/base/` (Repository, Service, Controller, and shared error helpers).
 - Use `getPrisma()` from `src/lib/db` and Prisma-generated types for `pay_item`.
 - Follow routing/controller wiring patterns established by other catalog entities (`payment_type`, `scope_of_work`, etc.).
 
 ## Testing Requirements
 
 **Test Structure**
 
 - Add repository, service, and controller tests under `tests/server/repositories`, `tests/server/services`, and `tests/server/controllers`, mirroring the abstract factory approach already in place.
 
 **Repository Tests**
 
 - Import `createAbstractRepositoryTests` and configure with:
   - `repositoryClass`: `PayItemRepository`
   - `modelName`: `'pay_item'`
   - Factories for valid create inputs, update inputs, unique `number` lookups, and `where` filters.
   - An `extendMockPrisma` helper exposing the `pay_item` delegate methods.
 - Add tests for custom helpers (`findByNumber`, `findByIds`).
 
 **Service Tests**
 
 - Import `createAbstractServiceTests` and configure with the same factories plus `createInvalidInput()` covering:
   - Missing or blank `number`.
   - Duplicate `number`.
   - `description` or `unit` violating length/trim rules.
 - Add targeted tests verifying `beforeCreate` and `beforeUpdate` enforce `number` uniqueness.
 
 **Controller Tests**
 
 - Import `createAbstractControllerTests` and configure with:
   - `controllerClass`: `PayItemController`
   - `apiPath`: `/api/pay-items`
   - Good/bad input factories and mock record builders.
 - Supplement with tests covering filtering logic, not-found responses, and conflict handling when duplicates occur.
 
 **Mock Prisma Setup**
 
 - Extend `MockPrisma` to support the `pay_item` delegate (findMany, findUnique, create, update, delete, count).
 - Throw Prisma `PrismaClientKnownRequestError` instances for simulated conflicts.
 - Provide helpers like `addPayItem()` to seed test data.
 
 **Test Execution**
 
 - Run `npm test -- tests/server` or target the new files directly once implemented.
 
 **What Gets Tested**
 
 - Abstract CRUD behavior via the factory tests.
 - `number`/`description`/`unit` validation, uniqueness enforcement, and controller filtering helpers.
 
 ## Out of Scope
 
 - Frontend UI for managing pay items.
 - Automatic synchronization with FDOT or external catalogs.
 - Authorization beyond the shared domain errors already handled.
