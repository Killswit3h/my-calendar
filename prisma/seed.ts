import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

async function clearSeedTables() {
  await prisma.event_quantity.deleteMany()
  await prisma.event_assignment.deleteMany()
  await prisma.event.deleteMany()
  await prisma.project_pay_item.deleteMany()
  await prisma.project.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.pay_item.deleteMany()
  await prisma.payment_type.deleteMany()
  await prisma.scope_of_work.deleteMany()
}

async function main() {
  await clearSeedTables()

  const regular = await prisma.payment_type.create({
    data: { description: "Seed — Regular time" },
  })

  const earthwork = await prisma.scope_of_work.create({
    data: { description: "Seed — Earthwork" },
  })

  await prisma.scope_of_work.create({
    data: { description: "Seed — Paving (unused placeholder)" },
  })

  const [payItem101, payItem205] = await Promise.all([
    prisma.pay_item.create({
      data: {
        number: "SEED-101",
        description: "Sample clearing and grubbing (not real)",
        unit: "LS",
      },
    }),
    prisma.pay_item.create({
      data: {
        number: "SEED-205",
        description: "Sample asphalt tonnage (not real)",
        unit: "TON",
      },
    }),
  ])

  const customer = await prisma.customer.create({
    data: {
      name: "Seed Demo Transportation District",
      address: "100 Example Rd, Sample City, FL 00000",
      phone_number: "555-0100",
      email: "seed-demo-customer@example.invalid",
      notes: "Fictitious customer for local development only.",
    },
  })

  const [alice, bob] = await Promise.all([
    prisma.employee.create({
      data: {
        name: "Seed — Alice Example",
        wage_rate: new Prisma.Decimal("42.50"),
        start_date: new Date("2024-01-15"),
        phone_number: "555-0101",
        email: "seed-alice@example.invalid",
        notes: "Sample employee",
        role: "Operator",
        location: "Yard A",
      },
    }),
    prisma.employee.create({
      data: {
        name: "Seed — Bob Sample",
        wage_rate: new Prisma.Decimal("38.00"),
        start_date: new Date("2023-06-01"),
        phone_number: "555-0102",
        email: "seed-bob@example.invalid",
        notes: "Sample employee",
        role: "Laborer",
        location: "Yard B",
      },
    }),
  ])

  const project = await prisma.project.create({
    data: {
      customer_id: customer.id,
      code: "SEED-PRJ-001",
      name: "Seed — Demo Highway Segment (fake)",
      owner: "Seed PM",
      district: "Fictitious District 0",
      project_type: "Construction",
      location: "Milepost 0–1 (placeholder)",
      retainage: new Prisma.Decimal("10.00"),
      is_payroll: false,
      is_EEO: true,
      vendor: "Seed Vendor LLC",
      status: "In Progress",
    },
  })

  const [ppi1, ppi2] = await Promise.all([
    prisma.project_pay_item.create({
      data: {
        project_id: project.id,
        pay_item_id: payItem101.id,
        contracted_quantity: new Prisma.Decimal("1.00"),
        unit_rate: new Prisma.Decimal("125000.00"),
        notes: "Lump sum placeholder",
        begin_station: "0+00",
        end_station: "1+00",
        status: "Open",
        surveyed: false,
      },
    }),
    prisma.project_pay_item.create({
      data: {
        project_id: project.id,
        pay_item_id: payItem205.id,
        contracted_quantity: new Prisma.Decimal("500.00"),
        unit_rate: new Prisma.Decimal("95.00"),
        status: "Open",
        surveyed: true,
      },
    }),
  ])

  const invoice = await prisma.invoice.create({
    data: {
      number: "SEED-INV-1001",
      is_contract_invoice: false,
    },
  })

  const dayStart = new Date("2026-03-22T07:00:00.000Z")
  const dayEnd = new Date("2026-03-22T15:00:00.000Z")

  const workEvent = await prisma.event.create({
    data: {
      project_id: project.id,
      scope_of_work_id: earthwork.id,
      payment_type_id: regular.id,
      invoice_id: invoice.id,
      start_time: dayStart,
      end_time: dayEnd,
      is_day_shift: true,
      location: "Staging area (fake)",
      notes: "Seed calendar event — replace with real data later.",
    },
  })

  await prisma.event_assignment.createMany({
    data: [
      { event_id: workEvent.id, employee_id: alice.id },
      { event_id: workEvent.id, employee_id: bob.id },
    ],
  })

  await prisma.event_quantity.createMany({
    data: [
      {
        event_id: workEvent.id,
        project_pay_item_id: ppi1.id,
        quantity: new Prisma.Decimal("0.25"),
        notes: "Partial LS progress (fake)",
      },
      {
        event_id: workEvent.id,
        project_pay_item_id: ppi2.id,
        quantity: new Prisma.Decimal("12.50"),
        notes: "Tons placed (fake)",
      },
    ],
  })

  console.log("Seed complete: demo customer, project, employees, event, and related rows.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
