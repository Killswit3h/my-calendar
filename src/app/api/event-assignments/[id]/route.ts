import { NextRequest } from "next/server"
import { EventAssignmentController } from "@/server/controllers/EventAssignmentController"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const controller = new EventAssignmentController()

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return controller.handleGet(req, context)
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return controller.handlePatch(req, context)
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return controller.handleDelete(req, context)
}
