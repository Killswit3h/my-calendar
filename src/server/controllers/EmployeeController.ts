import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { EmployeeService } from "../services/EmployeeService"
import { Prisma } from "@prisma/client"
import { ValidationError } from "../base/types"

/**
 * Employee Controller
 * Handles HTTP requests for employee operations
 */
export class EmployeeController extends AbstractController<
  Prisma.employeeGetPayload<{}>,
  Prisma.employeeCreateInput,
  Prisma.employeeUpdateInput,
  EmployeeService
> {
  protected service: EmployeeService

  constructor() {
    super()
    this.service = new EmployeeService()
  }

  /**
   * Handle GET request
   * Supports:
   * - GET /api/employees - list all employees (with optional ?active=true filter)
   * - GET /api/employees/[id] - get single employee by ID (path parameter)
   */
  async handleGet(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      // Check if ID is provided in path parameter
      const id = await this.parseId(req, context)

      // Single employee by ID
      if (id !== null) {
        const employee = await this.service.getById(id)
        return this.successResponse(employee, 200)
      }

      // List all employees with optional active filter
      const queryParams = this.parseQueryParams(req)
      const activeFilter = queryParams.active

      let filters: any = {}
      if (activeFilter === "true") {
        filters.active = true
      } else if (activeFilter === "false") {
        filters.active = false
      }

      const employees = await this.service.list(filters)
      return this.successResponse(employees, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle POST request
   * Creates a new employee
   */
  async handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const body = await this.parseBody<Prisma.employeeCreateInput>(req)

      // Ensure start_date is a Date object if provided as string
      if (body.start_date && typeof body.start_date === "string") {
        body.start_date = new Date(body.start_date)
      }

      const employee = await this.service.create(body)
      return this.successResponse(employee, 201)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle PATCH request
   * Updates an existing employee by ID (from path parameter)
   */
  async handlePatch(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Employee ID is required in path")
      }

      const body = await this.parseBody<Prisma.employeeUpdateInput>(req)

      // Ensure start_date is a Date object if provided as string
      if (body.start_date && typeof body.start_date === "string") {
        body.start_date = new Date(body.start_date)
      }

      const employee = await this.service.update(id, body)
      return this.successResponse(employee, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle DELETE request
   * Deletes an employee by ID (from path parameter)
   */
  async handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Employee ID is required in path")
      }

      await this.service.delete(id)
      return this.successResponse({ message: "Employee deleted successfully" }, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}

