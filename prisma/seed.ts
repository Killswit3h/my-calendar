import { PrismaClient, PlacementType } from '@prisma/client'

const prisma = new PrismaClient()

const jobs = [
  { id: 'JOB-001', name: 'I-95 Temp Fence' },
  { id: 'JOB-002', name: 'Port Everglades Guardrail' },
] as const

const customers: { id: string; name: string }[] = [
  { id: 'cust-fdot', name: 'FDOT District 4' },
  { id: 'cust-port', name: 'Port Everglades Authority' },
] 

const projects: { id: string; name: string; customerId: string; calendarId: string }[] = [
  { id: 'proj-guardrail-i95', name: 'I-95 Guardrail Upgrade', customerId: customers[0]!.id, calendarId: jobs[0]!.id },
  { id: 'proj-port-safety', name: 'Terminal 7 Safety Rail', customerId: customers[1]!.id, calendarId: jobs[1]!.id },
] 

const employees = [
  { id: 'adrian-ramos', name: 'Adrian Ramos', hourlyRate: 25.0, defaultSection: PlacementType.YARD_SHOP },
  { id: 'ventura-hernandez', name: 'Ventura Hernandez', hourlyRate: 23.0, defaultSection: PlacementType.YARD_SHOP },
  { id: 'ramiro-valle', name: 'Ramiro Valle', hourlyRate: 18.0, defaultSection: PlacementType.YARD_SHOP },
  { id: 'troy-sturgil', name: 'Troy Sturgil', hourlyRate: 32.0, defaultSection: PlacementType.YARD_SHOP },
  { id: 'moises-varela', name: 'Moises Varela', hourlyRate: 28.0, defaultSection: PlacementType.YARD_SHOP },
] as const

const OCTOBER_YEAR = 2025
const oct = (day: number, hour = 12) => new Date(Date.UTC(OCTOBER_YEAR, 9, day, hour))

async function seedFinanceDemo() {
  await prisma.laborDaily.deleteMany()
  await prisma.eventAssignment.deleteMany()
  await prisma.hourlyRate.deleteMany()
  await prisma.eventQuantity.deleteMany()
  await prisma.inventoryCheckout.deleteMany()
  await prisma.event.deleteMany()
  await prisma.project.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.calendar.deleteMany()
  await prisma.employee.deleteMany()

  await prisma.calendar.createMany({
    data: jobs.map(job => ({ id: job.id, name: job.name })),
  })

  await prisma.customer.createMany({
    data: customers.map(customer => ({ ...customer, updatedAt: new Date() })),
  })

  await prisma.project.createMany({
    data: projects.map(project => ({
      id: project.id,
      name: project.name,
      customerId: project.customerId,
    })),
  })

  for (const emp of employees) {
    await prisma.employee.create({
      data: {
        id: emp.id,
        name: emp.name,
        hourlyRate: emp.hourlyRate,
        defaultSection: emp.defaultSection,
        hourlyRates: {
          create: [
            {
              effectiveDate: new Date(`${OCTOBER_YEAR}-09-01T00:00:00.000Z`),
              rate: emp.hourlyRate,
            },
            ...(emp.id === 'troy-sturgil'
              ? [
                  {
                    effectiveDate: new Date(`${OCTOBER_YEAR}-10-15T00:00:00.000Z`),
                    rate: 34.5,
                  },
                ]
              : []),
          ],
        },
      },
    })
  }

  const events = await prisma.$transaction([
    prisma.event.create({
      data: {
        id: 'evt-101',
        calendarId: jobs[0]!.id,
        projectId: projects[0]!.id,
        customerId: projects[0]!.customerId,
        title: 'I-95 Night Shift',
        startsAt: oct(7, 22),
        endsAt: oct(10, 10),
      },
    }),
    prisma.event.create({
      data: {
        id: 'evt-102',
        calendarId: jobs[0]!.id,
        projectId: projects[0]!.id,
        customerId: projects[0]!.customerId,
        title: 'I-95 Day Shift',
        startsAt: oct(14, 12),
        endsAt: oct(18, 12),
      },
    }),
    prisma.event.create({
      data: {
        id: 'evt-201',
        calendarId: jobs[1]!.id,
        projectId: projects[1]!.id,
        customerId: projects[1]!.customerId,
        title: 'Port Everglades Rail',
        startsAt: oct(21, 11),
        endsAt: oct(24, 23),
      },
    }),
  ])

  const defaultAssignments = [
    { eventId: events[0]!.id, employeeId: 'adrian-ramos' },
    { eventId: events[0]!.id, employeeId: 'ventura-hernandez' },
    { eventId: events[0]!.id, employeeId: 'ramiro-valle' },
    { eventId: events[1]!.id, employeeId: 'adrian-ramos' },
    { eventId: events[1]!.id, employeeId: 'ventura-hernandez' },
    { eventId: events[1]!.id, employeeId: 'ramiro-valle' },
    { eventId: events[2]!.id, employeeId: 'troy-sturgil' },
    { eventId: events[2]!.id, employeeId: 'moises-varela' },
  ]

  await prisma.eventAssignment.createMany({
    data: defaultAssignments.map(a => ({
      id: `${a.eventId}-${a.employeeId}`,
      eventId: a.eventId,
      employeeId: a.employeeId,
    })),
  })

  await prisma.eventAssignment.createMany({
    data: [
      {
        id: 'evt-101-adrian-ramos-oct8',
        eventId: events[0]!.id,
        employeeId: 'adrian-ramos',
        dayOverride: new Date(`${OCTOBER_YEAR}-10-08T00:00:00.000Z`),
        hours: 10,
        note: 'Overtime night shift',
      },
      {
        id: 'evt-102-ramiro-valle-oct16',
        eventId: events[1]!.id,
        employeeId: 'ramiro-valle',
        dayOverride: new Date(`${OCTOBER_YEAR}-10-16T00:00:00.000Z`),
        hours: 6,
      },
      {
        id: 'evt-201-troy-sturgil-oct23',
        eventId: events[2]!.id,
        employeeId: 'troy-sturgil',
        dayOverride: new Date(`${OCTOBER_YEAR}-10-23T00:00:00.000Z`),
        hours: 9.5,
      },
    ],
  })

  console.log('Seeded finance labor demo data (projects, customers, events, assignments).')
}

async function main() {
  if (process.env.SEED_FINANCE !== '1') {
    console.log('SEED_FINANCE is not set to 1, skipping finance labor seed.')
    return
  }

  await seedFinanceDemo()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async err => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
