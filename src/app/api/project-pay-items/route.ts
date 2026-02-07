import { NextRequest } from "next/server"
import { ProjectPayItemController } from "@/server/controllers/ProjectPayItemController"

export const runtime = 'nodejs'
export const dynamic = "force-dynamic"
export const revalidate = 0

const controller = new ProjectPayItemController()

export async function GET(req: NextRequest) {
  return controller.handleGet(req)
}

export async function POST(req: NextRequest) {
  return controller.handlePost(req)
}
