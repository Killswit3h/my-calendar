"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

type Event = { id?: string; title: string; start: string; end?: string; allDay?: boolean; jobType?: string };

export default function CalendarView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const calRef = useRef<FullCalendar | null>(null);

  const endpoints = useMemo(
    () => [
      "/api/events",
      "/api/calendar/events",
      "/api/calendars/default/events",
      "/api/calendars/primary/events",
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      for (const url of endpoints) {
        try {
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) continue;
          const data = await r.json();
          if (cancelled) return;
          const list: Event[] = (Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : []).map(
            (e: any) => ({
              id: String(e.id ?? e.eventId ?? ""),
              title: String(e.title ?? e.name ?? "Untitled"),
              start: e.start ?? e.startsAt ?? e.startDate ?? e.date ?? "",
              end: e.end ?? e.endsAt ?? e.endDate ?? undefined,
              allDay: Boolean(e.allDay ?? e.isAllDay ?? false),
              jobType: e.jobType ?? e.type ?? e.category ?? e.projectType ?? e.tags ?? "",
            })
          );
          setEvents(list);
          setLoading(false);
          return;
        } catch {}
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [endpoints]);

  // Force calendar to recompute width on sidebar toggle or window resize
  useEffect(() => {
    const handler = () => {
      const api = calRef.current?.getApi?.();
      api?.updateSize();
    };
    const obs = new ResizeObserver(handler);
    const root = document.querySelector("main") || document.body;
    obs.observe(root as Element);
    window.addEventListener("resize", handler);
    return () => { obs.disconnect(); window.removeEventListener("resize", handler); };
  }, []);

  if (loading) return <div>Loading…</div>;

  return (
    <div className="relative z-0">
      <FullCalendar
        ref={calRef as any}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
        initialView="dayGridMonth"
        height="auto"
        contentHeight="auto"
        expandRows
        handleWindowResize
        windowResizeDelay={50}
        dayMaxEventRows
        events={events}
        displayEventTime={false}
      />
    </div>
  );
}