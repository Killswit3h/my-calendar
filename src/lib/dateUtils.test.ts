import { eventOverlapsLocalDay, weekDates, ymdLocal } from './dateUtils'

function assert(name: string, cond: boolean) {
  if (!cond) throw new Error('Assertion failed: ' + name)
  console.log('ok -', name)
}

// Test 1: Non-overlap and overlap around a day
{
  const day = new Date(2025, 0, 7) // Tue Jan 7, 2025 (local)
  // Event on Monday
  assert('monday-only not overlap tuesday', !eventOverlapsLocalDay({ start: new Date(2025,0,6,9), end: new Date(2025,0,6,17) }, day))
  // Event spanning Tue morning
  assert('tue-morning overlap', eventOverlapsLocalDay({ start: new Date(2025,0,7,8), end: new Date(2025,0,7,10) }, day))
  // Event crossing midnight into Tue
  assert('crossing midnight overlap', eventOverlapsLocalDay({ start: new Date(2025,0,6,23), end: new Date(2025,0,7,1) }, day))
  // Event crossing out of Tue into Wed
  assert('crossing out of day overlap', eventOverlapsLocalDay({ start: new Date(2025,0,7,23), end: new Date(2025,0,8,1) }, day))
}

// Test 2: All-day date-only strings (exclusive end)
{
  const mon = new Date(2025, 0, 6)
  const tue = new Date(2025, 0, 7)
  const wed = new Date(2025, 0, 8)
  // All-day Tue (start Tue, end Wed)
  const ev = { start: '2025-01-07', end: '2025-01-08', allDay: true as const }
  assert('all-day tuesday overlaps tue', eventOverlapsLocalDay(ev, tue))
  assert('all-day tuesday not overlap monday', !eventOverlapsLocalDay(ev, mon))
  assert('all-day tuesday not overlap wednesday', !eventOverlapsLocalDay(ev, wed))
}

// Test 3: Week computation (Mon start)
{
  const any = new Date(2025, 0, 7) // Tue
  const days = weekDates(any, 1)
  assert('week has 7 days', days.length === 7)
  console.log('week (Mon start):', days.map(ymdLocal).join(','))
}

console.log('dateUtils tests passed')

