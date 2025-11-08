"use client";
import { useEffect, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { JOB_TYPE_COLOR, normalizeJobType } from "@/components/calendar/colors";

type RawEvent = any;
type Event = {
  id?: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  jobType?: string; // expect one of: GUARDRAIL, FENCE, HANDRAIL, TEMP_FENCE, ATTENUATOR (or loose strings we'll normalize)
};

export default function CalendarView({ calendarId = "cme9wqhpe0000ht8sr5o3a6wf" }: { calendarId?: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const endpoints = useMemo(
    () => [
      `/api/calendars/${calendarId}/events`,
      "/api/events",
      "/api/calendar/events",
      "/api/calendars/default/events",
      "/api/calendars/primary/events",
    ],
    [calendarId]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      for (const url of endpoints) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) continue;
          const data = await res.json();
          if (cancelled) return;

          const list: Event[] = (Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : []).map(
            (e: RawEvent) => ({
              id: String(e.id ?? e.eventId ?? ""),
              title: String(e.title ?? e.name ?? "Untitled"),
              start: e.start ?? e.startsAt ?? e.startDate ?? e.date ?? "",
              end: e.end ?? e.endsAt ?? e.endDate ?? undefined,
              allDay: Boolean(e.allDay ?? e.isAllDay ?? false),
              // Accept multiple shapes then normalize
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
    return () => {
      cancelled = true;
    };
  }, [endpoints]);

  function renderEventContent(arg: any) {
    const raw = arg.event.extendedProps as Event;
    const jt = normalizeJobType(raw.jobType);
    const pal = JOB_TYPE_COLOR[jt];

    return {
      domNodes: [
        (() => {
          const container = document.createElement("div");
          container.className = "fc-gfc-event";
          container.style.backgroundColor = pal.glass;          // translucent block
          container.style.border = `1px solid ${pal.solid}22`;
          container.style.borderRadius = "10px";
          container.style.padding = "4px 8px";
          container.style.display = "flex";
          container.style.alignItems = "center";
          container.style.gap = "8px";
          container.style.backdropFilter = "blur(6px)";
          container.style.overflow = "hidden";

          const dot = document.createElement("span");           // left dot
          dot.style.width = "8px";
          dot.style.height = "8px";
          dot.style.borderRadius = "9999px";
          dot.style.backgroundColor = pal.dot;
          dot.style.boxShadow = `0 0 0 2px ${pal.solid}33`;
          container.appendChild(dot);

          const title = document.createElement("span");
          title.textContent = arg.event.title;
          title.style.whiteSpace = "nowrap";
          title.style.overflow = "hidden";
          title.style.textOverflow = "ellipsis";
          title.style.fontWeight = "600";
          container.appendChild(title);

          return container;
        })(),
      ],
    };
  }

  function eventDidMount(info: any) {
    // Disable FullCalendar's default blue
    info.el.style.backgroundColor = "transparent";
    info.el.style.border = "none";
    info.el.style.boxShadow = "none";
  }

  if (loading) return <div>Loading…</div>;

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
      initialView="dayGridMonth"
      timeZone="local"
      height="auto"
      events={events}
      eventContent={renderEventContent}
      eventDidMount={eventDidMount}
      displayEventTime={false}
      dayMaxEventRows
    />
  );
}
