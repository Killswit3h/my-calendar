import { payById } from "@/data/employeeRoster"

export const CALENDAR_ID = "cme9wqhpe0000ht8sr5o3a6wf"

export type CalendarEvent = {
  id: string
  title: string
  startsAt: string
  endsAt: string
  allDay: boolean
  /** Whether this event counts for payroll */
  payroll?: boolean
  checklist?: {
    employees?: string[]
    employeePay?: Record<string, string>
  } | null
}

export type DayEntry = {
  ymd: string
  date: Date
  eventTitle: string
  payroll: boolean
  pay: number
  isEstimated: boolean
}

const MOCK_JOBS = [
  { title: "SR-836 Shoulder Retrofit",  payroll: true },
  { title: "I-95 Express Phase 3C",     payroll: false },
  { title: "NW 7th Ave Guardrail",      payroll: true },
  { title: "Palmetto Xwy Fence",        payroll: true },
  { title: "US-1 Attenuator Install",   payroll: false },
]

const MOCK_CREW: Array<{ id: string; pay: number }> = [
  { id: "adrian-ramos",        pay: (payById["adrian-ramos"]        ?? 0) * 8 },
  { id: "carlos-manuel-diaz",  pay: (payById["carlos-manuel-diaz"]  ?? 0) * 8 },
  { id: "christopher-jones",   pay: (payById["christopher-jones"]   ?? 0) * 8 },
  { id: "edilberto-acuna",     pay: (payById["edilberto-acuna"]     ?? 0) * 8 },
  { id: "esteban-sanchez",     pay: (payById["esteban-sanchez"]     ?? 0) * 8 },
  { id: "fabian-marquez",      pay: (payById["fabian-marquez"]      ?? 0) * 8 },
  { id: "gerardo-oliva",       pay: (payById["gerardo-oliva"]       ?? 0) * 8 },
  { id: "jaime-vergara",       pay: (payById["jaime-vergara"]       ?? 0) * 8 },
  { id: "jose-fernandez",      pay: (payById["jose-fernandez"]      ?? 0) * 8 },
  { id: "moises-varela",       pay: (payById["moises-varela"]       ?? 0) * 8 },
  { id: "nicholas-sieber",     pay: (payById["nicholas-sieber"]     ?? 0) * 8 },
  { id: "noel-venero",         pay: (payById["noel-venero"]         ?? 0) * 8 },
]

/** Generates mock Mon–Fri events for a given Monday date. */
export function buildMockEvents(monday: Date): CalendarEvent[] {
  return [0, 1, 2, 3, 4].map(dayOffset => {
    const date = new Date(monday)
    date.setDate(date.getDate() + dayOffset)
    const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    const job = MOCK_JOBS[dayOffset % MOCK_JOBS.length]!
    // Rotate crew so later days have a slightly smaller crew
    const dayCrewIds = MOCK_CREW.slice(0, MOCK_CREW.length - dayOffset).map(e => e.id)
    const employeePay: Record<string, string> = {}
    dayCrewIds.forEach(id => {
      const found = MOCK_CREW.find(e => e.id === id)
      if (found) employeePay[id] = String(found.pay)
    })
    return {
      id: `mock-${ymd}`,
      title: job.title,
      startsAt: `${ymd}T00:00:00.000Z`,
      endsAt: `${ymd}T23:59:59.000Z`,
      allDay: true,
      payroll: job.payroll,
      checklist: { employees: dayCrewIds, employeePay },
    }
  })
}

/** Fetches events for a week from the calendar API, falling back to mock data on failure. */
export async function fetchWeekEvents(monday: Date, sunday: Date): Promise<CalendarEvent[]> {
  const end = new Date(sunday)
  end.setDate(end.getDate() + 1)
  try {
    const url = `/api/calendars/${CALENDAR_ID}/events?start=${encodeURIComponent(monday.toISOString())}&end=${encodeURIComponent(end.toISOString())}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("not ok")
    const data = await res.json()
    const items: CalendarEvent[] = Array.isArray(data) ? data : (data.events ?? data.items ?? [])
    return items
  } catch {
    return buildMockEvents(monday)
  }
}

/** Builds the per-day breakdown for a single employee from a list of events. */
export function buildEmployeeDays(
  empId: string,
  events: CalendarEvent[],
): DayEntry[] {
  const entries: DayEntry[] = []

  for (const ev of events) {
    const empIds: string[] = ev.checklist?.employees ?? []
    if (!empIds.includes(empId)) continue

    const ymd = ev.startsAt.slice(0, 10)
    const [y, m, d] = ymd.split("-").map(Number)
    const date = new Date(y, m - 1, d)

    const payVal = ev.checklist?.employeePay?.[empId]
    let pay: number
    let isEstimated: boolean

    if (payVal !== undefined && payVal !== "") {
      const parsed = parseFloat(payVal)
      pay = isNaN(parsed) ? 0 : parsed
      isEstimated = false
    } else {
      pay = (payById[empId] ?? 0) * 8
      isEstimated = true
    }

    entries.push({
      ymd,
      date,
      eventTitle: ev.title,
      payroll: ev.payroll ?? false,
      pay,
      isEstimated,
    })
  }

  // Sort chronologically
  entries.sort((a, b) => a.ymd.localeCompare(b.ymd))
  return entries
}
