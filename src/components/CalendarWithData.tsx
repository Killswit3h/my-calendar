"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

// Event type → label + color (derived, not user-entered)
const TYPE_OPTIONS = [
  { key: "GUARDRAIL", label: "Guardrail", color: "#16a34a" },   // green
  { key: "FENCE", label: "Fence", color: "#f97316" },           // orange
  { key: "TEMP_FENCE", label: "Temporary Fence", color: "#facc15" }, // yellow
  { key: "HANDRAIL", label: "Handrail", color: "#2563eb" },     // blue
  { key: "ATTENUATOR", label: "Attenuator", color: "#ef4444" }, // red
] as const;

function colorForType(type?: string | null) {
  const o = TYPE_OPTIONS.find((t) => t.key === type);
  return o?.color ?? "#3b82f6"; // default blue
}

type CalEvent = {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  type?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
};

export default function CalendarWithData({ calendarId }: { calendarId: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CalEvent | null>(null);

  // draft fields
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftType, setDraftType] = useState<string>("GUARDRAIL");
  const [draftStarts, setDraftStarts] = useState<string>("");
  const [draftEnds, setDraftEnds] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const calendarRef = useRef<FullCalendar>(null);

  // theme toggle
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [theme]);

  // fetch events
  const fetchEvents = async (info: any, success: any, failure: any) => {
    try {
      const res = await fetch(
        `/api/calendars/${calendarId}/events?from=${info.startStr}&to=${info.endStr}${
          (window as any).__shareToken ? `&token=${(window as any).__shareToken}` : ""
        }`
      );
      if (!res.ok) throw new Error(await res.text());
      const data: CalEvent[] = await res.json();
      success(
        data.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.startsAt,
          end: e.endsAt,
          allDay: true,
          color: colorForType(e.type),
          extendedProps: e,
        }))
      );
    } catch (err) {
      console.error(err);
      failure(err);
    }
  };

  // create from date click
  const handleDateClick = (arg: any) => {
    const start = new Date(arg.date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    setEditing(null);
    setDraftTitle("");
    setDraftDesc("");
    setDraftType("GUARDRAIL");
    setDraftStarts(toLocalInput(start));
    setDraftEnds(toLocalInput(end));
    setFile(null);
    setDrawerOpen(true);
  };

  // open existing
  const handleEventClick = (clickInfo: any) => {
    const e: CalEvent = clickInfo.event.extendedProps;
    setEditing(e);
    setDraftTitle(e.title);
    setDraftDesc(e.description || "");
    setDraftType(e.type || "GUARDRAIL");
    setDraftStarts(toLocalInput(new Date(e.startsAt)));
    setDraftEnds(toLocalInput(new Date(e.endsAt)));
    setFile(null);
    setDrawerOpen(true);
  };

  // resize / drag
  const handleEventResize = async (arg: any) => {
    await saveEvent(arg.event.id, {
      startsAt: arg.event.start,
      endsAt: arg.event.end,
    });
    refetch();
  };
  const handleEventDrop = handleEventResize;

  // helpers
  const refetch = () => {
    calendarRef.current?.getApi().refetchEvents();
  };

  async function saveNew() {
    const payload: any = {
      title: draftTitle || "(Untitled)",
      description: draftDesc || null,
      startsAt: new Date(draftStarts),
      endsAt: new Date(draftEnds),
      type: draftType,
    };

    if (file) {
      const b64 = await fileToBase64(file);
      payload.attachmentBase64 = b64.replace(/^data:.*;base64,/, "");
      payload.attachmentName = file.name;
      payload.attachmentType = file.type;
    }

    const res = await fetch(
      `/api/calendars/${calendarId}/events${
        (window as any).__shareToken ? `?token=${(window as any).__shareToken}` : ""
      }`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      alert("Failed to create event");
      return;
    }
    setDrawerOpen(false);
    refetch();
  }

  async function saveExisting() {
    if (!editing) return;
    const payload: any = {
      title: draftTitle || "(Untitled)",
      description: draftDesc || null,
      startsAt: new Date(draftStarts),
      endsAt: new Date(draftEnds),
      type: draftType,
    };

    if (file) {
      const b64 = await fileToBase64(file);
      payload.attachmentBase64 = b64.replace(/^data:.*;base64,/, "");
      payload.attachmentName = file.name;
      payload.attachmentType = file.type;
    }

    const res = await fetch(
      `/api/events/${editing.id}${
        (window as any).__shareToken ? `?token=${(window as any).__shareToken}` : ""
      }`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      alert("Failed to update event");
      return;
    }
    setDrawerOpen(false);
    refetch();
  }

  async function deleteExisting() {
    if (!editing) return;
    if (!confirm("Delete this event?")) return;
    const res = await fetch(
      `/api/events/${editing.id}${
        (window as any).__shareToken ? `?token=${(window as any).__shareToken}` : ""
      }`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      alert("Failed to delete");
      return;
    }
    setDrawerOpen(false);
    refetch();
  }

  return (
    <div className="cal-wrapper">
      {/* Top bar */}
      <div className="cal-topbar">
        <div className="left">
          <button
            className="icon"
            onClick={() => calendarRef.current?.getApi().prev()}
            title="Previous month"
          >
            ←
          </button>
          <button
            className="btn ghost"
            onClick={() => calendarRef.current?.getApi().today()}
          >
            Today
          </button>
          <button
            className="icon"
            onClick={() => calendarRef.current?.getApi().next()}
            title="Next month"
          >
            →
          </button>
        </div>
        <div className="right">
          <label className="switch">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
            />
            <span>Dark mode</span>
          </label>
          <button
            className="btn primary"
            onClick={() => handleDateClick({ date: new Date() })}
          >
            + New
          </button>
        </div>
      </div>

      {/* Calendar */}
      <FullCalendar
        ref={calendarRef as any}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        dayMaxEventRows={8}
        events={fetchEvents}
        editable
        eventResizableFromStart
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        headerToolbar={false}
      />

      {/* Drawer */}
      {drawerOpen && (
        <div className="drawer">
          <div className="drawer-header">
            <h3>{editing ? "Edit event" : "New event"}</h3>
            <button className="icon" onClick={() => setDrawerOpen(false)}>✕</button>
          </div>

          <div className="drawer-body">
            <label>
              Title
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Event title"
              />
            </label>

            <div className="row">
              <label className="half">
                Start
                <input
                  type="datetime-local"
                  value={draftStarts}
                  onChange={(e) => setDraftStarts(e.target.value)}
                />
              </label>
              <label className="half">
                End
                <input
                  type="datetime-local"
                  value={draftEnds}
                  onChange={(e) => setDraftEnds(e.target.value)}
                />
              </label>
            </div>

            <label>
              Type
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value)}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Description
              <textarea
                rows={5}
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                placeholder="Notes..."
              />
            </label>

            <label>
              Attachment (photo/PDF)
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            {editing?.attachmentName && (
              <a
                className="btn"
                href={`/api/events/${editing.id}/attachment`}
                target="_blank"
              >
                View current attachment ({editing.attachmentName})
              </a>
            )}

            <div className="drawer-actions">
              {editing ? (
                <>
                  <button className="btn primary" onClick={saveExisting}>Save</button>
                  <button className="btn danger" onClick={deleteExisting}>Delete</button>
                </>
              ) : (
                <button className="btn primary" onClick={saveNew}>Create</button>
              )}
              <button className="btn" onClick={() => setDrawerOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// utils
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
