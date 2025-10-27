import { promises as fs } from 'fs'
import path from 'path'
import { Prisma, PrismaClient, type EventType, PlacementType } from '@prisma/client'
import {
  legacyRoster,
  payById,
  toLegacyId,
} from '@/data/employeeRoster'

const prisma = new PrismaClient()

type RawEvent = {
  id: string
  calendarId: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string
  allDay: boolean | null
  location?: string | null
  type?: string | null
}

type ArgOptions = {
  file: string
  calendarMap?: string
  aliasFile?: string
  wipe: boolean
}

const normalizeKey = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const parseArgs = (): ArgOptions => {
  const options: ArgOptions = {
    file: 'prod-events.json',
    wipe: true,
  }

  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue
    const [keyRaw, valueRaw] = arg.slice(2).split('=')
    const key = keyRaw.trim()
    const value = valueRaw?.trim()
    if (!key) continue
    if (key === 'file' && value) options.file = value
    if (key === 'calendar-map' && value) options.calendarMap = value
    if (key === 'alias-file' && value) options.aliasFile = value
    if (key === 'wipe') {
      if (value === 'false' || value === '0') options.wipe = false
      else options.wipe = true
    }
  }

  return options
}

const loadCalendarNames = async (mapPath: string | undefined) => {
  if (!mapPath) {
    const defaultPath = path.resolve(process.cwd(), 'prod-calendars.json')
    try {
      const buffer = await fs.readFile(defaultPath, 'utf8')
      return JSON.parse(buffer) as Record<string, string>
    } catch {
      return {}
    }
  }

  try {
    const buffer = await fs.readFile(path.resolve(process.cwd(), mapPath), 'utf8')
    return JSON.parse(buffer) as Record<string, string>
  } catch (error) {
    console.warn(`⚠️  Could not read calendar map at ${mapPath}:`, error)
    return {}
  }
}

const buildEmployeeLookups = () => {
  const fullNameMap = new Map<string, string>()
  const aliasMap = new Map<string, Set<string>>()
  const firstNameMap = new Map<string, Set<string>>()
  const lastNameMap = new Map<string, Set<string>>()

  for (const person of legacyRoster) {
    const id = toLegacyId(person.firstName, person.lastName)
    const fullName = `${person.firstName} ${person.lastName}`
    fullNameMap.set(normalizeKey(fullName), id)

    if (person.lastName) {
      const alias = `${person.firstName} ${person.lastName[0] ?? ''}`
      const aliasKey = normalizeKey(alias)
      const current = aliasMap.get(aliasKey) ?? new Set<string>()
      current.add(id)
      aliasMap.set(aliasKey, current)
    }

    const first = normalizeKey(person.firstName)
    const firstSet = firstNameMap.get(first) ?? new Set<string>()
    firstSet.add(id)
    firstNameMap.set(first, firstSet)

    const last = normalizeKey(person.lastName)
    if (last) {
      const lastSet = lastNameMap.get(last) ?? new Set<string>()
      lastSet.add(id)
      lastNameMap.set(last, lastSet)
    }
  }

  return { fullNameMap, aliasMap, firstNameMap, lastNameMap }
}

type AliasDefinition = Map<string, string[]>

