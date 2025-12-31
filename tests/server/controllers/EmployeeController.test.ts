import { describe, it, expect, beforeEach } from "vitest"
import { EmployeeController } from "@/server/controllers/EmployeeController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEmployee } from "../../utils/mockPrismaEmployee"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import { Prisma } from "@prisma/client"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract controller tests with Employee configuration
const abstractTests = createAbstractControllerTests<
  EmployeeController,
  PrismaTypes.employeeGetPayload<{}>,
  PrismaTypes.employeeCreateInput,
  PrismaTypes.employeeUpdateInput
>({
  controllerClass: EmployeeController,
  modelName: "employee",
  apiPath: "/api/employees",
  createValidInput: () => ({
    name: "Test Employee",
    wage_rate: 25.5,
    start_date: "2024-01-01T00:00:00Z",
  }),
  createInvalidInput: () => ({
    name: "", // Invalid: empty name
    wage_rate: 25.5,
    start_date: "2024-01-01T00:00:00Z",
  }),
  createUpdateInput: () => ({
    name: "Updated Employee",
    wage_rate: 27.0,
  }),
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    return (mockPrisma as any).addEmployee({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      name: data.name ?? "Test Employee",
      wage_rate: data.wage_rate ?? 25.5,
      start_date: data.start_date ?? new Date("2024-01-01"),
      email: data.email ?? null,
      phone_number: data.phone_number ?? null,
      active: data.active ?? true,
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: extendMockPrismaWithEmployee,
})

// Run abstract tests
describe("EmployeeController", () => {
  // Execute all abstract controller tests
  abstractTests()
})
