"use client"

import Link from "next/link"
import { ChevronRight, DollarSign, CalendarDays, TrendingUp } from "lucide-react"

// ── Date helpers ────────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"]
const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatWeekRange(monday: Date, sunday: Date): string {
  const sameMonth = monday.getMonth() === sunday.getMonth()
  const start = `${monday.getDate()}`
  const end = sameMonth
    ? `${sunday.getDate()}`
    : `${SHORT_MONTH[sunday.getMonth()]} ${sunday.getDate()}`
  return `${SHORT_MONTH[monday.getMonth()]} ${start} – ${end}`
}

type WeekEntry  = { monday: Date; sunday: Date }
type MonthGroup = { monthIdx: number; year: number; label: string; weeks: WeekEntry[] }

function getWeeksUpToToday(): WeekEntry[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const jan1 = new Date(year, 0, 1)
  let cursor = getMondayOfWeek(jan1)
  if (cursor.getFullYear() < year) cursor = addDays(cursor, 7)
  const weeks: WeekEntry[] = []
  while (cursor <= today) {
    const sunday = addDays(cursor, 6)
    weeks.push({ monday: new Date(cursor), sunday })
    cursor = addDays(cursor, 7)
  }
  weeks.reverse()
  return weeks
}

function groupByMonth(weeks: WeekEntry[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>()
  for (const w of weeks) {
    const key = `${w.sunday.getFullYear()}-${w.sunday.getMonth()}`
    if (!map.has(key)) {
      map.set(key, {
        monthIdx: w.sunday.getMonth(),
        year: w.sunday.getFullYear(),
        label: `${MONTHS[w.sunday.getMonth()]} ${w.sunday.getFullYear()}`,
        weeks: [],
      })
    }
    map.get(key)!.weeks.push(w)
  }
  return Array.from(map.values())
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const weeks  = getWeeksUpToToday()
  const groups = groupByMonth(weeks)
  const today  = new Date()
  const currentMondayYMD = toYMD(getMondayOfWeek(today))

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-8">

        {/* ── Hero header ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[rgba(23,23,23,0.5)] p-6 shadow-[0_20px_60px_rgba(3,6,23,0.45)] backdrop-blur-xl">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl" />

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
                  <DollarSign className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                    GFC Operations
                  </p>
                  <h1 className="mt-0.5 text-3xl font-bold text-white">Payroll</h1>
                </div>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {today.getFullYear()}
              </span>
            </div>

            {/* Stat cards */}
            <div className="relative mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Weeks Logged
                </div>
                <p className="mt-1.5 text-2xl font-bold text-white">{weeks.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Avg. Weekly
                </div>
                <p className="mt-1.5 text-2xl font-bold text-white/30">—</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <DollarSign className="h-3.5 w-3.5" />
                  YTD Est.
                </div>
                <p className="mt-1.5 text-2xl font-bold text-white/30">—</p>
              </div>
            </div>
        </div>

      {/* ── Week list ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {groups.map(group => (
            <div key={group.label}>
              <div className="mb-2 flex items-center gap-3 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                  {group.label}
                </p>
                <div className="flex-1 border-t border-white/10" />
                <span className="text-xs text-white/25">
                  {group.weeks.length} week{group.weeks.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(23,23,23,0.3)] shadow-[0_8px_32px_rgba(3,6,23,0.3)] backdrop-blur-sm">
                {group.weeks.map(({ monday, sunday }, idx) => {
                  const ymd       = toYMD(monday)
                  const label     = formatWeekRange(monday, sunday)
                  const isCurrent = ymd === currentMondayYMD
                  const isLast    = idx === group.weeks.length - 1

                  return (
                    <Link
                      key={ymd}
                      href={`/payroll/${ymd}`}
                      className={[
                        "group flex items-center justify-between px-5 py-3.5 transition",
                        "hover:bg-white/5",
                        !isLast ? "border-b border-white/10" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            "h-2 w-2 rounded-full flex-shrink-0 transition",
                            isCurrent
                              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                              : "bg-white/10",
                          ].join(" ")}
                        />
                        <div>
                          <span className="text-sm font-medium text-white">{label}</span>
                          {isCurrent && (
                            <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/25 transition group-hover:text-white/60" />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

    </div>
  )
}
