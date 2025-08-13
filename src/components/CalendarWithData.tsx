// src/components/CalendarWithData.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

type EventRecord = {
  id: string;
  title: string;
  description?: string | null;
  color?: string | null;
  startsAt: string; // ISO (start of day)
  endsAt: string;   // ISO (exclusive end, start of next day)
  allDay: boolean;  // always true in this scheduler
};

export default function CalendarWithData({ calendarId }: { calendarId: string }) {
  const token =
    (typeof window !== "undefined" && (window as any).__shareToken) || "";
  const calRef = useRef<FullCalendar | null>(null);

  const [mode, setMode] = useState<"dark" | "light">("dark");

  // Side panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [current, setCurrent] = useState<EventRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Copy/Paste state
  const [copied, setCopied] = useState<EventRecord | null>(null);
  const [pasteArmed, setPasteArmed] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  // Keyboard shortcuts: Ctrl/Cmd+C (copy current), Ctrl/Cmd+V (arm paste), Esc (cancel)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && key === "c") {
        if (current) {
          setCopied(stripId(current));
          setPasteArmed(true);
        }
      } else if (cmd && key === "v") {
        if (copied) setPasteArmed(true);
      } else if (key === "escape" && pasteArmed) {
        setPasteArmed(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, copied, pasteArmed]);

  const fetchEvents = async (info: any, success: any) => {
    const res = await fetch(
      `/api/calendars/${calendarId}/events?from=${info.startStr}&to=${info.endStr}${
        token ? `&token=${token}` : ""
      }`
    );
    const data = await res.json();
    success(
      data.map((e: any) => ({
        id: e.id,
        title: e.title,
        start: e.startsAt,
        end: e.endsAt,
        allDay: true,
        color: e.color || undefined,
        extendedProps: { description: e.description ?? "" },
      }))
    );
  };

  // Create all-day event on date click, OR paste if armed
  const handleDateClick = async (arg: any) => {
    const api = (arg.view.calendar as any);

    if (pasteArmed && copied) {
      // paste duplicate onto clicked day; preserve span & fields
      const start = startOfDay(arg.date);
      const span = spanDays(copied.startsAt, copied.endsAt); // number of days
      const end = addDays(start, span); // exclusive end

      await fetch(
        `/api/calendars/${calendarId}/events${token ? `?token=${token}` : ""}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: copied.title,
            description: copied.description || undefined,
            color: copied.color || undefined,
            startsAt: start.toISOString(),
            endsAt: end.toISOString(),
            allDay: true,
          }),
        }
      );
      api.refetchEvents?.();
      return; // keep paste armed for multi-paste; press Esc or use Cancel to stop
    }

    // Normal create flow
    const title = prompt("New project name?");
    if (!title) return;

    const color =
      prompt("Color? (e.g. #1e90ff or #22c55e). Leave blank for default") ||
      undefined;

    const start = startOfDay(arg.date);
    const end = addDays(start, 1); // one day by default (exclusive)

    await fetch(
      `/api/calendars/${calendarId}/events${token ? `?token=${token}` : ""}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          allDay: true,
          color,
        }),
      }
    );
    api.refetchEvents?.();
  };

  // Drag to another day
  const handleEventDrop = async (arg: any) => {
    await fetch(`/api/events/${arg.event.id}${token ? `?token=${token}` : ""}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: arg.event.start,
        endsAt: arg.event.end,
        allDay: true,
      }),
    });
  };

  // Resize across days by dragging edges
  const handleEventResize = async (arg: any) => {
    await fetch(`/api/events/${arg.event.id}${token ? `?token=${token}` : ""}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: arg.event.start,
        endsAt: arg.event.end,
        allDay: true,
      }),
    });
  };

  // Open side panel
  const handleEventClick = (clickInfo: any) => {
    const ev = clickInfo.event;
    const rec: EventRecord = {
      id: ev.id,
      title: ev.title,
      description: ev.extendedProps?.description ?? "",
      color: (ev.backgroundColor || ev.borderColor || "") || null,
      startsAt: (ev.start ?? new Date()).toISOString(),
      endsAt: (ev.end ?? addDays(ev.start ?? new Date(), 1)).toISOString(),
      allDay: true,
    };
    setCurrent(rec);
    setPanelOpen(true);
  };

  // Save from side panel
  const saveEvent = async () => {
    if (!current) return;
    setSaving(true);

    // Convert date-only fields back to ISO [start, endExclusive)
    const start = startOfDay(new Date(current.startsAt));
    const endInclusive = startOfDay(new Date(current.endsAt));
    const endExclusive = addDays(endInclusive, 1);

    await fetch(`/api/events/${current.id}${token ? `?token=${token}` : ""}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: current.title,
        description: current.description || undefined,
        color: current.color || undefined,
        startsAt: start.toISOString(),
        endsAt: endExclusive.toISOString(),
        allDay: true,
      }),
    });

    setSaving(false);
    setPanelOpen(false);
    (calRef.current as any)?.getApi?.().refetchEvents();
  };

  const deleteEvent = async () => {
    if (!current) return;
    if (!confirm("Delete this project?")) return;
    setSaving(true);
    await fetch(`/api/events/${current.id}${token ? `?token=${token}` : ""}`, {
      method: "DELETE",
    });
    setSaving(false);
    setPanelOpen(false);
    (calRef.current as any)?.getApi?.().refetchEvents();
  };

  // Copy helpers
  function copyCurrent() {
    if (!current) return;
    setCopied(stripId(current));
    setPasteArmed(true);
  }
  function cancelPaste() {
    setPasteArmed(false);
  }

  return (
    <div className="cal-wrapper">
      {/* Top bar */}
      <div className="cal-topbar">
        <div className="left">
          <button
            className="btn"
            onClick={() => (calRef.current as any)?.getApi?.().prev()}
          >
            ← Prev
          </button>
          <button
            className="btn"
            onClick={() => (calRef.current as any)?.getApi?.().today()}
          >
            Today
          </button>
          <button
            className="btn"
            onClick={() => (calRef.current as any)?.getApi?.().next()}
          >
            Next →
          </button>
        </div>

        <div className="right" style={{ gap: 8, display: "flex", alignItems: "center" }}>
          <button
            className="btn"
            disabled={!copied}
            title={copied ? `Ready: ${copied.title}` : "Copy an event first"}
            onClick={() => setPasteArmed(true)}
          >
            Paste
          </button>
          {pasteArmed && (
            <button className="btn ghost" onClick={cancelPaste}>
              Cancel Paste
            </button>
          )}
          <label className="switch" style={{ marginLeft: 8 }}>
            <input
              type="checkbox"
              checked={mode === "dark"}
              onChange={(e) => setMode(e.target.checked ? "dark" : "light")}
            />
            <span>Dark mode</span>
          </label>
        </div>
      </div>

      {/* Paste banner */}
      {pasteArmed && copied && (
        <div className="paste-banner">
          Copied <strong>{copied.title}</strong> — {spanDays(copied.startsAt, copied.endsAt)} day(s).
          Click a day to paste. <button className="link-btn" onClick={cancelPaste}>Cancel</button>
        </div>
      )}

      <FullCalendar
        ref={calRef as any}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "",
          center: "title",
          right: "",
        }}
        height="auto"
        dayMaxEventRows={16}
        selectable
        editable
        eventDurationEditable={true}
        eventResizableFromStart={true}
        events={fetchEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
      />

      {/* Side Drawer */}
      {panelOpen && current && (
        <div className="drawer" role="dialog" aria-modal="true">
          <div className="drawer-header">
            <h3>Edit Project</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={copyCurrent} title="Copy (Ctrl/Cmd+C)">
                Copy
              </button>
              <button className="icon" onClick={() => setPanelOpen(false)}>✕</button>
            </div>
          </div>

          <div className="drawer-body">
            <label>
              <span>Title</span>
              <input
                type="text"
                value={current.title}
                onChange={(e) => setCurrent({ ...current, title: e.target.value })}
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                rows={4}
                value={current.description ?? ""}
                onChange={(e) => setCurrent({ ...current, description: e.target.value })}
              />
            </label>

            <div className="row">
              <label className="half">
                <span>Color</span>
                <input
                  type="color"
                  value={current.color ?? "#1e90ff"}
                  onChange={(e) => setCurrent({ ...current, color: e.target.value })}
                />
              </label>
              <label className="half">
                <span>All day</span>
                <input type="checkbox" checked readOnly />
              </label>
            </div>

            <div className="row">
              <label className="half">
                <span>Start day</span>
                <input
                  type="date"
                  value={toDateInput(current.startsAt)}
                  onChange={(e) =>
                    setCurrent({ ...current, startsAt: fromDateInput(e.target.value) })
                  }
                />
              </label>
              <label className="half">
                <span>End day</span>
                <input
                  type="date"
                  value={toDateInput(addDays(new Date(current.endsAt), -1).toISOString())}
                  onChange={(e) => {
                    const picked = fromDateInput(e.target.value);
                    setCurrent({ ...current, endsAt: new Date(picked).toISOString() });
                  }}
                />
              </label>
            </div>
          </div>

          <div className="drawer-actions">
            <button className="btn danger" onClick={deleteEvent} disabled={saving}>
              Delete
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn ghost" onClick={() => setPanelOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn primary" onClick={saveEvent} disabled={saving}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Helpers ===== */
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}
// Difference in whole days using [start, endExclusive)
function spanDays(startISO: string, endISO: string) {
  const s = startOfDay(new Date(startISO)).getTime();
  const e = startOfDay(new Date(endISO)).getTime();
  const diff = Math.max(DAY_MS, e - s);
  return Math.round(diff / DAY_MS);
}
function toDateInput(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function fromDateInput(v: string) {
  const [y, m, d] = v.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  return dt.toISOString();
}
function stripId(e: EventRecord): EventRecord {
  // Copy everything except ID (for duplication)
  return {
    ...e,
    id: "copied", // not used on POST
  };
}

// Allow window.__shareToken
declare global {
  interface Window {
    __shareToken?: string;
  }
}
