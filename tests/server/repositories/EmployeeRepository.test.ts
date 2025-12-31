import { describe, it, expect, beforeEach } from "vitest"
import { EmployeeRepository } from "@/server/repositories/EmployeeRepository"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEmployee } from "../../utils/mockPrismaEmployee"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractRepositoryTests } from "./AbstractRepository.test"
import { Prisma } from "@prisma/client"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract repository tests with Employee configuration
const abstractTests = createAbstractRepositoryTests<
  EmployeeRepository,
  PrismaTypes.employeeGetPayload<{}>,
  PrismaTypes.employeeCreateInput,
  PrismaTypes.employeeUpdateInput,
  PrismaTypes.employeeWhereUniqueInput,
  PrismaTypes.employeeWhereInput
>({
  repositoryClass: EmployeeRepository,
  modelName: "employee",
  createValidInput: () => ({
    name: "Test Employee",
    wage_rate: new Prisma.Decimal(25.5),
    start_date: new Date("2024-01-01"),
  }),
  createUpdateInput: () => ({
    name: "Updated Employee",
    wage_rate: new Prisma.Decimal(27.0),
  }),
  createUniqueInput: (id: number) => ({ id }),
  createWhereInput: (filters: Record<string, any>) => filters as any,
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
  idField: "id",
  extendMockPrisma: extendMockPrismaWithEmployee,
})

// Run abstract tests
describe("EmployeeRepository", () => {
  // Execute all abstract repository tests
  abstractTests()

  // Employee-specific custom method tests
  describe("Custom Methods", () => {
    let mockPrisma: MockPrisma
    let repository: EmployeeRepository

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithEmployee(mockPrisma)
      setMockPrisma(mockPrisma)
      repository = new EmployeeRepository()
    })

    describe("findByEmail", () => {
      it("should find employee by email", async () => {
        ;(mockPrisma as any).addEmployee({
          name: "John Doe",
          wage_rate: 25.5,
          start_date: new Date("2024-01-01"),
          email: "john@example.com",
        })
        ;(mockPrisma as any).addEmployee({
          name: "Jane Smith",
          wage_rate: 30.0,
          start_date: new Date("2024-01-02"),
          email: "jane@example.com",
        })

        const result = await repository.findByEmail("john@example.com")
        expect(result).toBeTruthy()
        expect(result?.email).toBe("john@example.com")
        expect(result?.name).toBe("John Doe")
      })

      it("should return null when email not found", async () => {
        const result = await repository.findByEmail("nonexistent@example.com")
        expect(result).toBeNull()
      })

      it("should handle case sensitivity", async () => {
        ;(mockPrisma as any).addEmployee({
          name: "John Doe",
          wage_rate: 25.5,
          start_date: new Date("2024-01-01"),
          email: "John@Example.com",
        })

        // Email matching should be exact (case-sensitive by default in Prisma)
        const result = await repository.findByEmail("John@Example.com")
        expect(result).toBeTruthy()

        const noMatch = await repository.findByEmail("john@example.com")
        expect(noMatch).toBeNull()
      })
    })

    describe("findActive", () => {
      it("should return only active employees", async () => {
        ;(mockPrisma as any).addEmployee({
          name: "Active Employee 1",
          wage_rate: 25.5,
          start_date: new Date("2024-01-01"),
          active: true,
        })
        ;(mockPrisma as any).addEmployee({
          name: "Active Employee 2",
          wage_rate: 30.0,
          start_date: new Date("2024-01-02"),
          active: true,
        })
        ;(mockPrisma as any).addEmployee({
          name: "Inactive Employee",
          wage_rate: 20.0,
          start_date: new Date("2024-01-03"),
          active: false,
        })

        const results = await repository.findActive()
        expect(results).toHaveLength(2)
        expect(results.every((emp) => emp.active === true)).toBe(true)
        expect(results.some((emp) => emp.name === "Inactive Employee")).toBe(
          false
        )
      })

      it("should return empty array when no active employees", async () => {
        ;(mockPrisma as any).addEmployee({
          name: "Inactive Employee 1",
          wage_rate: 25.5,
          start_date: new Date("2024-01-01"),
          active: false,
        })
        ;(mockPrisma as any).addEmployee({
          name: "Inactive Employee 2",
          wage_rate: 30.0,
          start_date: new Date("2024-01-02"),
          active: false,
        })

        const results = await repository.findActive()
        expect(results).toHaveLength(0)
      })

      it("should include employees with active=true explicitly set", async () => {
        ;(mockPrisma as any).addEmployee({
          name: "Employee",
          wage_rate: 25.5,
          start_date: new Date("2024-01-01"),
          active: true,
        })

        const results = await repository.findActive()
        expect(results).toHaveLength(1)
      })
    })
  })
})
