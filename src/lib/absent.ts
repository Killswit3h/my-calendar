// Lightweight "No Work" (absent) assignments stored locally by date (YYYY-MM-DD)
// Structure: { [dateKey]: string[] } where string[] are employee IDs

const LS_KEY = 'absent.assignments.v1'

type AbsentMap = Record<string, string[]>

function load(): AbsentMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as AbsentMap
  } catch {}
  return {}
}

function save(map: AbsentMap): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(map)) } catch {}
}

export function getAbsentForDate(dateKey: string): string[] {
  const map = load()
  const arr = map[dateKey]
  return Array.isArray(arr) ? arr.slice() : []
}

export function setAbsentForDate(dateKey: string, ids: string[]): void {
  const map = load()
  map[dateKey] = Array.from(new Set(ids))
  save(map)
}

export function addAbsent(dateKey: string, id: string): void {
  const map = load()
  const arr = Array.isArray(map[dateKey]) ? map[dateKey] : []
  if (!arr.includes(id)) arr.push(id)
  map[dateKey] = arr
  save(map)
}

export function removeAbsent(dateKey: string, id: string): void {
  const map = load()
  const arr = Array.isArray(map[dateKey]) ? map[dateKey] : []
  map[dateKey] = arr.filter((x) => x !== id)
  save(map)
  
  // Dispatch custom event for immediate UI updates
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('yard-changed', { 
        detail: { dateKey, action: 'remove', employeeId: id } 
      }))
    } catch {}
  }
}

