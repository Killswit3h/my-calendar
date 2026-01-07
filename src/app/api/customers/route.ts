import { NextRequest } from "next/server"
import { CustomerController } from "@/server/controllers/CustomerController"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const controller = new CustomerController()

export async function GET(req: NextRequest) {
  return controller.handleGet(req)
}

export async function POST(req: NextRequest) {
  return controller.handlePost(req)
}
