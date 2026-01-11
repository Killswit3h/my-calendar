import { describe, it, expect, beforeEach } from "vitest"
import { ProjectController } from "@/server/controllers/ProjectController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithProject } from "../../utils/mockPrismaProject"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import { NextRequest } from "next/server"
import type { Prisma as PrismaTypes } from "@prisma/client"
import { Prisma } from "@prisma/client"

// Run the abstract controller tests with Project configuration
const abstractTests = createAbstractControllerTests<
  ProjectController,
  PrismaTypes.projectGetPayload<{}>,
  PrismaTypes.projectCreateInput,
  PrismaTypes.projectUpdateInput
>({
  controllerClass: ProjectController,
  modelName: "project",
  apiPath: "/api/projects",
  createValidInput: () => ({
    name: "Test Project",
    location: "Test Location",
    retainage: new Prisma.Decimal(5.0),
    vendor: "Test Vendor",
  }),
  createInvalidInput: () => ({
    name: "", // Invalid: empty name
    location: "Test Location",
    retainage: 5.0,
    vendor: "Test Vendor",
  }),
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
      status: data.status ?? "ACTIVE",
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: extendMockPrismaWithProject,
})

// Run abstract tests
describe("ProjectController", () => {
  // Execute all abstract controller tests
  abstractTests()

  // Project-specific controller tests
  describe("Custom Controller Behavior", () => {
    let mockPrisma: MockPrisma
    let controller: ProjectController

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithProject(mockPrisma)
      setMockPrisma(mockPrisma)
      controller = new ProjectController()
    })

    describe("handleGet - filtering", () => {
      it("should filter by name query parameter", async () => {
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
        ;(mockPrisma as any).addProject({
          name: "Alpha Project",
          location: "Location C",
          retainage: 15.0,
          vendor: "Vendor C",
        })

        const url = new URL("http://localhost:3000/api/projects?name=Alpha")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
        expect(data.every((item: any) => 
          item.name.toLowerCase().includes("alpha")
        )).toBe(true)
      })

      it("should filter by location query parameter", async () => {
        ;(mockPrisma as any).addProject({
          name: "Project 1",
          location: "Miami, FL",
          retainage: 5.0,
          vendor: "Vendor A",
        })
        ;(mockPrisma as any).addProject({
          name: "Project 2",
          location: "Tampa, FL",
          retainage: 10.0,
          vendor: "Vendor B",
        })
        ;(mockPrisma as any).addProject({
          name: "Project 3",
          location: "Orlando, FL",
          retainage: 15.0,
          vendor: "Vendor C",
        })

        const url = new URL("http://localhost:3000/api/projects?location=Miami")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(1)
        expect(data[0].location.toLowerCase()).toContain("miami")
      })

      it("should filter by vendor query parameter", async () => {
        ;(mockPrisma as any).addProject({
          name: "Project 1",
          location: "Location A",
          retainage: 5.0,
          vendor: "ABC Construction",
        })
        ;(mockPrisma as any).addProject({
          name: "Project 2",
          location: "Location B",
          retainage: 10.0,
          vendor: "XYZ Builders",
        })

        const url = new URL("http://localhost:3000/api/projects?vendor=ABC")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(1)
        expect(data[0].vendor.toLowerCase()).toContain("abc")
      })

      it("should filter by customer_id query parameter", async () => {
        const customerId = 1
        ;(mockPrisma as any).addProject({
          name: "Project 1",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
          customer_id: customerId,
        })
        ;(mockPrisma as any).addProject({
          name: "Project 2",
          location: "Location B",
          retainage: 10.0,
          vendor: "Vendor B",
          customer_id: 2,
        })

        const url = new URL(`http://localhost:3000/api/projects?customer_id=${customerId}`)
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(1)
        expect(data[0].customer_id).toBe(customerId)
      })

      it("should combine multiple filters", async () => {
        ;(mockPrisma as any).addProject({
          name: "Project Alpha",
          location: "Miami, FL",
          retainage: 5.0,
          vendor: "ABC Construction",
        })
        ;(mockPrisma as any).addProject({
          name: "Project Beta",
          location: "Miami, FL",
          retainage: 10.0,
          vendor: "XYZ Builders",
        })

        const url = new URL("http://localhost:3000/api/projects?name=Alpha&location=Miami")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(1)
        expect(data[0].name.toLowerCase()).toContain("alpha")
        expect(data[0].location.toLowerCase()).toContain("miami")
      })

      it("should return empty array when no matches found", async () => {
        ;(mockPrisma as any).addProject({
          name: "Project Alpha",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
        })

        const url = new URL("http://localhost:3000/api/projects?name=Nonexistent")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(0)
      })

      it("should return all projects when no filter provided", async () => {
        ;(mockPrisma as any).addProject({
          name: "Project 1",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
        })
        ;(mockPrisma as any).addProject({
          name: "Project 2",
          location: "Location B",
          retainage: 10.0,
          vendor: "Vendor B",
        })

        const url = new URL("http://localhost:3000/api/projects")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
      })
    })

    describe("handleGet - by ID", () => {
      it("should return 404 when project not found", async () => {
        const url = new URL("http://localhost:3000/api/projects/999")
        const req = new NextRequest(url)
        const context = { params: Promise.resolve({ id: "999" }) }
        const response = await controller.handleGet(req, context)

        expect(response.status).toBe(404)
        const data = await response.json()
        expect(data.error).toBeDefined()
      })

      it("should return project when found by ID", async () => {
        const project = (mockPrisma as any).addProject({
          name: "Test Project",
          location: "Test Location",
          retainage: 5.0,
          vendor: "Test Vendor",
        })

        const url = new URL(`http://localhost:3000/api/projects/${project.id}`)
        const req = new NextRequest(url)
        const context = { params: Promise.resolve({ id: String(project.id) }) }
        const response = await controller.handleGet(req, context)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.id).toBe(project.id)
        expect(data.name).toBe("Test Project")
        expect(data.location).toBe("Test Location")
        expect(data.vendor).toBe("Test Vendor")
      })
    })

    describe("handlePost - conflict handling", () => {
      it("should return 409 when name already exists", async () => {
        ;(mockPrisma as any).addProject({
          name: "Existing Project",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
        })

        const url = new URL("http://localhost:3000/api/projects")
        const req = new NextRequest(url, {
          method: "POST",
          body: JSON.stringify({ 
            name: "Existing Project",
            location: "Location B",
            retainage: 10.0,
            vendor: "Vendor B",
          }),
        })
        const response = await controller.handlePost(req)

        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.error).toBe("CONFLICT")
      })

      it("should return 409 when name already exists (case-insensitive)", async () => {
        ;(mockPrisma as any).addProject({
          name: "PROJECT ALPHA",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
        })

        const url = new URL("http://localhost:3000/api/projects")
        const req = new NextRequest(url, {
          method: "POST",
          body: JSON.stringify({ 
            name: "project alpha",
            location: "Location B",
            retainage: 10.0,
            vendor: "Vendor B",
          }),
        })
        const response = await controller.handlePost(req)

        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.error).toBe("CONFLICT")
      })

      it("should create project with defaults", async () => {
        ;(mockPrisma as any).addCustomer({ id: 1 })

        const url = new URL("http://localhost:3000/api/projects")
        const req = new NextRequest(url, {
          method: "POST",
          body: JSON.stringify({ 
            name: "New Project",
            location: "New Location",
            retainage: 5.0,
            vendor: "New Vendor",
          }),
        })
        const response = await controller.handlePost(req)

        expect(response.status).toBe(201)
        const data = await response.json()
        expect(data.name).toBe("New Project")
        expect(data.is_payroll).toBe(false)
        expect(data.is_EEO).toBe(false)
        expect(data.status).toBe("Not Started")
      })
    })

    describe("handlePatch - conflict handling", () => {
      it("should return 409 when updating to existing name", async () => {
        ;(mockPrisma as any).addProject({
          id: 1,
          name: "Project Alpha",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
        })
        const project2 = (mockPrisma as any).addProject({
          id: 2,
          name: "Project Beta",
          location: "Location B",
          retainage: 10.0,
          vendor: "Vendor B",
        })

        const url = new URL(`http://localhost:3000/api/projects/${project2.id}`)
        const req = new NextRequest(url, {
          method: "PATCH",
          body: JSON.stringify({ 
            name: "Project Alpha",
          }),
        })
        const context = { params: Promise.resolve({ id: String(project2.id) }) }
        const response = await controller.handlePatch(req, context)

        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.error).toBe("CONFLICT")
      })

      it("should update optional fields successfully", async () => {
        const project = (mockPrisma as any).addProject({
          name: "Test Project",
          location: "Test Location",
          retainage: 5.0,
          vendor: "Test Vendor",
        })

        const url = new URL(`http://localhost:3000/api/projects/${project.id}`)
        const req = new NextRequest(url, {
          method: "PATCH",
          body: JSON.stringify({ 
            is_payroll: true,
            status: "Completed",
          }),
        })
        const context = { params: Promise.resolve({ id: String(project.id) }) }
        const response = await controller.handlePatch(req, context)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.is_payroll).toBe(true)
        expect(data.status).toBe("Completed")
      })
    })

    describe("handleDelete", () => {
      it("should return 200 on successful deletion", async () => {
        const project = (mockPrisma as any).addProject({
          name: "To Be Deleted",
          location: "Location A",
          retainage: 5.0,
          vendor: "Vendor A",
        })

        const url = new URL(`http://localhost:3000/api/projects/${project.id}`)
        const req = new NextRequest(url, { method: "DELETE" })
        const context = { params: Promise.resolve({ id: String(project.id) }) }
        const response = await controller.handleDelete(req, context)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.message).toBeDefined()
      })
    })
  })
})
