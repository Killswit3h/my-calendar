import { NextResponse } from "next/server"
import customers from "@/data/customers.json"
import { prisma } from "@/lib/db"
import { normalizeCustomerName } from "@/lib/customers"

export const runtime = 'nodejs'

export async function POST() {
  const names = Array.isArray(customers) ? customers as string[] : []
  let inserted = 0, skipped = 0
  for (const raw of names) {
    const { display } = normalizeCustomerName(String(raw || ""))
    if (!display) { skipped++; continue }
    const existing = await prisma.customer.findFirst({ where: { name: { equals: display, mode: 'insensitive' } }, select: { id: true } })
    if (existing) { skipped++; continue }
    await prisma.customer.create({ data: { name: display } })
    inserted++
  }
  return NextResponse.json({ ok: true, inserted, skipped, total: names.length })
}

