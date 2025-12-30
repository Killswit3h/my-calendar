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

## Out of Scope

- Frontend UI components for employee management
- Employee authentication or authorization logic
- Employee photo or file uploads
- Employee history/audit logging beyond basic timestamps
- Bulk employee import/export functionality
- Employee role/permission management
- Integration with external HR systems
- Employee scheduling or calendar features (handled by event_assignment model)
