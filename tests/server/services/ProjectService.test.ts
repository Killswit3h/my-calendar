import { describe, it, expect, beforeEach } from "vitest"
import { ProjectService } from "@/server/services/ProjectService"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithProject } from "../../utils/mockPrismaProject"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractServiceTests } from "./AbstractService.test"
import { ValidationError, ConflictError } from "@/server/base/types"
import type { Prisma as PrismaTypes } from "@prisma/client"
import { Prisma } from "@prisma/client"

// Run the abstract service tests with Project configuration
const abstractTests = createAbstractServiceTests<
  ProjectService,
  PrismaTypes.projectGetPayload<{}>,
  PrismaTypes.projectCreateInput,
  PrismaTypes.projectUpdateInput
>({
  serviceClass: ProjectService,
  modelName: "project",
  createValidInput: () => ({
    name: "Test Project",
    location: "Test Location",
    retainage: new Prisma.Decimal(5.0),
    vendor: "Test Vendor",
  }),
  createInvalidInput: () =>
    ({
      name: "", // Invalid: empty name
    } as any),
  createUpdateInput: () => ({
    status: "Completed",
  }),
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    return (mockPrisma as any).addProject({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      name: data.name ?? "Test Project",
      location: data.location ?? "Test Location",
      retainage: data.retainage ?? 5.0,
      vendor: data.vendor ?? "Test Vendor",
      customer_id: data.customer_id ?? null,
      is_payroll: data.is_payroll ?? false,
      is_EEO: data.is_EEO ?? false,
      status: data.status ?? "Not Started",
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: extendMockPrismaWithProject,
})

// Run abstract tests
describe("ProjectService", () => {
  // Execute all abstract service tests
  abstractTests()

  // Project-specific custom business logic tests
  describe("Custom Business Logic", () => {
    let mockPrisma: MockPrisma
    let service: ProjectService

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithProject(mockPrisma)
      setMockPrisma(mockPrisma)
      service = new ProjectService()
    })

    describe("validation", () => {
      describe("name validation", () => {
        it("should require name on create", async () => {
          await expect(
            service.create({
              name: undefined,
              location: "Test Location",
              retainage: 5.0,
              vendor: "Test Vendor",
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should reject empty name", async () => {
          await expect(
            service.create({
              name: "",
              location: "Test Location",
              retainage: 5.0,
              vendor: "Test Vendor",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should reject whitespace-only name", async () => {
          await expect(
            service.create({
              name: "   ",
              location: "Test Location",
              retainage: 5.0,
              vendor: "Test Vendor",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should reject name longer than 255 characters", async () => {
          const longName = "a".repeat(256)
          await expect(
            service.create({
              name: longName,
              location: "Test Location",
              retainage: 5.0,
              vendor: "Test Vendor",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should trim name on create", async () => {
          const result = await service.create({
            name: "  Test Project  ",
            location: "Test Location",
            retainage: 5.0,
            vendor: "Test Vendor",
          })
          expect(result.name).toBe("Test Project")
        })
      })

      describe("location validation", () => {
        it("should require location on create", async () => {
          await expect(
            service.create({
              name: "Test Project",
              location: undefined,
              retainage: 5.0,
              vendor: "Test Vendor",
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should reject empty location", async () => {
          await expect(
            service.create({
              name: "Test Project",
              location: "",
              retainage: 5.0,
              vendor: "Test Vendor",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should trim location on create", async () => {
          const result = await service.create({
            name: "Test Project",
            location: "  Test Location  ",
            retainage: 5.0,
            vendor: "Test Vendor",
          })
          expect(result.location).toBe("Test Location")
        })
      })

      describe("retainage validation", () => {
        it("should require retainage on create", async () => {
          await expect(
            service.create({
              name: "Test Project",
              location: "Test Location",
              retainage: undefined,
              vendor: "Test Vendor",
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should accept Decimal retainage", async () => {
          const result = await service.create({
            name: "Test Project",
            location: "Test Location",
            retainage: new Prisma.Decimal(5.5),
            vendor: "Test Vendor",
          })
          expect(result.retainage.toString()).toBe("5.5")
        })

        it("should accept number retainage", async () => {
          const result = await service.create({
            name: "Test Project",
            location: "Test Location",
            retainage: 10.0,
            vendor: "Test Vendor",
          })
          expect(result.retainage.toString()).toBe("10")
        })

        it("should accept string retainage", async () => {
          const result = await service.create({
            name: "Test Project",
            location: "Test Location",
            retainage: "15.5",
            vendor: "Test Vendor",
          })
          expect(result.retainage.toString()).toBe("15.5")
        })

        it("should reject negative retainage", async () => {
          await expect(
            service.create({
              name: "Test Project",
              location: "Test Location",
              retainage: -5.0,
              vendor: "Test Vendor",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should reject invalid retainage string", async () => {
          await expect(
            service.create({
              name: "Test Project",
              location: "Test Location",
              retainage: "invalid",
              vendor: "Test Vendor",
            })
          ).rejects.toThrow(ValidationError)
        })
      })

      describe("vendor validation", () => {
        it("should require vendor on create", async () => {
          await expect(
            service.create({
              name: "Test Project",
              location: "Test Location",
              retainage: 5.0,
              vendor: undefined,
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should trim vendor on create", async () => {
          const result = await service.create({
            name: "Test Project",
            location: "Test Location",
            retainage: 5.0,
            vendor: "  Test Vendor  ",
          })
          expect(result.vendor).toBe("Test Vendor")
        })
      })

      describe("customer_id validation", () => {
        it("should validate customer exists when customer_id provided", async () => {
          await expect(
            service.create({
              name: "Test Project",
              location: "Test Location",
              retainage: 5.0,
              vendor: "Test Vendor",
              customer_id: 999,
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should accept valid customer_id", async () => {
          ;(mockPrisma as any).addCustomer({ id: 1 })

          const result = await service.create({
            name: "Test Project",
            location: "Test Location",
            retainage: 5.0,
            vendor: "Test Vendor",
            customer_id: 1,
          })
          expect(result.customer_id).toBe(1)
        })

        it("should allow null customer_id", async () => {
          const result = await service.create({
            name: "Test Project",
            location: "Test Location",
            retainage: 5.0,
            vendor: "Test Vendor",
            customer_id: null,
          })
          expect(result.customer_id).toBeNull()
        })
      })

      describe("optional fields defaults", () => {
        it("should default is_payroll to false", async () => {
          const result = await service.create({
            name: "Test Project",
            location: "Test Location",
            retainage: 5.0,
            vendor: "Test Vendor",
          })
          expect(result.is_payroll).toBe(false)
        })

        it("should default is_EEO to false", async () => {
          const result = await service.create({
            name: "Test Project",
            location: "Test Location",
            retainage: 5.0,
            vendor: "Test Vendor",
          })
          expect(result.is_EEO).toBe(false)
        })

        it("should default status to ACTIVE", async () => {
          const result = await service.create({
            name: "Test Project",
            location: "Test Location",
            retainage: 5.0,
            vendor: "Test Vendor",
          })
          expect(result.status).toBe("ACTIVE")
        })

        it("should accept is_payroll as true", async () => {
          const result = await service.create({
            name: "Test Project",
            location: "Test Location",
            retainage: 5.0,
            vendor: "Test Vendor",
            is_payroll: true,
          })
          expect(result.is_payroll).toBe(true)
        })

        it("should accept is_EEO as true", async () => {
          const result = await service.create({
            name: "Test Project",
            location: "Test Location",
            retainage: 5.0,
            vendor: "Test Vendor",
            is_EEO: true,
          })
          expect(result.is_EEO).toBe(true)
        })

      })
    })

    describe("name uniqueness", () => {
      it("should prevent duplicate names on create (case-insensitive)", async () => {
        ;(mockPrisma as any).addProject({
          name: "Project Alpha",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
        })

        await expect(
          service.create({
            name: "Project Alpha",
            location: "Location B",
            retainage: 10.0,
            vendor: "Vendor B",
          })
        ).rejects.toThrow(ConflictError)

        await expect(
          service.create({
            name: "project alpha",
            location: "Location C",
            retainage: 15.0,
            vendor: "Vendor C",
          })
        ).rejects.toThrow(ConflictError)
      })

      it("should allow same name when updating same project", async () => {
        const project = (mockPrisma as any).addProject({
          name: "Project Alpha",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
        })

        const result = await service.update(project.id, {
          name: "Project Alpha", // Same name, same project
        })

        expect(result.name).toBe("Project Alpha")
      })

      it("should prevent duplicate names when updating different project", async () => {
        ;(mockPrisma as any).addProject({
          id: 1,
          name: "Project Alpha",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
        })
        ;(mockPrisma as any).addProject({
          id: 2,
          name: "Project Beta",
          location: "Location B",
          retainage: 10.0,
          vendor: "Vendor B",
        })

        await expect(
          service.update(2, {
            name: "Project Alpha", // Trying to use project 1's name
          })
        ).rejects.toThrow(ConflictError)
      })
    })

    describe("update validation", () => {
      it("should allow partial updates", async () => {
        const project = (mockPrisma as any).addProject({
          name: "Test Project",
          location: "Test Location",
          retainage: 5.0,
          vendor: "Test Vendor",
        })

        const result = await service.update(project.id, {
          is_payroll: true,
        })
        expect(result.is_payroll).toBe(true)
        expect(result.name).toBe("Test Project")
      })

      it("should validate status enum on update", async () => {
        const project = (mockPrisma as any).addProject({
          name: "Test Project",
          location: "Test Location",
          retainage: 5.0,
          vendor: "Test Vendor",
        })

        // Valid status values
        const validStatuses = ["Not Started", "In Progress", "Completed"]
        for (const status of validStatuses) {
          const result = await service.update(project.id, {
            status,
          })
          expect(result.status).toBe(status)
        }

        // Invalid status
        await expect(
          service.update(project.id, {
            status: "INVALID_STATUS",
          })
        ).rejects.toThrow(ValidationError)

        await expect(
          service.update(project.id, {
            status: "ACTIVE",
          })
        ).rejects.toThrow(ValidationError)
      })

      it("should trim status on update", async () => {
        const project = (mockPrisma as any).addProject({
          name: "Test Project",
          location: "Test Location",
          retainage: 5.0,
          vendor: "Test Vendor",
        })

        const result = await service.update(project.id, {
          status: "  In Progress  ",
        })
        expect(result.status).toBe("In Progress")
      })
    })
  })
})
