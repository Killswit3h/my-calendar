# Specification: Abstract Entity Architecture

## Goal

Build a Spring Boot–style layered backend for the new Prisma schema so that every database model is backed by a repository, service, and controller guided by shared abstractions.

## User Stories

- As a backend engineer, I want shared abstract repository/service/controller base classes so I can implement new entity logic without repeating CRUD plumbing.
- As an API owner, I want each model to expose thin Next.js route handlers that delegate to controllers so routing stays consistent across resources.

## Specific Requirements

**Abstract base classes**

- Define `AbstractRepository`, `AbstractService`, and `AbstractController` in `src/server/base/`.
- Each base class should codify CRUD, validation, transaction, and response handling patterns.
- Base classes must accept generic Prisma model/input types for reuse by every entity.

**Per-entity layers**

- Create repository/service/controller triples under `src/server/repositories`, `src/server/services`, and `src/server/controllers` for `customer`, `employee`, `event`, `project`, `pay_item`, `payment_type`, `scope_of_work`, `invoice`, `project_pay_item`, `event_assignment`, and `event_quantity`.
- Services must inject their repository, apply business rules, and expose methods consumed by controllers.
- Controllers should map service results to HTTP responses, keeping error handling and status codes consistent.

**Routing**

- Keep route handlers in `src/app/api/...` lightweight by instantiating the appropriate controller and delegating based on HTTP verb.
- Standardize responses using helper methods from `AbstractController` so that every endpoint returns JSON with similar shape.

**Prisma integration**

- Use `prisma/schema.prisma` types in repositories/services for create/update inputs and query payloads.
- Reuse the shared Prisma client in `src/lib/db` and helpers such as `tryPrisma` where applicable.

## Visual Design

N/A

## Existing Code to Leverage

- **`agent-os/specs/spring-boot-architecture/spec.md`**: Comprehensive outline of directories, layer responsibilities, error handling strategy, and implementation milestones.
- **`src/server/prisma.ts`** (backup wrapper): Look at how event mutations are wrapped for cross-cutting concerns when deciding whether certain services need similar hooks.

## Out of Scope

- Frontend work or UI components.
- Introducing changes to the `prisma/schema.prisma` models themselves.
- Full-coverage validation suites up front; prefer per-service validation as needed.

---

name: Spring Boot-Style Architecture for Node.js/Prisma
overview: Implement a layered architecture pattern similar to Spring Boot, with Abstract base classes for Repository, Service, and Controller layers. This provides separation of concerns, code reusability, and a consistent structure across all entity operations.
todos:

- id: create-abstract-base
  content: Create abstract base classes (AbstractRepository, AbstractService, AbstractController)
  status: pending
- id: implement-reference-entity
  content: Implement Customer entity as reference (CustomerRepository, CustomerService, CustomerController)
  status: pending
- id: implement-remaining-entities
  content: Implement remaining 10 entities following Customer pattern
  status: pending
- id: migrate-existing-endpoints
  content: Migrate existing API routes to use new Controllers
  status: pending

---

# Spring Boot-Style Architecture Specification

## Overview

This specification outlines a layered architecture pattern for the Node.js/Prisma backend, inspired by Spring Boot's Repository-Service-Controller pattern. The architecture separates concerns into three distinct layers:

1. **Repository Layer**: Data access abstraction using Prisma Client
2. **Service Layer**: Business logic and validation
3. **Controller Layer**: HTTP request/response handling

## Directory Structure

