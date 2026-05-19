import { describe, it, expect, beforeEach } from "vitest"
import { EmployeeController } from "@/server/controllers/EmployeeController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEmployee } from "../../utils/mockPrismaEmployee"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import { NextRequest } from "next/server"
import { Prisma } from "@prisma/client"
import type { Prisma as PrismaTypes } from "@prisma/client"
import { PROJECT_MANAGER_ROLE } from "@/domain/projectEmployees"

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

  describe("role filter", () => {
    let mockPrisma: MockPrisma
    let controller: EmployeeController

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithEmployee(mockPrisma)
      setMockPrisma(mockPrisma)
      controller = new EmployeeController()
      ;(mockPrisma as any).addEmployee({
        name: "A",
        wage_rate: 20,
        start_date: new Date("2024-01-01"),
        active: true,
        role: "Project Manager",
      })
      ;(mockPrisma as any).addEmployee({
        name: "B",
        wage_rate: 22,
        start_date: new Date("2024-02-01"),
        active: true,
        role: "Foreman",
      })
      ;(mockPrisma as any).addEmployee({
        name: "Inactive PM",
        wage_rate: 25,
        start_date: new Date("2024-03-01"),
        active: false,
        role: "project manager",
      })
    })

    it("filters by Project Manager role with active=true", async () => {
      const q = encodeURIComponent(PROJECT_MANAGER_ROLE)
      const url = new URL(
        `http://localhost:3000/api/employees?active=true&role=${q}`,
      )
      const res = await controller.handleGet(new NextRequest(url))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(1)
      expect(data[0].name).toBe("A")
    })

    it("allows case-insensitive role query", async () => {
      const url = new URL(
        `http://localhost:3000/api/employees?active=false&role=project%20manager`,
      )
      const res = await controller.handleGet(new NextRequest(url))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(1)
      expect(data[0].name).toBe("Inactive PM")
    })
  })
})
