# Specification: Employee API Endpoints

## Goal

Create RESTful API endpoints for employee management using the new abstract architecture pattern, enabling CRUD operations on the employee model from the new Prisma schema.

## User Stories

- As a backend developer, I want employee API endpoints that follow the repository-service-controller pattern so that employee operations are consistent with other entities.
- As an API consumer, I want to create, read, update, and delete employees through standardized endpoints so that employee data can be managed programmatically.

## Specific Requirements

**Employee Repository Implementation**

- Create `EmployeeRepository` extending `AbstractRepository` in `src/server/repositories/EmployeeRepository.ts`
- Use Prisma types: `Prisma.employeeGetPayload<{}>`, `Prisma.employeeCreateInput`, `Prisma.employeeUpdateInput`, `Prisma.employeeWhereUniqueInput`, `Prisma.employeeWhereInput`
- Implement model name method returning `'employee'`
- Add custom query method `findByEmail(email: string)` for email lookups
- Support filtering by `active` status with `findActive()` method

**Employee Service Implementation**

- Create `EmployeeService` extending `AbstractService` in `src/server/services/EmployeeService.ts`
- Inject `EmployeeRepository` instance
- Override `validate()` to check required fields (name, wage_rate, start_date) and validate email format if provided
- Override `beforeCreate()` to ensure email uniqueness if email is provided
- Override `beforeUpdate()` to check email uniqueness on email changes
- Add business method `activateEmployee(id: number)` to set active flag to true
- Add business method `deactivateEmployee(id: number)` to set active flag to false

**Employee Controller Implementation**

- Create `EmployeeController` extending `AbstractController` in `src/server/controllers/EmployeeController.ts`
- Inject `EmployeeService` instance
- Implement `handleGet()` to support listing all employees with optional `?active=true` filter and single employee by ID from path params
- Implement `handlePost()` to create new employee from request body
- Implement `handlePatch()` to update employee by ID from path params
- Implement `handleDelete()` to delete employee by ID from path params
- Return appropriate HTTP status codes (200, 201, 400, 404, 409, 422)

**API Route Handlers**

- Create `src/app/api/employees/route.ts` with GET and POST handlers
- Create `src/app/api/employees/[id]/route.ts` with GET, PATCH, and DELETE handlers
- Route handlers should instantiate `EmployeeController` and delegate to appropriate methods
- Follow Next.js App Router patterns with proper async/await and error handling

**Data Validation**

- Validate required fields: name (non-empty string), wage_rate (positive decimal), start_date (valid date)
- Validate optional fields: email (valid email format if provided), phone_number (string format)
- Return 400 status with clear error messages for validation failures
- Check email uniqueness and return 409 Conflict if duplicate email provided

**Error Handling**

- Transform domain errors to appropriate HTTP responses using controller error helpers
- Handle Prisma unique constraint violations (email) as 409 Conflict
- Handle not found errors as 404 with clear messages
- Handle validation errors as 400 with field-specific messages

## Visual Design

N/A

## Existing Code to Leverage

**Abstract Base Classes**

- Use `AbstractRepository` from `src/server/base/AbstractRepository.ts` for CRUD operations
- Use `AbstractService` from `src/server/base/AbstractService.ts` for business logic patterns
- Use `AbstractController` from `src/server/base/AbstractController.ts` for HTTP handling
- Use error types from `src/server/base/types.ts` (ValidationError, NotFoundError, ConflictError)

**Prisma Client**

- Use `getPrisma()` from `src/lib/db` for database access
- Leverage Prisma-generated types from `@prisma/client` for type safety
- Follow existing patterns for Prisma query construction seen in other API routes

**Customer Reference Implementation**

- Reference the Customer entity implementation pattern once it's created as a template
- Follow the same structure: Repository → Service → Controller → Route handlers

## Testing Requirements

**Test Structure**

All tests follow a layered structure organized by layer type:

- `tests/server/repositories/` - Repository tests
- `tests/server/services/` - Service tests
- `tests/server/controllers/` - Controller tests

**Abstract Test Suites**

Abstract test suites provide reusable test factories that validate generic CRUD and HTTP functionality:

