import { describe, it, expect, beforeEach } from "vitest"
import { ProjectRepository } from "@/server/repositories/ProjectRepository"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithProject } from "../../utils/mockPrismaProject"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractRepositoryTests } from "./AbstractRepository.test"
import type { Prisma as PrismaTypes } from "@prisma/client"
import { Prisma } from "@prisma/client"

// Run the abstract repository tests with Project configuration
const abstractTests = createAbstractRepositoryTests<
  ProjectRepository,
  PrismaTypes.projectGetPayload<{}>,
  PrismaTypes.projectCreateInput,
  PrismaTypes.projectUpdateInput,
  PrismaTypes.projectWhereUniqueInput,
  PrismaTypes.projectWhereInput
>({
  repositoryClass: ProjectRepository,
  modelName: "project",
  createValidInput: () => ({
    name: "Test Project",
    location: "Test Location",
    retainage: new Prisma.Decimal(5.0),
    vendor: "Test Vendor",
  }),
  createUpdateInput: () => ({
    status: "COMPLETED",
  }),
  createUniqueInput: (id: number) => ({ id }),
  createWhereInput: (filters: Record<string, any>) => filters as any,
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
  idField: "id",
  extendMockPrisma: extendMockPrismaWithProject,
})

// Run abstract tests
describe("ProjectRepository", () => {
  // Execute all abstract repository tests
  abstractTests()

  // Project-specific custom method tests
  describe("Custom Methods", () => {
    let mockPrisma: MockPrisma
    let repository: ProjectRepository

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithProject(mockPrisma)
      setMockPrisma(mockPrisma)
      repository = new ProjectRepository()
    })

    describe("findByName", () => {
      it("should find project by name (case-insensitive)", async () => {
        ;(mockPrisma as any).addProject({
          name: "Project Alpha",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
        })
        ;(mockPrisma as any).addProject({
          name: "Project Beta",
          location: "Location B",
          retainage: 10.0,
          vendor: "Vendor B",
        })

        const result = await repository.findByName("Project Alpha")
        expect(result).toBeTruthy()
        expect(result?.name).toBe("Project Alpha")
        expect(result?.location).toBe("Location A")
      })

      it("should return null when name not found", async () => {
        const result = await repository.findByName("Nonexistent Project")
        expect(result).toBeNull()
      })

      it("should handle case-insensitive matching", async () => {
        ;(mockPrisma as any).addProject({
          name: "PROJECT ALPHA",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
        })

        const result = await repository.findByName("project alpha")
        expect(result).toBeTruthy()
        expect(result?.name).toBe("PROJECT ALPHA")
      })
    })

    describe("findByIds", () => {
      it("should find multiple projects by IDs", async () => {
        const project1 = (mockPrisma as any).addProject({
          name: "Project 1",
          location: "Location 1",
          retainage: 5.0,
          vendor: "Vendor 1",
        })
        const project2 = (mockPrisma as any).addProject({
          name: "Project 2",
          location: "Location 2",
          retainage: 10.0,
          vendor: "Vendor 2",
        })
        ;(mockPrisma as any).addProject({
          name: "Project 3",
          location: "Location 3",
          retainage: 15.0,
          vendor: "Vendor 3",
        })

        const results = await repository.findByIds([project1.id, project2.id])
        expect(results).toHaveLength(2)
        expect(results.map((r) => r.id).sort()).toEqual([project1.id, project2.id].sort())
      })

      it("should return empty array when no IDs match", async () => {
        const results = await repository.findByIds([999, 1000])
        expect(results).toHaveLength(0)
      })

      it("should return partial results when some IDs match", async () => {
        const project1 = (mockPrisma as any).addProject({
          name: "Project 1",
          location: "Location 1",
          retainage: 5.0,
          vendor: "Vendor 1",
        })

        const results = await repository.findByIds([project1.id, 999])
        expect(results).toHaveLength(1)
        expect(results[0].id).toBe(project1.id)
      })
    })

    describe("findByCustomerId", () => {
      it("should find projects by customer ID", async () => {
        const customerId = 1
        ;(mockPrisma as any).addProject({
          name: "Project 1",
          location: "Location 1",
          retainage: 5.0,
          vendor: "Vendor 1",
          customer_id: customerId,
        })
        ;(mockPrisma as any).addProject({
          name: "Project 2",
          location: "Location 2",
          retainage: 10.0,
          vendor: "Vendor 2",
          customer_id: customerId,
        })
        ;(mockPrisma as any).addProject({
          name: "Project 3",
          location: "Location 3",
          retainage: 15.0,
          vendor: "Vendor 3",
          customer_id: 2,
        })

        const results = await repository.findByCustomerId(customerId)
        expect(results).toHaveLength(2)
        expect(results.every((r) => r.customer_id === customerId)).toBe(true)
      })

      it("should return empty array when no projects found for customer", async () => {
        const results = await repository.findByCustomerId(999)
        expect(results).toHaveLength(0)
      })
    })
  })
})
