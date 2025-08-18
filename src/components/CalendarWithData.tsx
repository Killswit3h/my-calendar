"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

/** Helper types inferred from the wrapper (keeps TS happy) */
type DateSelectArg = Parameters<
  NonNullable<React.ComponentProps<typeof FullCalendar>["select"]>
>[0];
type EventClickArg = Parameters<
  NonNullable<React.ComponentProps<typeof FullCalendar>["eventClick"]>
>[0];
type EventDropArg = Parameters<
  NonNullable<React.ComponentProps<typeof FullCalendar>["eventDrop"]>
>[0];
type EventResizeDoneArg = Parameters<
  NonNullable<React.ComponentProps<typeof FullCalendar>["eventResize"]>
>[0];

/** Event shape used by our UI */
type CalEvent = {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string | Date;
  endsAt: string | Date;
  allDay?: boolean;
  location?: string | null;
  type?: "GUARDRAIL" | "FENCE" | "TEMP_FENCE" | "HANDRAIL" | "ATTENUATOR" | null;
};

const TYPE_COLORS: Record<NonNullable<CalEvent["type"]>, string> = {
  GUARDRAIL: "#10B981",
  FENCE: "#FB923C",
  TEMP_FENCE: "#FACC15",
  HANDRAIL: "#3B82F6",
  ATTENUATOR: "#EF4444",
};
const typeToColor = (t?: CalEvent["type"] | null) => (t ? TYPE_COLORS[t] : undefined);

