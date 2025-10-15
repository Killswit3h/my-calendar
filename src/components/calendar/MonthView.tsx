// components/calendar/MonthView.tsx
"use client";

import { addDays, endOfMonth, startOfMonth } from "date-fns";
import { clampToRange, inclusiveDaySpan } from "@/utils/dates";
import { dbgEventSpan } from "@/utils/eventDebug";

type CalEvent = {
  id: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  color?: string;
};

export default function MonthView({ monthDate, events }: { monthDate: Date; events: CalEvent[] }) {
  const monthStart = startOfMonth(monthDate);
  const firstGridDay = addDays(monthStart, -monthStart.getDay()); // Sunday start
  const days = Array.from({ length: 42 }, (_, i) => addDays(firstGridDay, i));

  // Precompute week rows with lane packing
  const weeks = Array.from({ length: 6 }, (_, w) => {
    const wkStart = addDays(firstGridDay, w * 7);
    const wkEnd = addDays(wkStart, 6);
    // Select events overlapping week
    const wkEvents = events.filter(e => {
      const { s, e: ee } = clampToRange(e.startsAt, e.endsAt, wkStart, addDays(wkEnd, 1));
      return s <= ee;
    }).map(e => {
      // Debug logging for event spanning
      const _ = dbgEventSpan(e);
      
      const { s, e: ee } = clampToRange(e.startsAt, e.endsAt, wkStart, addDays(wkEnd, 1));
      const startCol = Math.max(1, Math.floor((s.getTime() - wkStart.getTime()) / 86400000) + 1);
      const span = Math.min(7 - startCol + 1, inclusiveDaySpan(s, ee));
      return { id: e.id, title: e.title, startCol, span, color: e.color || undefined };
    });

    // Greedy lane packing
    const lanes: { endCol: number; items: typeof wkEvents }[] = [];
    const placed: Array<typeof wkEvents[number] & { lane: number }> = [];
    wkEvents.sort((a,b)=> a.startCol - b.startCol || b.span - a.span).forEach(ev => {
      let lane = lanes.findIndex(l => l.endCol <= ev.startCol);
      if (lane < 0) { lane = lanes.length; lanes.push({ endCol: 0, items: [] }); }
      lanes[lane].endCol = ev.startCol + ev.span;
      placed.push({ ...ev, lane });
    });

    return { wkStart, placed };
  });

  return (
    <div className="grid grid-cols-7 gap-px border border-neutral-700 bg-neutral-700">
      {days.map((d, i) => (
        <div key={i} className="min-h-28 bg-neutral-900 p-1 relative">
          <div className="text-[10px] opacity-70">{d.getDate()}</div>
          {/* render bars once per week in the first day cell */}
          {i % 7 === 0 && (() => {
            const row = weeks[Math.floor(i / 7)];
            return (
              <div className="absolute left-1 right-1 top-5">
                {Array.from(new Set(row.placed.map(p => p.lane))).map(lane => (
                  <div className="grid grid-cols-7 gap-1 mb-1" key={lane}>
                    {row.placed.filter(p => p.lane === lane).map(p => (
                      <div
                        key={p.id}
                        className="h-6 rounded px-2 text-[11px] truncate"
                        style={{
                          gridColumn: `${p.startCol} / span ${p.span}`,
                          background: p.color ?? "rgba(0,140,120,0.35)",
                          border: "1px solid rgba(0,140,120,0.7)",
                        }}
                        title={p.title}
                      >
                        {p.title}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
