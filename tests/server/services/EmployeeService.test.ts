import { describe, it, expect, beforeEach } from "vitest"
import { EmployeeService } from "@/server/services/EmployeeService"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEmployee } from "../../utils/mockPrismaEmployee"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractServiceTests } from "./AbstractService.test"
import { Prisma } from "@prisma/client"
import { ValidationError, ConflictError } from "@/server/base/types"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract service tests with Employee configuration
const abstractTests = createAbstractServiceTests<
  EmployeeService,
  PrismaTypes.employeeGetPayload<{}>,
  PrismaTypes.employeeCreateInput,
  PrismaTypes.employeeUpdateInput
>({
  serviceClass: EmployeeService,
  modelName: "employee",
  createValidInput: () => ({
    name: "Test Employee",
    wage_rate: new Prisma.Decimal(25.5),
    start_date: new Date("2024-01-01"),
  }),
  createInvalidInput: () =>
    ({
      name: "", // Invalid: empty name
      wage_rate: new Prisma.Decimal(25.5),
      start_date: new Date("2024-01-01"),
    } as any),
  createUpdateInput: () => ({
    name: "Updated Employee",
    wage_rate: new Prisma.Decimal(27.0),
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
describe("EmployeeService", () => {
  // Execute all abstract service tests
  abstractTests()

  // Employee-specific custom business logic tests
  describe("Custom Business Logic", () => {
    let mockPrisma: MockPrisma
    let service: EmployeeService

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithEmployee(mockPrisma)
      setMockPrisma(mockPrisma)
      service = new EmployeeService()
    })

    describe("validation", () => {
      it("should require name on create", async () => {
        await expect(
          service.create({
            wage_rate: new Prisma.Decimal(25.5),
            start_date: new Date("2024-01-01"),
          } as any)
        ).rejects.toThrow(ValidationError)
      })

      it("should require wage_rate on create", async () => {
        await expect(
          service.create({
            name: "John Doe",
            start_date: new Date("2024-01-01"),
          } as any)
        ).rejects.toThrow(ValidationError)
      })

      it("should require positive wage_rate", async () => {
        await expect(
          service.create({
            name: "John Doe",
            wage_rate: new Prisma.Decimal(-10),
            start_date: new Date("2024-01-01"),
          })
        ).rejects.toThrow(ValidationError)
      })

      it("should require start_date on create", async () => {
        await expect(
          service.create({
            name: "John Doe",
            wage_rate: new Prisma.Decimal(25.5),
          } as any)
        ).rejects.toThrow(ValidationError)
      })

      it("should validate email format", async () => {
        await expect(
          service.create({
            name: "John Doe",
            wage_rate: new Prisma.Decimal(25.5),
            start_date: new Date("2024-01-01"),
            email: "invalid-email", // Invalid format
          })
        ).rejects.toThrow(ValidationError)
      })

      it("should accept valid email format", async () => {
        const result = await service.create({
          name: "John Doe",
          wage_rate: new Prisma.Decimal(25.5),
          start_date: new Date("2024-01-01"),
          email: "john@example.com",
        })
        expect(result.email).toBe("john@example.com")
      })

      it("should allow phone_number as string", async () => {
        const result = await service.create({
          name: "John Doe",
          wage_rate: new Prisma.Decimal(25.5),
          start_date: new Date("2024-01-01"),
          phone_number: "555-1234",
        })
        expect(result.phone_number).toBe("555-1234")
      })
    })

    describe("email uniqueness", () => {
      it("should prevent duplicate emails on create", async () => {
        ;(mockPrisma as any).addEmployee({
          name: "Existing User",
          wage_rate: 25.5,
          start_date: new Date("2024-01-01"),
          email: "existing@example.com",
        })

        await expect(
          service.create({
            name: "New User",
            wage_rate: new Prisma.Decimal(30.0),
            start_date: new Date("2024-01-02"),
            email: "existing@example.com",
          })
        ).rejects.toThrow(ConflictError)
      })

      it("should allow same email when updating same employee", async () => {
        ;(mockPrisma as any).addEmployee({
          id: 1,
          name: "John Doe",
          wage_rate: 25.5,
          start_date: new Date("2024-01-01"),
          email: "john@example.com",
        })

        const result = await service.update(1, {
          name: "John Updated",
          email: "john@example.com", // Same email, same employee
        })

        expect(result.email).toBe("john@example.com")
      })

      it("should prevent duplicate emails when updating different employee", async () => {
        ;(mockPrisma as any).addEmployee({
          id: 1,
          name: "John Doe",
          wage_rate: 25.5,
          start_date: new Date("2024-01-01"),
          email: "john@example.com",
        })
        ;(mockPrisma as any).addEmployee({
          id: 2,
          name: "Jane Smith",
          wage_rate: 30.0,
          start_date: new Date("2024-01-02"),
          email: "jane@example.com",
        })

        await expect(
          service.update(2, {
            email: "john@example.com", // Trying to use employee 1's email
          })
        ).rejects.toThrow(ConflictError)
      })
    })

    describe("activateEmployee", () => {
      it("should set active flag to true", async () => {
        ;(mockPrisma as any).addEmployee({
          id: 1,
          name: "John Doe",
          wage_rate: 25.5,
          start_date: new Date("2024-01-01"),
          active: false,
        })

        const result = await service.activateEmployee(1)
        expect(result.active).toBe(true)
      })

      it("should throw NotFoundError when employee does not exist", async () => {
        await expect(service.activateEmployee(999)).rejects.toThrow()
      })
    })

    describe("deactivateEmployee", () => {
      it("should set active flag to false", async () => {
        ;(mockPrisma as any).addEmployee({
          id: 1,
          name: "John Doe",
          wage_rate: 25.5,
          start_date: new Date("2024-01-01"),
          active: true,
        })

        const result = await service.deactivateEmployee(1)
        expect(result.active).toBe(false)
      })

      it("should throw NotFoundError when employee does not exist", async () => {
        await expect(service.deactivateEmployee(999)).rejects.toThrow()
      })
    })
  })
})