- `tests/server/repositories/AbstractRepository.test.ts` - Exports `createAbstractRepositoryTests()` factory
- `tests/server/services/AbstractService.test.ts` - Exports `createAbstractServiceTests()` factory
- `tests/server/controllers/AbstractController.test.ts` - Exports `createAbstractControllerTests()` factory

**Note**: Abstract test files are excluded from test runs (they're utilities, not test suites themselves).

**Entity-Specific Test Implementation**

Each entity should have three test files that:

1. **Import and configure the abstract test factory** with entity-specific configuration
2. **Execute the abstract tests** by calling the factory function
3. **Add custom business logic tests** for entity-specific methods and validation rules

**Repository Tests** (`tests/server/repositories/{Entity}Repository.test.ts`)

- Import `createAbstractRepositoryTests` from `./AbstractRepository.test`
- Configure with:
  - `repositoryClass`: The repository class constructor
  - `modelName`: Prisma model name (e.g., 'employee')
  - `createValidInput()`: Factory function for valid create input
  - `createUpdateInput()`: Factory function for valid update input
  - `createUniqueInput(id)`: Factory function for unique identifier
  - `createWhereInput(filters)`: Factory function for where clauses
  - `addMockRecord(mockPrisma, data)`: Function to add test data to mock Prisma
  - `getIdFromModel(model)`: Function to extract ID from model
  - `extendMockPrisma`: Function to extend MockPrisma with model support
- Call the factory function to run all abstract repository tests
- Add tests for custom repository methods (e.g., `findByEmail`, `findActive`)

**Service Tests** (`tests/server/services/{Entity}Service.test.ts`)

- Import `createAbstractServiceTests` from `./AbstractService.test`
- Configure with similar factory functions as repository tests
- Include `createInvalidInput()` factory for validation testing
- Call the factory function to run all abstract service tests
- Add tests for:
  - Custom validation rules
  - Business logic hooks (beforeCreate, beforeUpdate, etc.)
  - Entity-specific business methods (e.g., `activateEmployee`, `deactivateEmployee`)
  - Custom error handling scenarios

**Controller Tests** (`tests/server/controllers/{Entity}Controller.test.ts`)

- Import `createAbstractControllerTests` from `./AbstractController.test`
- Configure with:
  - `controllerClass`: The controller class constructor
  - `apiPath`: Base API path (e.g., '/api/employees')
  - Factory functions for valid/invalid inputs
  - Mock record creation functions
- Call the factory function to run all abstract controller tests
- Abstract tests cover: GET (list/by ID), POST, PATCH, DELETE, error handling

**Mock Prisma Setup**

- Create `tests/utils/mockPrisma{Entity}.ts` to extend MockPrisma with entity support
- Export `extendMockPrismaWith{Entity}(mockPrisma)` function
- Implement Prisma model delegate methods (findMany, findUnique, create, update, delete, count)
- Throw proper `Prisma.PrismaClientKnownRequestError` instances for error scenarios
- Provide helper methods like `add{Entity}()` for test data creation

**Test Execution**

- Run all server tests: `npm test -- tests/server`
- Run specific layer: `npm test -- tests/server/repositories`
- Run specific file: `npm test -- tests/server/repositories/EmployeeRepository.test.ts`
- Watch mode: `npx vitest tests/server`

**What Gets Tested**

- **Abstract Tests** (via factory): Generic CRUD operations, error handling, pagination, filtering
- **Entity-Specific Tests**: Custom query methods, business validation rules, lifecycle hooks, domain-specific methods

**Testing Best Practices**

- Abstract tests validate generic functionality inherited from base classes
- Entity tests focus only on custom business logic and validation
- Use MockPrisma to avoid database dependencies
- Test error scenarios (not found, validation failures, conflicts)
- Keep tests focused and independent (use `beforeEach` to reset state)

## Out of Scope

- Frontend UI components for employee management
- Employee authentication or authorization logic
- Employee photo or file uploads
- Employee history/audit logging beyond basic timestamps
- Bulk employee import/export functionality
- Employee role/permission management
- Integration with external HR systems
- Employee scheduling or calendar features (handled by event_assignment model)