```
src/
├── server/
│   ├── base/
│   │   ├── AbstractRepository.ts      # Base repository with CRUD operations
│   │   ├── AbstractService.ts          # Base service with business logic patterns
│   │   ├── AbstractController.ts       # Base controller with HTTP handlers
│   │   └── types.ts                    # Shared types and interfaces
│   │
│   ├── repositories/
│   │   ├── CustomerRepository.ts
│   │   ├── EmployeeRepository.ts
│   │   ├── EventRepository.ts
│   │   ├── ProjectRepository.ts
│   │   ├── PayItemRepository.ts
│   │   ├── PaymentTypeRepository.ts
│   │   ├── ScopeOfWorkRepository.ts
│   │   ├── InvoiceRepository.ts
│   │   ├── ProjectPayItemRepository.ts
│   │   ├── EventAssignmentRepository.ts
│   │   └── EventQuantityRepository.ts
│   │
│   ├── services/
│   │   ├── CustomerService.ts
│   │   ├── EmployeeService.ts
│   │   ├── EventService.ts
│   │   ├── ProjectService.ts
│   │   ├── PayItemService.ts
│   │   ├── PaymentTypeService.ts
│   │   ├── ScopeOfWorkService.ts
│   │   ├── InvoiceService.ts
│   │   ├── ProjectPayItemService.ts
│   │   ├── EventAssignmentService.ts
│   │   └── EventQuantityService.ts
│   │
│   └── controllers/
│       ├── CustomerController.ts
│       ├── EmployeeController.ts
│       ├── EventController.ts
│       ├── ProjectController.ts
│       ├── PayItemController.ts
│       ├── PaymentTypeController.ts
│       ├── ScopeOfWorkController.ts
│       ├── InvoiceController.ts
│       ├── ProjectPayItemController.ts
│       ├── EventAssignmentController.ts
│       └── EventQuantityController.ts
│
└── app/
    └── api/
        ├── customers/
        │   ├── route.ts                 # GET, POST handlers
        │   └── [id]/
        │       └── route.ts             # GET, PATCH, DELETE handlers
        ├── employees/
        │   ├── route.ts
        │   └── [id]/
        │       └── route.ts
        ├── events/
        │   ├── route.ts
        │   └── [id]/
        │       └── route.ts
        ├── projects/
        │   ├── route.ts
        │   └── [id]/
        │       └── route.ts
        └── ... (similar structure for other entities)
```

## Layer Responsibilities

### 1. Repository Layer (`src/server/repositories/`)

**Purpose**: Data access abstraction. Direct interaction with Prisma Client.

**AbstractRepository.ts Responsibilities**:

- Provide generic CRUD operations (findMany, findUnique, create, update, delete, upsert)
- Handle Prisma Client initialization
- Support transactions
- Type-safe Prisma query building
- Error handling for Prisma-specific errors

**Concrete Repository Responsibilities**:

- Extend `AbstractRepository` with model-specific type parameters
- Implement model-specific query methods (e.g., `findByEmail`, `findActiveEmployees`)
- Override base methods if custom behavior needed
- Handle model-specific include/select patterns

**Key Methods (AbstractRepository)**:

- `findMany(where?, include?, select?, orderBy?, take?, skip?)`
- `findUnique(where, include?, select?)`
- `findFirst(where, include?, select?)`
- `create(data, include?, select?)`
- `update(where, data, include?, select?)`
- `delete(where)`
- `upsert(where, create, update, include?, select?)`
- `count(where?)`
- `exists(where)`

### 2. Service Layer (`src/server/services/`)

**Purpose**: Business logic, validation, and orchestration. Uses Repository layer.

**AbstractService.ts Responsibilities**:

- Provide common business logic patterns
- Input validation and sanitization
- Business rule enforcement
- Error handling and transformation
- Transaction management for multi-step operations
- Logging and audit trails

**Concrete Service Responsibilities**:

- Extend `AbstractService` with model-specific type parameters
- Inject corresponding Repository instance
- Implement business-specific validation rules
- Override base CRUD methods to add business logic
- Implement domain-specific methods (e.g., `activateEmployee`, `assignToProject`)

**Key Methods (AbstractService)**:

- `list(filters?, pagination?)`
- `getById(id)`
- `create(data)` - with validation
- `update(id, data)` - with validation
- `delete(id)` - with business rule checks
- `validate(data)` - abstract method for subclasses
- `beforeCreate(data)` - hook for subclasses
- `afterCreate(entity)` - hook for subclasses
- `beforeUpdate(id, data)` - hook for subclasses
- `afterUpdate(entity)` - hook for subclasses