const toLocalInput = (d: Date) => {
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

/** ─────────────── Clipboard (copy/paste) ─────────────── */
type ClipData = {
  title: string;
  type: CalEvent["type"] | null;
  description: string;
  /** milliseconds */
  durationMs: number;
};
const CLIP_KEY = "calendar_clipboard_v1";

function saveClipboard(c: ClipData) {
  try {
    localStorage.setItem(CLIP_KEY, JSON.stringify(c));
  } catch {}
}
function loadClipboard(): ClipData | null {
  try {
    const raw = localStorage.getItem(CLIP_KEY);
    return raw ? (JSON.parse(raw) as ClipData) : null;
  } catch {
    return null;
  }
}

/** ─────────────── Component ─────────────── */
export default function CalendarWithData({ calendarId }: { calendarId: string }) {
  const calendarRef = useRef<FullCalendar | null>(null);

  // modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftType, setDraftType] = useState<CalEvent["type"] | null>(null);
  const [draftDesc, setDraftDesc] = useState("");
  const [draftStart, setDraftStart] = useState<string>("");
  const [draftEnd, setDraftEnd] = useState<string>("");

  // clipboard state (for showing/hiding Paste)
  const [clip, setClip] = useState<ClipData | null>(null);
  useEffect(() => setClip(loadClipboard()), [open]);

  const token = (typeof window !== "undefined" && (window as any).__shareToken) || "";

  const refetch = () => calendarRef.current?.getApi().refetchEvents();

  const loadEvents = async (info: any, success: any) => {
    const url = `/api/calendars/${calendarId}/events?from=${info.startStr}&to=${
      info.endStr
    }${token ? `&token=${token}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    success(
      data.map((e: any) => ({
        id: e.id,
        title: e.title,
        start: e.startsAt,
        end: e.endsAt,
        allDay: true,
        color: typeToColor(e.type),
        extendedProps: e as CalEvent,
      }))
    );
  };

  const handleSelect = (arg: DateSelectArg) => {
    setEditingId(null);
    setDraftTitle("");
    setDraftType(null);
    setDraftDesc("");
    setDraftStart(toLocalInput(arg.start));
    setDraftEnd(toLocalInput(arg.end));
    setOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const e = clickInfo.event;
    const x = e.extendedProps as CalEvent;
    setEditingId(e.id);
    setDraftTitle(e.title);
    setDraftType(x.type ?? null);
    setDraftDesc(x.description ?? "");
    setDraftStart(toLocalInput(e.start!));
    setDraftEnd(toLocalInput(e.end || e.start!));
    setOpen(true);
  };

  const handleDrop = async (arg: EventDropArg) => {
    await fetch(`/api/events/${arg.event.id}${token ? `?token=${token}` : ""}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAt: arg.event.start, endsAt: arg.event.end }),
    });
    refetch();
  };
  const handleResize = async (arg: EventResizeDoneArg) => {
    await fetch(`/api/events/${arg.event.id}${token ? `?token=${token}` : ""}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAt: arg.event.start, endsAt: arg.event.end }),
    });
    refetch();
  };

  /** Save (create/update) */
  const save = async () => {
    const payload = {
      title: draftTitle,
      startsAt: new Date(draftStart),
      endsAt: new Date(draftEnd),
      type: draftType,
      description: draftDesc || null,
      allDay: true,
    };

    if (editingId) {
      await fetch(`/api/events/${editingId}${token ? `?token=${token}` : ""}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`/api/calendars/${calendarId}/events${token ? `?token=${token}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setOpen(false);
    refetch();
  };

  /** Delete */
  const remove = async () => {
    if (!editingId) return;
    await fetch(`/api/events/${editingId}${token ? `?token=${token}` : ""}`, {
      method: "DELETE",
    });
    setOpen(false);
    refetch();
  };

  /** ───── Copy/Paste helpers ───── */
  const doCopy = () => {
    // Only from an existing event
    const start = new Date(draftStart);
    const end = new Date(draftEnd);
    const c: ClipData = {
      title: draftTitle,
      type: draftType ?? null,
      description: draftDesc,
      durationMs: Math.max(0, end.getTime() - start.getTime()),
    };
    saveClipboard(c);
    setClip(c);
  };

  const doPasteIntoDraft = () => {
    if (!clip) return;
    setDraftTitle(clip.title);
    setDraftType(clip.type);
    setDraftDesc(clip.description);

    // Recalculate end from current draftStart + duration
    const start = new Date(draftStart || Date.now());
    const end = new Date(start.getTime() + (clip.durationMs || 0));
    setDraftEnd(toLocalInput(end));
  };

  const duplicateNow = async () => {
    // Create a new event with the current draft fields (even if editing existing)
    const payload = {
      title: draftTitle,
      startsAt: new Date(draftStart),
      endsAt: new Date(draftEnd),
      type: draftType,
      description: draftDesc || null,
      allDay: true,
    };
    await fetch(`/api/calendars/${calendarId}/events${token ? `?token=${token}` : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setOpen(false);
    refetch();
  };

  return (
    <>
      <FullCalendar
        ref={calendarRef as any}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        dayMaxEventRows={8}
        selectable
        editable
        eventResizableFromStart
        events={loadEvents}
        select={handleSelect}
        eventClick={handleEventClick}
        eventDrop={handleDrop}
        eventResize={handleResize}
        headerToolbar={{ left: "today prev,next", center: "title", right: "" }}
        footerToolbar={false as any}
        buttonText={{ today: "Today" }}
        displayEventTime={false}
      />

      {/* Modal via PORTAL */}
      {open &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
            }}
          >
            <div
              style={{
                width: "min(700px,92vw)",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                boxShadow: "0 20px 60px rgba(0,0,0,.55)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: 16,
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  fontWeight: 600,
                  fontSize: 20,
                }}
              >
                <span>{editingId ? "Edit event" : "Add event"}</span>

                {/* Copy / Paste / Duplicate controls */}
                <div style={{ display: "flex", gap: 8 }}>
                  {editingId && (
                    <>
                      <button
                        onClick={doCopy}
                        className="btn"
                        title="Copy event"
                        style={{ padding: "8px 12px" }}
                      >
                        Copy
                      </button>
                      <button
                        onClick={duplicateNow}
                        className="btn"
                        title="Duplicate as new event"
                        style={{ padding: "8px 12px" }}
                      >
                        Duplicate
                      </button>
                    </>
                  )}
                  {!editingId && clip && (
                    <button
                      onClick={doPasteIntoDraft}
                      className="btn"
                      title="Paste details"
                      style={{ padding: "8px 12px" }}
                    >
                      Paste
                    </button>
                  )}
                </div>
              </div>

              <div style={{ padding: 18, display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Title</span>
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Project name"
                    style={{
                      background: "var(--bg)",
                      color: "var(--fg)",
                      border: "1px solid var(--border)",
                      padding: "10px 12px",
                      borderRadius: 10,
                    }}
                  />
                </label>

                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span>Start</span>
                    <input
                      type="datetime-local"
                      value={draftStart}
                      onChange={(e) => setDraftStart(e.target.value)}
                      style={{
                        background: "var(--bg)",
                        color: "var(--fg)",
                        border: "1px solid var(--border)",
                        padding: "10px 12px",
                        borderRadius: 10,
                      }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span>End</span>
                    <input
                      type="datetime-local"
                      value={draftEnd}
                      onChange={(e) => setDraftEnd(e.target.value)}
                      style={{
                        background: "var(--bg)",
                        color: "var(--fg)",
                        border: "1px solid var(--border)",
                        padding: "10px 12px",
                        borderRadius: 10,
                      }}
                    />
                  </label>
                </div>

                <label style={{ display: "grid", gap: 6 }}>
                  <span>Type</span>
                  <select
                    value={draftType ?? ""}
                    onChange={(e) =>
                      setDraftType((e.target.value || null) as CalEvent["type"] | null)
                    }
                    style={{
                      background: "var(--bg)",
                      color: "var(--fg)",
                      border: "1px solid var(--border)",
                      padding: "10px 12px",
                      borderRadius: 10,
                    }}
                  >
                    <option value="">— Select —</option>
                    <option value="GUARDRAIL">Guardrail</option>
                    <option value="FENCE">Fence</option>
                    <option value="TEMP_FENCE">Temporary fence</option>
                    <option value="HANDRAIL">Handrail</option>
                    <option value="ATTENUATOR">Attenuator</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span>Description</span>
                  <textarea
                    rows={4}
                    value={draftDesc}
                    onChange={(e) => setDraftDesc(e.target.value)}
                    placeholder="Notes, scope, address, crew, etc."
                    style={{
                      background: "var(--bg)",
                      color: "var(--fg)",
                      border: "1px solid var(--border)",
                      padding: "10px 12px",
                      borderRadius: 10,
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  padding: 16,
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                {editingId && (
                  <button
                    onClick={remove}
                    style={{
                      background: "var(--danger)",
                      border: "1px solid #7f1d1d",
                      color: "#fff",
                      borderRadius: 10,
                      padding: "10px 14px",
                    }}
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--fg)",
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  style={{
                    background: "var(--primary)",
                    border: "1px solid #1e40af",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