const sanitize = (text: string) => ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `

const extractEmployeeIds = (
  description: string | null,
  lookups: ReturnType<typeof buildEmployeeLookups>,
  aliases: AliasDefinition,
) => {
  if (!description) return []
  const normalized = sanitize(description)
  const words = normalized.trim().split(/\s+/)
  const matches = new Set<string>()

  for (const [key, id] of lookups.fullNameMap.entries()) {
    if (normalized.includes(` ${key} `)) matches.add(id)
  }

  for (const [key, ids] of lookups.aliasMap.entries()) {
    if (normalized.includes(` ${key} `)) {
      ids.forEach(id => matches.add(id))
    }
  }

  for (const [key, ids] of lookups.firstNameMap.entries()) {
    if (normalized.includes(` ${key} `)) {
      ids.forEach(id => matches.add(id))
    }
  }

  for (const [key, ids] of lookups.lastNameMap.entries()) {
    if (normalized.includes(` ${key} `)) {
      ids.forEach(id => matches.add(id))
    }
  }

  for (let i = 0; i < words.length - 1; i++) {
    const compound = `${words[i]} ${words[i + 1]}`
    const aliasIds = lookups.aliasMap.get(compound)
    if (aliasIds) aliasIds.forEach(id => matches.add(id))
  }

  for (const [pattern, ids] of aliases.entries()) {
    const target = pattern.toLowerCase().trim()
    if (!target) continue
    if (normalized.includes(` ${target} `)) {
      ids.forEach(id => matches.add(id))
    }
  }

  return Array.from(matches)
}

const toDecimal = (value: number) => new Prisma.Decimal(value.toFixed(2))

async function wipeTables() {
  await prisma.$transaction([
    prisma.laborDaily.deleteMany(),
    prisma.eventAssignment.deleteMany(),
    prisma.hourlyRate.deleteMany(),
    prisma.eventQuantity.deleteMany(),
    prisma.event.deleteMany(),
    prisma.calendar.deleteMany(),
    prisma.employee.deleteMany(),
  ])
}

async function seedEmployees() {
  const employeeOps = legacyRoster.map(person => {
    const id = toLegacyId(person.firstName, person.lastName)
    const rate = payById[id] ?? 20
    return prisma.employee.upsert({
      where: { id },
      update: {
        name: `${person.firstName} ${person.lastName}`,
        active: true,
        defaultSection: PlacementType.YARD_SHOP,
        hourlyRate: toDecimal(rate),
      },
      create: {
        id,
        name: `${person.firstName} ${person.lastName}`,
        active: true,
        defaultSection: PlacementType.YARD_SHOP,
        hourlyRate: toDecimal(rate),
      },
    })
  })
  await prisma.$transaction(employeeOps)

  const rateOps = legacyRoster.map(person => {
    const id = toLegacyId(person.firstName, person.lastName)
    const rate = payById[id] ?? 20
    const effectiveDate = new Date('2025-01-01T00:00:00.000Z')
    return prisma.hourlyRate.upsert({
      where: {
        employeeId_effectiveDate: {
          employeeId: id,
          effectiveDate,
        },
      },
      update: { rate: toDecimal(rate) },
      create: {
        employeeId: id,
        effectiveDate,
        rate: toDecimal(rate),
      },
    })
  })
  await prisma.$transaction(rateOps)
}

const castEventType = (value: string | null | undefined): EventType | null => {
  if (!value) return null
  const upper = value.trim().toUpperCase()
  return (['FENCE', 'GUARDRAIL', 'TEMP_FENCE', 'HANDRAIL', 'ATTENUATOR'] as EventType[]).includes(upper as EventType)
    ? (upper as EventType)
    : null
}

async function importEvents(
  events: RawEvent[],
  calendarNames: Record<string, string>,
  aliases: AliasDefinition,
) {
  const lookups = buildEmployeeLookups()
  const calendars = new Set(events.map(event => event.calendarId))

  for (const calendarId of calendars) {
    const name = calendarNames[calendarId] ?? calendarId
    await prisma.calendar.upsert({
      where: { id: calendarId },
      update: { name },
      create: { id: calendarId, name },
    })
  }

  const unmatchedEmployees = new Set<string>()
  let assignmentsCreated = 0

  for (const raw of events) {
    const startsAt = new Date(raw.startsAt)
    const endsAt = new Date(raw.endsAt)

    const employeeIds = extractEmployeeIds(raw.description, lookups, aliases)
    if (!employeeIds.length && raw.description) {
      unmatchedEmployees.add(raw.description)
    }

    const checklistValue = employeeIds.length ? ({ employees: employeeIds } as Prisma.InputJsonValue) : Prisma.JsonNull

    await prisma.event.upsert({
      where: { id: raw.id },
      update: {
        calendarId: raw.calendarId,
        title: raw.title || 'Untitled',
        description: raw.description,
        startsAt,
        endsAt,
        allDay: Boolean(raw.allDay),
        location: raw.location ?? null,
        type: castEventType(raw.type),
        shift: null,
        checklist: checklistValue,
      },
      create: {
        id: raw.id,
        calendarId: raw.calendarId,
        title: raw.title || 'Untitled',
        description: raw.description,
        startsAt,
        endsAt,
        allDay: Boolean(raw.allDay),
        location: raw.location ?? null,
        type: castEventType(raw.type),
        shift: null,
        checklist: checklistValue,
      },
    })

    for (const employeeId of employeeIds) {
      await prisma.eventAssignment.upsert({
        where: { id: `${raw.id}-${employeeId}` },
        update: {},
        create: {
          id: `${raw.id}-${employeeId}`,
          eventId: raw.id,
          employeeId,
        },
      })
      assignmentsCreated += 1
    }
  }

  if (unmatchedEmployees.size) {
    console.warn('⚠️  Some descriptions did not map cleanly to employees. Review and adjust manually:')
    for (const desc of unmatchedEmployees) {
      console.warn(`  - ${desc.replace(/\s+/g, ' ').trim()}`)
    }
  }

  return assignmentsCreated
}

async function main() {
  const options = parseArgs()
  const filePath = path.resolve(process.cwd(), options.file)
  const calendarNames = await loadCalendarNames(options.calendarMap)
  const aliasDefinitions: AliasDefinition = new Map()
  if (options.aliasFile) {
    try {
      const aliasBuffer = await fs.readFile(path.resolve(process.cwd(), options.aliasFile), 'utf8')
      const parsed = JSON.parse(aliasBuffer) as Record<string, string[] | string>
      for (const [key, value] of Object.entries(parsed)) {
        const list = Array.isArray(value) ? value : [value]
        aliasDefinitions.set(key.toLowerCase().trim(), list)
      }
    } catch (error) {
      console.warn(`⚠️  Could not read alias file at ${options.aliasFile}:`, error)
    }
  }

  const buffer = await fs.readFile(filePath, 'utf8')
  const rawEvents = JSON.parse(buffer) as RawEvent[]

  if (!Array.isArray(rawEvents) || !rawEvents.length) {
    throw new Error(`No events found in ${filePath}`)
  }

  if (options.wipe) {
    console.log('🧹 Clearing existing events, assignments, employees, and labor rows...')
    await wipeTables()
  }

  console.log('👥 Seeding employee roster with hourly rates...')
  await seedEmployees()

  console.log(`📥 Importing ${rawEvents.length} events from ${options.file}...`)
  const assignmentsCount = await importEvents(rawEvents, calendarNames, aliasDefinitions)

  console.log('✅ Import complete:')
  console.log(`   • Events inserted: ${rawEvents.length}`)
  console.log(`   • Employees seeded: ${legacyRoster.length}`)
  console.log(`   • Assignments created: ${assignmentsCount}`)
  console.log('Run `npx tsx scripts/build-labor-daily.ts --start YYYY-MM-DD --end YYYY-MM-DD` to populate daily costs.')
}

main()
  .catch(error => {
    console.error('Import failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
