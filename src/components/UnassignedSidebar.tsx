"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Employee } from "@/employees";
import type { EventInput } from "@fullcalendar/core";
import { weekDates, ymdLocal, eventOverlapsLocalDay } from "@/lib/dateUtils";
import { getYardForDate, addYard, removeYard } from "@/lib/yard";

type Props = {
  employees: Employee[];
  events: EventInput[];
  anyDateInView?: Date | null; // optional (for week mode)
  selectedDate?: Date | null;  // if provided, show only this day
  weekStartsOn?: 0 | 1; // 0=Sunday, 1=Monday (default)
  onQuickAdd?: (employeeId: string, date: Date) => void;
  onSetYard?: (employeeId: string, date: Date) => void;
};

function formatDayLabel(d: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(d);
}

export default function UnassignedSidebar({ employees, events, anyDateInView = null, selectedDate = null, weekStartsOn = 1, onQuickAdd }: Props) {
  const handleAdd = (empId: string, date: Date) => {
    if (onQuickAdd) onQuickAdd(empId, date);
    else console.log("QuickAdd", empId, ymdLocal(date));
  };

  const daysToShow = useMemo(() => {
    if (selectedDate) return [selectedDate];
    return anyDateInView ? weekDates(anyDateInView, weekStartsOn) : [];
  }, [selectedDate, anyDateInView, weekStartsOn]);

  // simple version counter to refresh when mutating yard store
  const [yardVersion, setYardVersion] = useState(0);
  const bump = () => setYardVersion(v => v + 1);

  // Map of dateKey -> Set of assigned employeeIds
  const assignedByDay = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!daysToShow.length) return map;
    const rangeStart = daysToShow[0];
    const rangeEnd = new Date(daysToShow[daysToShow.length - 1].getFullYear(), daysToShow[daysToShow.length - 1].getMonth(), daysToShow[daysToShow.length - 1].getDate() + 1);

    // Seed with Yard/Shop assignments first so they're treated as assigned
    for (const d of daysToShow) {
      const k = ymdLocal(d);
      const yardIds = getYardForDate(k);
      if (yardIds.length) {
        let s = map.get(k);
        if (!s) { s = new Set<string>(); map.set(k, s); }
        yardIds.forEach((id) => s!.add(id));
      }
    }

    for (const ev of events ?? []) {
      const ex = (ev.extendedProps as any) ?? {};
      const checklist = ex.checklist ?? null;
      const employeeIds: string[] = Array.isArray(checklist?.employees) ? checklist.employees : [];
      if (!employeeIds.length) continue;

      // Skip events fully outside the week window quickly
      const minimal = { start: ev.start as any, end: ev.end as any, allDay: !!ev.allDay };
      // Quick reject by range bounds using overlap with entire week
      const weekSpanOverlaps = (() => {
        // Sample a few days to quickly reject clearly outside events
        const pick = daysToShow.length >= 3 ? [daysToShow[0], daysToShow[Math.floor(daysToShow.length/2)], daysToShow[daysToShow.length-1]] : daysToShow;
        return pick.some(d => eventOverlapsLocalDay(minimal as any, d));
      })();
      if (!weekSpanOverlaps) {
        // Might still miss super long events that skip exact sample days, fallback to coarse bound check
        const evStart = minimal.start instanceof Date ? minimal.start : new Date(minimal.start);
        const evEnd = minimal.end instanceof Date ? minimal.end : new Date(minimal.end);
        if (evEnd <= rangeStart || evStart >= rangeEnd) continue;
      }

      for (const day of daysToShow) {
        if (eventOverlapsLocalDay(minimal as any, day)) {
          const k = ymdLocal(day);
          let s = map.get(k);
          if (!s) { s = new Set<string>(); map.set(k, s); }
          for (const id of employeeIds) s.add(id);
        }
      }
    }
    return map;
  }, [events, daysToShow, yardVersion]);

  const isEmpty = employees.length === 0;

  return (
    <div className="unassigned-sidebar" aria-label="Unassigned employees by day">
      <h3 className="sidebar-title">Unassigned Employees</h3>
      {!daysToShow.length ? (
        <div className="muted-sm">No week selected</div>
      ) : isEmpty ? (
        <div className="muted-sm">No employees</div>
      ) : (
        <div className="day-list" role="list">
          {daysToShow.map((d) => {
            const key = ymdLocal(d);
            const assigned = assignedByDay.get(key) ?? new Set<string>();
            const free = employees.filter((e) => !assigned.has(e.id));
            return (
              <div key={key} className="day-card" role="listitem" aria-label={`Unassigned for ${key}`}>
                <div className="day-header">
                  <div className="day-label">{formatDayLabel(d)}</div>
                  <div className="day-count" title="Free employees">{free.length ? `${free.length} free` : "All assigned"}</div>
                </div>
                <div className="section-card free-card">
                  <div className="section-title">Free Employees</div>
                  {free.length ? (
                    <div className="emp-list" role="list">
                      {free.map((e) => (
                        <div key={e.id} className="free-row" role="listitem">
                          <div className="emp-name">{e.firstName} {e.lastName}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted-sm">All assigned</div>
                  )}
                </div>
                {/* Yard/Shop table (per-day, stored locally) */}
                {selectedDate ? (
                  <div className="section-card yard-card">
                    <div className="yard-title">Yard/Shop</div>
                    <div className="yard-list" role="list">
                      {getYardForDate(key).length ? (
                        getYardForDate(key).map((id) => {
                          const emp = employees.find(e => e.id === id);
                          const label = emp ? `${emp.firstName} ${emp.lastName}` : id;
                          return (
                            <div key={id} className="yard-row" role="listitem">
                              <div className="emp-name">{label}</div>
                              <button className="btn tiny" onClick={() => { removeYard(key, id); bump(); try { window.dispatchEvent(new CustomEvent('yard-changed')); } catch {} }} aria-label={`Remove ${label} from Yard/Shop`}>
                                Remove
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="muted-xs">No one assigned</div>
                      )}
                    </div>
                    <div className="yard-row">
                      <select aria-label={`Add Yard/Shop employee for ${key}`} className="yard-select" defaultValue="">
                        <option value="" disabled>Select employee</option>
                        {free.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                        ))}
                      </select>
                      <button
                        className="btn tiny"
                        onClick={(e) => {
                          const sel = (e.currentTarget.previousSibling as HTMLSelectElement | null);
                          const val = sel?.value || '';
                          if (!val) return;
                          addYard(key, val);
                          sel!.value = '';
                          bump();
                          try { window.dispatchEvent(new CustomEvent('yard-changed')); } catch {}
                        }}
                      >Add</button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <style jsx>{`
        .unassigned-sidebar { display: grid; gap: 0.5rem; }
        .sidebar-title { font-size: 1rem; font-weight: 600; margin: 0 0 0.25rem; color: var(--text); }
        .day-list { display: grid; gap: 0.5rem; }
        .day-card { border: 1px solid var(--border); border-radius: 10px; background: var(--elev-2); padding: 0.5rem; }
        .day-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
        .day-label { font-weight: 600; color: var(--text); }
        .day-count { font-size: 0.75rem; background: #1e293b; color: #93c5fd; padding: 0.05rem 0.45rem; border-radius: 999px; border: 1px solid var(--border); }
        .emp-list { display: grid; gap: 0.25rem; max-height: 240px; overflow: auto; }
        .emp-row { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; align-items: center; }
        .free-row { display: block; }
        .emp-name { color: var(--text); font-size: 0.9rem; }
        .btn.tiny { font-size: 0.75rem; padding: 0.1rem 0.45rem; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text); }
        .btn.tiny:hover { filter: brightness(1.1); }
        .section-card { background: var(--card-2); border: 1px solid var(--border); border-radius: 10px; padding: 0.5rem; }
        .free-card { margin-bottom: 0.6rem; }
        .yard-card { margin-top: 0.6rem; }
        .section-title, .yard-title { font-size: 0.85rem; color: var(--text-dim); font-weight: 700; margin-bottom: 0.35rem; }
        .yard-row { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; align-items: center; }
        .yard-select { width: 100%; min-height: 34px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text); }
        .muted-xs { color: var(--muted); font-size: 0.75rem; }
      `}</style>
    </div>
  );
}