### 3. Controller Layer (`src/server/controllers/`)

**Purpose**: HTTP request/response handling. Uses Service layer.

**AbstractController.ts Responsibilities**:

- Standardize HTTP response formats
- Handle common HTTP errors (404, 400, 500)
- Request parsing and validation
- Response serialization
- CORS handling (if needed)
- Authentication/authorization checks

**Concrete Controller Responsibilities**:

- Extend `AbstractController` with model-specific type parameters
- Inject corresponding Service instance
- Implement HTTP method handlers (GET, POST, PATCH, DELETE)
- Handle route-specific logic (query params, path params)
- Transform service responses to HTTP responses

**Key Methods (AbstractController)**:

- `handleGet(req, res)` - abstract, implemented by subclasses
- `handlePost(req, res)` - abstract, implemented by subclasses
- `handlePatch(req, res)` - abstract, implemented by subclasses
- `handleDelete(req, res)` - abstract, implemented by subclasses
- `parseQueryParams(req)` - helper
- `parsePathParams(req)` - helper
- `parseBody(req)` - helper
- `successResponse(data, statusCode?)`
- `errorResponse(error, statusCode?)`
- `notFoundResponse()`
- `badRequestResponse(message?)`

### 4. Route Handlers (`src/app/api/**/route.ts`)

**Purpose**: Next.js App Router integration. Thin wrapper around Controllers.

**Responsibilities**:

- Export Next.js route handlers (`GET`, `POST`, `PATCH`, `DELETE`)
- Instantiate Controller
- Call appropriate Controller method
- Return NextResponse

**Pattern**:

```typescript
// src/app/api/customers/route.ts
import { CustomerController } from "@/server/controllers/CustomerController"

const controller = new CustomerController()

export async function GET(req: NextRequest) {
  return controller.handleGet(req)
}

export async function POST(req: NextRequest) {
  return controller.handlePost(req)
}
```

## Models to Implement

Based on `prisma/schema.prisma`, implement the following entities:

1. **customer** - Customer/client information (FDOT districts, municipalities, etc.)
2. **employee** - Employee roster with wage rates and contact info
3. **event** - Work events/calendar entries. Title derived from project.name
4. **project** - Construction projects. Date range calculated from events.
5. **pay_item** - FDOT pay item catalog
6. **payment_type** - Payment rate types for different work scenarios
7. **scope_of_work** - Types of work performed
8. **invoice** - Invoice records
9. **project_pay_item** - Bid items for each project with contracted quantities and rates
10. **event_assignment** - Employee assignments to events with hours worked
11. **event_quantity** - Quantities installed per event. One event can have multiple pay items.

## Type System

### Prisma Type Usage

Each layer uses Prisma-generated types:

- **Repository**: `Prisma.{Model}CreateInput`, `Prisma.{Model}UpdateInput`, `Prisma.{Model}WhereUniqueInput`, `Prisma.{Model}WhereInput`
- **Service**: Same as Repository, plus custom DTOs for validation
- **Controller**: Request/Response DTOs, may transform Prisma types for API

### Generic Type Parameters

**AbstractRepository**:

```typescript
AbstractRepository<
  TModel, // Prisma model type
  TCreateInput, // Prisma CreateInput type
  TUpdateInput, // Prisma UpdateInput type
  TWhereUniqueInput, // Prisma WhereUniqueInput type
  TWhereInput // Prisma WhereInput type
>
```

**AbstractService**:

```typescript
AbstractService<
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereUniqueInput,
  TRepository extends AbstractRepository<...>
>
```

**AbstractController**:

```typescript
AbstractController<
  TModel,
  TCreateDTO,                // API create DTO (may differ from Prisma input)
  TUpdateDTO,                // API update DTO
  TService extends AbstractService<...>
>
```

## Error Handling Strategy

### Error Types

1. **ValidationError**: Input validation failures (400)
2. **NotFoundError**: Entity not found (404)
3. **ConflictError**: Unique constraint violations (409)
4. **BusinessLogicError**: Business rule violations (422)
5. **DatabaseError**: Prisma/database errors (500)

