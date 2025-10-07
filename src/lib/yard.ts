// Lightweight Yard/Shop assignments stored locally by date (YYYY-MM-DD)
// Structure: { [dateKey]: string[] } where string[] are employee IDs

const LS_KEY = 'yard.assignments.v1'

const DEFAULT_YARD_IDS = [
  'jony-baquedano-mendoza',
  'jose-santos-diaz',
  'edilberto-acuna',
  'gerardo-oliva',
  'jose-fernandez',
  'robert-gomez',
]

type YardMap = Record<string, string[]> & {
  __seededDefaults?: Record<string, boolean>
}

function ensureSeedTracker(map: YardMap): Record<string, boolean> {
  const tracker = map.__seededDefaults
  if (tracker && typeof tracker === 'object') return tracker
  const next: Record<string, boolean> = {}
  map.__seededDefaults = next
  return next
}

function load(): YardMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as YardMap
  } catch {}
  return {}
}

function save(map: YardMap): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(map)) } catch {}
}

export function getYardForDate(dateKey: string): string[] {
  const map = load()
  const tracker = ensureSeedTracker(map)
  const current = Array.isArray(map[dateKey]) ? [...map[dateKey]] : []

  const missing = DEFAULT_YARD_IDS.filter(id => !current.includes(id))
  if (missing.length) {
    const next = [...current, ...missing]
    map[dateKey] = next
    tracker[dateKey] = true
    save(map)
    return next.slice()
  }

  if (!tracker[dateKey]) {
    tracker[dateKey] = true
    map[dateKey] = current
    save(map)
  }

  return current
}

export function setYardForDate(dateKey: string, ids: string[]): void {
  const map = load()
  map[dateKey] = Array.from(new Set(ids))
  save(map)
}

export function addYard(dateKey: string, id: string): void {
  const map = load()
  const arr = Array.isArray(map[dateKey]) ? map[dateKey] : []
  if (!arr.includes(id)) arr.push(id)
  map[dateKey] = arr
  save(map)
}

export function removeYard(dateKey: string, id: string): void {
  const map = load()
  const arr = Array.isArray(map[dateKey]) ? map[dateKey] : []
  map[dateKey] = arr.filter((x) => x !== id)
  save(map)
}
