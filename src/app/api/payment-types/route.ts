import { NextRequest } from "next/server"
import { PaymentTypeController } from "@/server/controllers/PaymentTypeController"

export const runtime = 'nodejs'
export const dynamic = "force-dynamic"
export const revalidate = 0

const controller = new PaymentTypeController()

export async function GET(req: NextRequest) {
  return controller.handleGet(req)
}

export async function POST(req: NextRequest) {
  return controller.handlePost(req)
}
