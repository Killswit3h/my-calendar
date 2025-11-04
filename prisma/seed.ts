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
const addDays = (base: Date, days: number) => {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

async function seedTodos() {
  await prisma.todoStep.deleteMany()
  await prisma.todo.deleteMany()
  await prisma.todoList.deleteMany()

  const lists = [
    { id: 'todo-my-day', name: 'My Day', color: 'amber', icon: 'Sun', isSmart: true, position: 0 },
    { id: 'todo-important', name: 'Important', color: 'amber', icon: 'Star', isSmart: true, position: 1 },
    { id: 'todo-planned', name: 'Planned', color: 'blue', icon: 'Calendar', isSmart: true, position: 2 },
    { id: 'todo-tasks', name: 'Tasks', color: 'slate', icon: 'ListTodo', isSmart: false, position: 3 },
    { id: 'todo-project-launch', name: 'Project Launch', color: 'emerald', icon: 'Flag', isSmart: false, position: 4 },
    { id: 'todo-yard-ops', name: 'Yard Ops', color: 'orange', icon: 'Wrench', isSmart: false, position: 5 },
  ]

  for (const list of lists) {
    await prisma.todoList.create({
      data: {
        id: list.id,
        name: list.name,
        color: list.color,
        icon: list.icon,
        isSmart: list.isSmart,
        position: list.position,
      },
    })
  }

  const today = new Date()
  const todos = [
    {
      id: 'todo-kickoff-agenda',
      listId: 'todo-project-launch',
      title: 'Build kickoff agenda',
      note: 'Outline project objectives and milestone review.',
      isImportant: true,
      myDay: true,
      dueAt: addDays(today, 1),
      position: 0,
      steps: [
        { title: 'Confirm attendees', position: 0 },
        { title: 'Draft talking points', position: 1 },
      ],
    },
    {
      id: 'todo-risk-register',
      listId: 'todo-project-launch',
      title: 'Publish risk register',
      note: 'Add top 5 launch blockers before review.',
      isImportant: false,
      myDay: false,
      dueAt: addDays(today, 3),
      position: 1,
      steps: [
        { title: 'Collect input from leads', position: 0 },
        { title: 'Share draft with PM', position: 1 },
      ],
    },
    {
      id: 'todo-yard-supplies',
      listId: 'todo-yard-ops',
      title: 'Stage guardrail supplies',
      note: 'Pull inventory for next week installs.',
      isImportant: true,
      myDay: false,
      dueAt: addDays(today, 2),
      position: 0,
      steps: [
        { title: 'Check battery levels', position: 0 },
        { title: 'Tag pallets for delivery', position: 1 },
      ],
    },
    {
      id: 'todo-truck-maintenance',
      listId: 'todo-yard-ops',
      title: 'Schedule truck maintenance',
      note: 'Coordinate downtime with dispatch.',
      isImportant: false,
      myDay: false,
      dueAt: addDays(today, 7),
      position: 1,
      steps: [
        { title: 'Review mileage logs', position: 0 },
        { title: 'Book shop slot', position: 1 },
      ],
    },
  ]

  for (const todo of todos) {
    await prisma.todo.create({
      data: {
        id: todo.id,
        title: todo.title,
        note: todo.note,
        isImportant: todo.isImportant,
        myDay: todo.myDay,
        dueAt: todo.dueAt,
        position: todo.position,
        listId: todo.listId,
        steps: {
          create: todo.steps.map(step => ({
            title: step.title,
            position: step.position,
          })),
        },
      },
    })
  }

  console.log('Seeded planner todos demo data.')
}

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
  await seedTodos()

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
