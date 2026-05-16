import { NextRequest } from "next/server"
import { ProjectPhaseController } from "@/server/controllers/ProjectPhaseController"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const controller = new ProjectPhaseController()

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return controller.handleGet(req, context)
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return controller.handlePut(req, context)
}