### Error Handling Flow

1. **Repository**: Catch Prisma errors, transform to domain errors
2. **Service**: Catch domain errors, add business context
3. **Controller**: Catch service errors, transform to HTTP responses
4. **Route Handler**: Catch controller errors, return appropriate status

## Transaction Support

- Services can accept optional transaction client for multi-step operations
- AbstractService provides `withTransaction()` helper
- Repositories support transaction client injection

## Validation Strategy

- Use Zod schemas for input validation
- Validation happens in Service layer
- Controllers parse and validate request bodies before passing to Service
- AbstractService provides `validate()` hook for subclasses

## Testing Strategy

- **Repository Tests**: Mock Prisma Client
- **Service Tests**: Mock Repository, test business logic
- **Controller Tests**: Mock Service, test HTTP handling
- **Integration Tests**: Test full stack with test database

## Migration Strategy

1. Create abstract base classes first
2. Implement one complete entity (Customer) as reference
3. Migrate existing endpoints gradually
4. Keep old code until new implementation is verified
5. Update API routes to use new Controllers

## Dependencies

- `@prisma/client` - Prisma Client for database access
- `zod` - Schema validation
- `next/server` - Next.js API route types

## Implementation Order

### Phase 1: Create Abstract Base Classes

1. **AbstractRepository.ts**

   - Generic CRUD operations
   - Prisma Client access
   - Transaction support
   - Error transformation

2. **AbstractService.ts**

   - Business logic patterns
   - Validation hooks
   - Lifecycle hooks (beforeCreate, afterCreate, etc.)
   - Error handling

3. **AbstractController.ts**

   - HTTP method handlers
   - Request parsing
   - Response formatting
   - Error responses

4. **types.ts**
   - Shared interfaces
   - Error types
   - Common types

### Phase 2: Implement Reference Entity (Customer)

1. **CustomerRepository.ts**

   - Extend AbstractRepository
   - Use Prisma customer types
   - Add `findByEmail()` method

2. **CustomerService.ts**

   - Extend AbstractService
   - Inject CustomerRepository
   - Add email uniqueness validation
   - Override create/update methods

3. **CustomerController.ts**

   - Extend AbstractController
   - Inject CustomerService
   - Implement GET, POST, PATCH, DELETE handlers

4. **Update API Routes**
   - Update `src/app/api/customers/route.ts`
   - Update `src/app/api/customers/[id]/route.ts`
   - Test thoroughly

### Phase 3: Implement Remaining Entities

Follow Customer pattern for each entity:

1. **employee** - Employee management
2. **project** - Project management
3. **event** - Event/calendar management
4. **pay_item** - Pay item catalog
5. **payment_type** - Payment type lookup
6. **scope_of_work** - Work type lookup
7. **invoice** - Invoice management
8. **project_pay_item** - Project bid items
9. **event_assignment** - Event-employee assignments
10. **event_quantity** - Event quantities

### Phase 4: Migrate Existing Endpoints

1. Identify existing endpoints that need migration
2. Update to use new Controllers
3. Remove old direct Prisma calls
4. Update tests
5. Verify functionality

## Best Practices

- Keep abstract classes generic and reusable
- Each concrete class should be focused on single responsibility
- Use dependency injection pattern (constructor injection)
- Services should be stateless (create new instance per request or use singleton pattern)
- Controllers should be lightweight and delegate to Services
- Route handlers should be minimal - just wiring
- Use TypeScript strictly - leverage Prisma types
- Document complex business logic
- Write tests for each layer

## Notes

- Abstract classes should handle common patterns, not business-specific logic
- Each entity can override methods as needed for custom behavior
- Keep the pattern consistent across all entities
- Consider creating a shared error handling utility
- Consider creating a shared validation utility using Zod
- Transaction support is important for complex operations
- Consider adding pagination helpers in AbstractService
- Consider adding filtering/sorting helpers in AbstractRepository
