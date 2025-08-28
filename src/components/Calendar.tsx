'use client';

import { useCallback, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  EventInput,
  DateSelectArg,
  EventClickArg,
} from '@fullcalendar/core';

type NewEvent = {
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  location?: string;
  description?: string;
  type?: 'GUARDRAIL' | 'FENCE' | 'TEMP_FENCE' | 'HANDRAIL' | 'ATTENUATOR';
};

type Props = { initialDate?: Date };

export default function Calendar({ initialDate }: Props) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [holidayOn, setHolidayOn] = useState(true);
  const [country, setCountry] = useState('US');
  const [holidays, setHolidays] = useState<EventInput[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<NewEvent | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  // holidays
  const fetchHolidays = useCallback(async (year: number, cc: string) => {
    const res = await fetch(`/api/holidays?year=${year}&country=${cc}`);
    const json = await res.json();
    const bg: EventInput[] = (json.holidays as { date: string; title: string }[]).map(h => ({
      start: h.date,
      end: h.date,
      allDay: true,
      title: h.title,
      display: 'background',
      className: 'holiday-bg',
      editable: false,
    }));
    setHolidays(bg);
  }, []);

  const handleDatesSet = useCallback(
    (arg: { start: Date; end: Date }) => {
      const mid = new Date((arg.start.getTime() + arg.end.getTime()) / 2);
      const y = mid.getUTCFullYear();
      fetchHolidays(y, country);
    },
    [country, fetchHolidays]
  );

  // create
  const handleSelect = useCallback((sel: DateSelectArg) => {
    setEditId(null);
    setDraft({
      title: '',
      start: sel.startStr,
      end: sel.endStr,
      allDay: sel.allDay,
      type: 'FENCE',
    });
    setOpen(true);
  }, []);

  // click -> edit
  const handleEventClick = useCallback((arg: EventClickArg) => {
    const e = arg.event;
    if (!e.id) return; // ignore background
    setEditId(e.id);
    setDraft({
      title: e.title,
      start: e.start ? e.start.toISOString() : new Date().toISOString(),
      end: e.end ? e.end.toISOString() : undefined,
      allDay: e.allDay,
      location: e.extendedProps['location'] as string | undefined,
      description: e.extendedProps['description'] as string | undefined,
      type: e.extendedProps['type'] as NewEvent['type'],
    });
    setOpen(true);
  }, []);

  // drag/resize -> persist
  const updateEventById = useCallback(
    (id: string, patch: Partial<NewEvent>) => {
      setEvents(prev =>
        prev.map(ev =>
          ev.id === id
            ? {
                ...ev,
                start: patch.start ?? (ev.start as string),
                end: patch.end ?? (ev.end as string | undefined),
                allDay: patch.allDay ?? (ev.allDay as boolean),
              }
            : ev
        )
      );
    },
    []
  );

  const handleEventDrop = useCallback((arg: any) => {
    const e = arg.event;
    if (!e.id) return;
    updateEventById(e.id, {
      start: e.start?.toISOString(),
      end: e.end?.toISOString(),
      allDay: e.allDay,
    });
  }, [updateEventById]);

  const handleEventResize = useCallback((arg: any) => {
    const e = arg.event;
    if (!e.id) return;
    updateEventById(e.id, {
      start: e.start?.toISOString(),
      end: e.end?.toISOString(),
      allDay: e.allDay,
    });
  }, [updateEventById]);

  // save from modal
  const saveDraft = useCallback(() => {
    if (!draft?.title) return;

    if (editId) {
      // update
      setEvents(prev =>
        prev.map(ev =>
          ev.id === editId
            ? {
                ...ev,
                title: draft.title,
                start: draft.start,
                end: draft.end,
                allDay: draft.allDay,
                extendedProps: {
                  ...ev.extendedProps,
                  location: draft.location,
                  description: draft.description,
                  type: draft.type,
                },
                className: typeToClass(draft.type),
              }
            : ev
        )
      );
    } else {
      // create
      const id = uid();
      setEvents(prev => [
        ...prev,
        {
          id,
          title: draft.title,
          start: draft.start,
          end: draft.end,
          allDay: draft.allDay,
          extendedProps: {
            location: draft.location,
            description: draft.description,
            type: draft.type,
          },
          className: typeToClass(draft.type),
        },
      ]);
    }
    setOpen(false);
    setDraft(null);
    setEditId(null);
  }, [draft, editId]);

  const deleteCurrent = useCallback(() => {
    if (!editId) return;
    setEvents(prev => prev.filter(e => e.id !== editId));
    setOpen(false);
    setDraft(null);
    setEditId(null);
  }, [editId]);

  const duplicateCurrent = useCallback(() => {
    if (!draft) return;
    const id = uid();
    setEvents(prev => [
      ...prev,
      {
        id,
        title: `${draft.title}`,
        start: draft.start,
        end: draft.end,
        allDay: draft.allDay,
        extendedProps: {
          location: draft.location,
          description: draft.description,
          type: draft.type,
        },
        className: typeToClass(draft.type),
      },
    ]);
  }, [draft]);

  const allEvents = useMemo(
    () => (holidayOn ? [...events, ...holidays] : events),
    [events, holidays, holidayOn]
  );

  return (
    <div className="cal-shell">
      <div className="surface p-4 mb-4 flex items-center gap-3 flex-wrap">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={holidayOn}
            onChange={e => setHolidayOn(e.target.checked)}
          />
        <span>Show public holidays</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[var(--muted)] text-sm">Country</span>
          <input
            value={country}
            onChange={e => setCountry(e.target.value.toUpperCase())}
            onBlur={() => {
              const y = new Date().getUTCFullYear();
              fetchHolidays(y, country);
            }}
            className="w-16 px-2 py-1 rounded border border-[var(--border)] bg-[var(--card-2)]"
          />
        </div>
      </div>

      <div className="surface p-2">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={initialDate}
          height="auto"
          selectable
          selectMirror
          editable={true}
          eventStartEditable={true}
          eventDurationEditable={true}
          select={handleSelect}
          datesSet={handleDatesSet}
          events={allEvents}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          buttonText={{ today: 'Today' }}
          eventClassNames={(arg) => (arg.event.display === 'background' ? ['holiday-bg'] : [])}
        />
      </div>

      {open && draft ? (
        <div className="modal-root">
          <div className="modal-card max-w-xl w-[640px]">
            <h3 className="modal-title">{editId ? 'Edit event' : 'Add event'}</h3>

            <div className="form-grid">
              <label className="span-2">
                <div>Title</div>
                <input
                  type="text"
                  value={draft.title}
                  onChange={e => setDraft({ ...draft, title: e.target.value })}
                />
              </label>

              <label>
                <div>Start</div>
                <input
                  type="datetime-local"
                  value={toLocalInput(draft.start)}
                  onChange={e => setDraft({ ...draft, start: fromLocalInput(e.target.value) })}
                />
              </label>

              <label>
                <div>End</div>
                <input
                  type="datetime-local"
                  value={toLocalInput(draft.end ?? draft.start)}
                  onChange={e => setDraft({ ...draft, end: fromLocalInput(e.target.value) })}
                />
              </label>

              <label className="inline span-2">
                <input
                  type="checkbox"
                  checked={draft.allDay}
                  onChange={e => setDraft({ ...draft, allDay: e.target.checked })}
                />
                <span>All day</span>
              </label>

              <label>
                <div>Type</div>
                <select
                  value={draft.type}
                  onChange={e => setDraft({ ...draft, type: e.target.value as NewEvent['type'] })}
                >
                  <option value="FENCE">Fence</option>
                  <option value="TEMP_FENCE">Temp Fence</option>
                  <option value="GUARDRAIL">Guardrail</option>
                  <option value="HANDRAIL">Handrail</option>
                  <option value="ATTENUATOR">Attenuator</option>
                </select>
              </label>

              <label>
                <div>Location</div>
                <input
                  type="text"
                  value={draft.location ?? ''}
                  onChange={e => setDraft({ ...draft, location: e.target.value })}
                />
              </label>

              <label className="span-2">
                <div>Description</div>
                <textarea
                  value={draft.description ?? ''}
                  onChange={e => setDraft({ ...draft, description: e.target.value })}
                />
              </label>

              <div className="modal-actions span-2">
                {editId ? (
                  <>
                    <button className="btn" onClick={duplicateCurrent}>Duplicate</button>
                    <button className="btn ghost" onClick={deleteCurrent}>Delete</button>
                  </>
                ) : null}
                <button className="btn ghost" onClick={() => { setOpen(false); setDraft(null); setEditId(null); }}>
                  Cancel
                </button>
                <button className="btn primary" onClick={saveDraft}>Save</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* -------- helpers -------- */

function toLocalInput(isoLike: string) {
  const d = new Date(isoLike);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(local: string) { return new Date(local).toISOString(); }
function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
function typeToClass(t?: NewEvent['type']) {
  switch (t) {
    case 'FENCE': return 'evt-fence';
    case 'TEMP_FENCE': return 'evt-temp-fence';
    case 'GUARDRAIL': return 'evt-guardrail';
    case 'HANDRAIL': return 'evt-handrail';
    case 'ATTENUATOR': return 'evt-attenuator';
    default: return '';
  }
}
