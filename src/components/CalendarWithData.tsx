'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DateSelectArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import '@/styles/calendar.css';

type Props = { calendarId: string; initialYear?: number | null; initialMonth0?: number | null; };
type JobType = 'FENCE' | 'GUARDRAIL' | 'ATTENUATOR' | 'HANDRAIL' | 'TEMP_FENCE';
type Checklist = {
  locate?: { ticket?: string; requested?: string; expires?: string; contacted?: boolean };
  subtasks?: { id: string; text: string; done: boolean }[];
};
type WorkShift = 'DAY' | 'NIGHT';
type NewEvent = { title: string; start: string; end?: string; allDay: boolean; location?: string; description?: string; invoice?: string; type?: JobType; shift?: WorkShift; checklist?: Checklist | null };
type Todo = { id: string; title: string; notes?: string; done: boolean; type: JobType };
const TYPE_LABEL: Record<JobType, string> = { FENCE:'Fence', GUARDRAIL:'Guardrail', ATTENUATOR:'Attenuator', HANDRAIL:'Handrail', TEMP_FENCE:'Temporary Fence' };

export default function CalendarWithData({ calendarId, initialYear, initialMonth0 }: Props) {
  const initialDate = useMemo(() => {
    const now = new Date(); const y = Number.isFinite(initialYear as any) ? Number(initialYear) : now.getUTCFullYear();
    const m0 = Number.isFinite(initialMonth0 as any) ? Math.min(11, Math.max(0, Number(initialMonth0))) : now.getUTCMonth();
    return new Date(Date.UTC(y, m0, 1));
  }, [initialYear, initialMonth0]);

  const [events, setEvents] = useState<EventInput[]>([]);
  useEffect(() => {
    async function load() {
      const r = await fetch(`/api/calendars/${calendarId}/events`, { cache: 'no-store' });
      if (!r.ok) return;
      const rows = await r.json();
      setEvents(rows.map((row: any) => {
        const { invoice, rest } = splitInvoice(row.description ?? '');
        const startIso = new Date(row.start).toISOString();
        const rawEndIso = row.end ? new Date(row.end).toISOString() : startIso;
        const endIso = row.allDay ? addDaysIso(rawEndIso, 1) : rawEndIso; // FullCalendar expects exclusive end for all-day
        return {
          id: row.id,
          title: row.title,
          start: startIso,
          end: endIso,
          allDay: !!row.allDay,
          extendedProps: { location: row.location ?? '', description: rest, invoice, type: row.type ?? null, shift: row.shift ?? null, checklist: row.checklist ?? null },
          className: typeToClass(row.type),
        } as EventInput;
      }));
    }
    load().catch(() => {});
  }, [calendarId]);

  const [holidayOn, setHolidayOn] = useState(true);
  const [country, setCountry] = useState('US');
  const [holidays, setHolidays] = useState<EventInput[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<NewEvent | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(() => {
    try { const s = localStorage.getItem('weather.coords'); if (s) return JSON.parse(s); } catch {}
    return null;
  });
  const [weather, setWeather] = useState<Record<string, { tmax: number; tmin: number; pop: number; code: number }>>({});
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);
  const [holidayDialog, setHolidayDialog] = useState(false);
  const [weatherDialog, setWeatherDialog] = useState(false);
  const [weatherQuery, setWeatherQuery] = useState('');
  const [todoEdit, setTodoEdit] = useState<Todo | null>(null);
  const [todoForm, setTodoForm] = useState<{ title: string; description: string; locate: { ticket: string; requested: string; expires: string; contacted: boolean } } | null>(null);

  useEffect(() => {
    const m = window.matchMedia('(max-width: 640px)');
    const handler = () => setIsMobile(m.matches);
    handler();
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);

  const fetchHolidays = useCallback(async (year: number, cc: string) => {
    const res = await fetch(`/api/holidays?year=${year}&country=${cc}`); const json = await res.json();
    const bg: EventInput[] = (json.holidays as { date: string; title: string }[]).map(h => ({
      start: h.date, end: h.date, allDay: true, title: h.title, display: 'background', className: 'holiday-bg', editable: false,
    })); setHolidays(bg);
  }, []);

  // manual location only (set via Weather dialog). If none, no weather badges.

  // fetch daily forecast for visible range
  const fetchWeather = useCallback(async (start: Date, end: Date, c: { lat: number; lon: number }) => {
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const startDate = fmt(start);
    // subtract 1 day from end to avoid off-by-one on FullCalendar's exclusive end
    const endAdj = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    const endDate = fmt(endAdj);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${startDate}&end_date=${endDate}`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const j = await res.json();
      const map: Record<string, { tmax: number; tmin: number; pop: number; code: number }> = {};
      const t: string[] = j.daily?.time ?? [];
      const tmax: number[] = j.daily?.temperature_2m_max ?? [];
      const tmin: number[] = j.daily?.temperature_2m_min ?? [];
      const pop: number[] = j.daily?.precipitation_probability_max ?? [];
      const code: number[] = j.daily?.weathercode ?? [];
      for (let i = 0; i < t.length; i++) map[t[i]] = { tmax: tmax[i], tmin: tmin[i], pop: pop[i], code: code[i] };
      setWeather(map);
    } catch {}
  }, []);

  // initial weather for the starting month once coords are known
  useEffect(() => {
    if (!coords) return;
    const y = initialDate.getUTCFullYear();
    const m = initialDate.getUTCMonth();
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 1));
    fetchWeather(start, end, coords);
  }, [coords, initialDate, fetchWeather]);

  const handleDatesSet = useCallback((arg: { start: Date; end: Date }) => {
    setVisibleRange({ start: arg.start, end: arg.end });
    const mid = new Date((arg.start.getTime() + arg.end.getTime()) / 2);
    const y = mid.getUTCFullYear();
    fetchHolidays(y, country);
    if (coords) fetchWeather(arg.start, arg.end, coords);
  }, [country, fetchHolidays, coords, fetchWeather]);

  const weatherIcon = (code: number, pop: number) => {
    // Map Open-Meteo WMO weather codes to a small emoji icon
    // Ref: https://open-meteo.com/en/docs#api_form
    if (pop >= 70) return '🌧️';
    if (code === 0) return '☀️';
    if ([1, 2].includes(code)) return '⛅️';
    if (code === 3) return '☁️';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌦️';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '🌤️';
  };

  const injectBadgeIntoCell = (cell: Element) => {
    const ymd = (cell as HTMLElement).getAttribute('data-date');
    if (!ymd) return;
    const top = cell.querySelector('.fc-daygrid-day-top');
    if (!top) return;
    const existing = top.querySelector('.day-weather');
    if (existing) existing.remove();
    const data = weather[ymd];
    if (!data || !coords) return;
    const a = document.createElement('a');
    a.className = 'day-weather';
    const ico = document.createElement('span'); ico.className = 'ico'; ico.textContent = weatherIcon(data.code, data.pop);
    const txt = document.createElement('span'); txt.textContent = `${Math.round(data.tmax)}° ${Math.round(data.pop)}%`;
    a.appendChild(ico); a.appendChild(txt);
    a.href = `https://www.google.com/search?q=weather%20${encodeURIComponent(`${coords.lat.toFixed(2)},${coords.lon.toFixed(2)} ${ymd}`)}`;
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    // prevent calendar selection when clicking the link
    ['click','mousedown','mouseup','pointerdown','pointerup','touchstart','touchend'].forEach(evt => {
      a.addEventListener(evt as any, (e) => { e.stopPropagation(); });
    });
    const dayNum = top.querySelector('.fc-daygrid-day-number');
    // insert to the left of the date number
    if (dayNum && dayNum.parentNode) {
      dayNum.parentNode.insertBefore(a, dayNum);
    } else {
      top.insertBefore(a, top.firstChild);
    }
  };

  const dayCellDidMount = useCallback((arg: { date: Date; el: HTMLElement }) => {
    injectBadgeIntoCell(arg.el);

    // Enable dropping a Todo onto a day cell to create an event
    const el = arg.el;
    const dateStr = dateToLocalInput(arg.date).slice(0, 10); // YYYY-MM-DD local
    el.setAttribute('data-date', dateStr);
    const onDragOver = (e: Event) => { (e as DragEvent).preventDefault(); };
    const onDrop = async (e: Event) => {
      const de = e as DragEvent;
      de.preventDefault();
      const id = de.dataTransfer?.getData('text/plain');
      const raw = de.dataTransfer?.getData('application/x-todo');
      if (!id) return;
      let payload: { id: string; title: string; type: JobType; notes?: string } | null = null;
      try { if (raw) payload = JSON.parse(raw); } catch { payload = null; }
      if (!payload || payload.id !== id) return;
      const meta = parseTodoNotes(payload.notes);
      try {
        const startIso = fromLocalDateTime(dateStr, '00:00');
        const endIso = startIso;
        const r = await fetch(`/api/calendars/${calendarId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: payload.title,
            description: meta.description ?? '',
            start: startIso,
            end: endIso,
            allDay: true,
            location: '',
            type: payload.type,
            shift: 'DAY',
            checklist: meta.locate ? { locate: { ...meta.locate }, subtasks: [] } : null,
          }),
        });
        if (!r.ok) return;
        const c = await r.json();
        setEvents(p => [...p, {
          id: c.id,
          title: c.title,
          start: new Date(c.start).toISOString(),
          end: new Date(c.end).toISOString(),
          allDay: !!c.allDay,
          extendedProps: { location: c.location ?? '', ...splitInvoiceProps(c.description ?? ''), type: c.type ?? null, shift: c.shift ?? null, checklist: c.checklist ?? null },
          className: typeToClass(c.type),
        }]);
        // Remove todo on success
        try { await fetch(`/api/todos/${id}`, { method: 'DELETE' }); } catch {}
        setTodos(p => p.filter(t => t.id !== id));
      } catch {}
    };
    el.addEventListener('dragover', onDragOver as any);
    el.addEventListener('drop', onDrop as any);
  }, [weather, coords, calendarId]);

  useEffect(() => {
    // When weather map updates, (re)inject badges into currently rendered cells
    const cells = document.querySelectorAll('.fc-daygrid-day');
    cells.forEach(injectBadgeIntoCell);
  }, [weather, coords]);

  // simple geo helper for Weather dialog
  async function geocode(q: string): Promise<{ lat: number; lon: number } | null> {
    // Accept "lat,lon"
    const m = q.split(',').map(x => x.trim());
    if (m.length === 2 && !isNaN(Number(m[0])) && !isNaN(Number(m[1]))) {
      return { lat: parseFloat(m[0]), lon: parseFloat(m[1]) };
    }
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&name=${encodeURIComponent(q)}`;
      const r = await fetch(url, { cache: 'no-store' });
      const j = await r.json();
      const f = j.results?.[0];
      if (f) return { lat: f.latitude, lon: f.longitude };
    } catch {}
    return null;
  }

  // FIXED: build local times from Date objects, not startStr/endStr
  const handleSelect = useCallback((sel: DateSelectArg) => {
    setEditId(null);

    const startLocal = dateToLocalInput(sel.start);                     // local YYYY-MM-DDTHH:mm
    const endLocal = dateToLocalInput(sel.end ?? sel.start);            // default to same day

    setDraft({
      title: '',
      start: fromLocalInput(startLocal),                                 // to ISO string
      end: fromLocalInput(endLocal),
      allDay: sel.allDay,
      type: 'FENCE',
      invoice: '',
      shift: 'DAY',
    });

    setOpen(true);
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const e = arg.event; if (!e.id) return; setEditId(e.id);
    setDraft({
      title: e.title,
      start: e.start ? e.start.toISOString() : new Date().toISOString(),
      end: e.end ? e.end.toISOString() : undefined,
      allDay: e.allDay,
      location: e.extendedProps['location'] as string | undefined,
      description: e.extendedProps['description'] as string | undefined,
      invoice: e.extendedProps['invoice'] as string | undefined,
      type: e.extendedProps['type'] as JobType | undefined,
      shift: e.extendedProps['shift'] as WorkShift | undefined,
      checklist: (e.extendedProps as any)['checklist'] ?? defaultChecklist(),
    });
    setOpen(true);
  }, []);

  const updateEventById = useCallback((id: string, patch: Partial<NewEvent>) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, start: patch.start ?? (ev.start as string), end: patch.end ?? (ev.end as string | undefined), allDay: patch.allDay ?? (ev.allDay as boolean) } : ev));
  }, []);

  const handleEventDrop = useCallback(async (arg: any) => {
    const e = arg.event; if (!e.id) return;
    const newStart = e.start?.toISOString(); const newEnd = e.end ? e.end.toISOString() : newStart;
    const r = await fetch(`/api/events/${e.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: newStart, end: newEnd, allDay: e.allDay }) });
    if (r.ok) updateEventById(e.id, { start: newStart, end: newEnd, allDay: e.allDay });
  }, [updateEventById]);

  const handleEventResize = useCallback(async (arg: any) => {
    const e = arg.event; if (!e.id) return;
    const newStart = e.start?.toISOString(); const newEnd = e.end ? e.end.toISOString() : newStart;
    const r = await fetch(`/api/events/${e.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: newStart, end: newEnd, allDay: e.allDay }) });
    if (r.ok) updateEventById(e.id, { start: newStart, end: newEnd, allDay: e.allDay });
  }, [updateEventById]);

  const saveDraft = useCallback(async () => {
    if (!draft?.title) return;
    if (editId) {
      const r = await fetch(`/api/events/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draft.title, description: composeDescription(draft.description ?? '', draft.invoice ?? ''), start: fromLocalInput(draft.start), end: fromLocalInput(draft.end ?? draft.start), allDay: !!draft.allDay, location: draft.location ?? '', type: draft.type ?? null, shift: draft.shift ?? null, checklist: draft.checklist ?? null }) });
      if (!r.ok) return; const u = await r.json();
      const startIso = new Date(u.start).toISOString();
      const rawEndIso = u.end ? new Date(u.end).toISOString() : startIso;
      const endIso = u.allDay ? addDaysIso(rawEndIso, 1) : rawEndIso;
      setEvents(prev => prev.map(ev => ev.id === editId ? {
        id: u.id, title: u.title, start: startIso, end: endIso, allDay: !!u.allDay,
        extendedProps: { location: u.location ?? '', ...splitInvoiceProps(u.description ?? ''), type: u.type ?? null, shift: u.shift ?? null, checklist: u.checklist ?? null }, className: typeToClass(u.type),
      } : ev));
    } else {
      const r = await fetch(`/api/calendars/${calendarId}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draft.title, description: composeDescription(draft.description ?? '', draft.invoice ?? ''), start: fromLocalInput(draft.start), end: fromLocalInput(draft.end ?? draft.start), allDay: !!draft.allDay, location: draft.location ?? '', type: draft.type ?? null, shift: draft.shift ?? null, checklist: draft.checklist ?? null }) });
      if (!r.ok) return; const c = await r.json();
      const startIso = new Date(c.start).toISOString();
      const rawEndIso = c.end ? new Date(c.end).toISOString() : startIso;
      const endIso = c.allDay ? addDaysIso(rawEndIso, 1) : rawEndIso;
      setEvents(p => [...p, { id: c.id, title: c.title, start: startIso, end: endIso, allDay: !!c.allDay,
        extendedProps: { location: c.location ?? '', ...splitInvoiceProps(c.description ?? ''), type: c.type ?? null, shift: c.shift ?? null, checklist: c.checklist ?? null }, className: typeToClass(c.type) }]);
    }
    setOpen(false); setDraft(null); setEditId(null);
  }, [draft, editId, calendarId]);

  const deleteCurrent = useCallback(async () => {
    if (!editId) return; await fetch(`/api/events/${editId}`, { method: 'DELETE' });
    setEvents(prev => prev.filter(e => e.id !== editId)); setOpen(false); setDraft(null); setEditId(null);
  }, [editId]);

  const duplicateCurrent = useCallback(async () => {
    if (!draft) return;
    const r = await fetch(`/api/calendars/${calendarId}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${draft.title}`, description: draft.description ?? '', start: fromLocalInput(draft.start), end: fromLocalInput(draft.end ?? draft.start), allDay: !!draft.allDay, location: draft.location ?? '', type: draft.type ?? null, shift: draft.shift ?? null, checklist: draft.checklist ?? null }) });
    if (!r.ok) return; const c = await r.json();
    const startIso = new Date(c.start).toISOString();
    const rawEndIso = c.end ? new Date(c.end).toISOString() : startIso;
    const endIso = c.allDay ? addDaysIso(rawEndIso, 1) : rawEndIso;
    setEvents(p => [...p, { id: c.id, title: c.title, start: startIso, end: endIso, allDay: !!c.allDay,
      extendedProps: { location: c.location ?? '', description: c.description ?? '', type: c.type ?? null, shift: c.shift ?? null, checklist: c.checklist ?? null }, className: typeToClass(c.type) }]);
  }, [draft, calendarId]);

  const allEvents = useMemo(() => (holidayOn ? [...events, ...holidays] : events), [events, holidays, holidayOn]);

  // Compact Google Maps link inside each event (if location exists)
  const eventContent = useCallback((arg: EventContentArg) => {
    const frag = document.createElement('div');
    frag.style.display = 'flex';
    frag.style.alignItems = 'center';
    frag.style.gap = '0.25rem';
    const span = document.createElement('span');
    span.className = 'evt-title';
    span.textContent = arg.event.title;
    frag.appendChild(span);
    const loc = (arg.event.extendedProps as any)?.location as string | undefined;
    if (loc && loc.trim()) {
      const a = document.createElement('a');
      a.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = 'View in Google Maps';
      a.textContent = '📍';
      a.className = 'event-gmap-link';
      frag.appendChild(a);
    }
    return { domNodes: [frag] };
  }, []);

  // todos persisted in DB
  const [todos, setTodos] = useState<Todo[]>([]);
  const reloadTodos = useCallback(async () => {
    try {
      const r = await fetch(`/api/calendars/${calendarId}/todos`, { cache: 'no-store' });
      if (!r.ok) return;
      const rows: any[] = await r.json();
      setTodos(rows.map(r => ({ id: r.id, title: r.title, notes: r.notes ?? undefined, done: !!r.done, type: r.type })));
    } catch {}
  }, [calendarId]);
  useEffect(() => { reloadTodos(); }, [reloadTodos]);
  useEffect(() => {
    const onFocus = () => reloadTodos();
    window.addEventListener('focus', onFocus);
    const id = window.setInterval(onFocus, 30000);
    return () => { window.removeEventListener('focus', onFocus); window.clearInterval(id); };
  }, [reloadTodos]);

  const addTodo = async (type: JobType, title: string) => {
    const t = title.trim(); if (!t) return;
    const temp: Todo = { id: `tmp-${uid()}`, title: t, done: false, type };
    setTodos(p => [temp, ...p]);
    try {
      const r = await fetch(`/api/calendars/${calendarId}/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, type }) });
      if (!r.ok) throw new Error('create failed');
      const row = await r.json();
      setTodos(p => p.map(x => (x.id === temp.id ? { id: row.id, title: row.title, notes: row.notes ?? undefined, done: !!row.done, type: row.type } : x)));
    } catch {
      setTodos(p => p.filter(x => x.id !== temp.id));
    }
  };

  const deleteTodoLocal = async (id: string) => {
    const old = todos;
    setTodos(p => p.filter(t => t.id !== id));
    try { await fetch(`/api/todos/${id}`, { method: 'DELETE' }); } catch { setTodos(old); }
  };

  const completeTodo = async (id: string) => {
    const old = todos;
    setTodos(p => p.filter(t => t.id !== id));
    try { await fetch(`/api/todos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: true }) }); } catch { setTodos(old); }
  };

  const moveTodo = async (id: string, type: JobType) => {
    const old = todos;
    setTodos(p => p.map(t => (t.id === id ? { ...t, type } : t)));
    try { await fetch(`/api/todos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) }); } catch { setTodos(old); }
  };
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, todo: Todo) => {
    e.dataTransfer.setData('text/plain', todo.id);
    try { e.dataTransfer.setData('application/x-todo', JSON.stringify({ id: todo.id, title: todo.title, type: todo.type, notes: todo.notes ?? '' })); } catch {}
  };
  const onDropToColumn = (e: React.DragEvent<HTMLDivElement>, type: JobType) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) moveTodo(id, type); };
  const byType = (typ: JobType) => todos.filter(t => t.type === typ);

  return (
    <div className="cal-shell">
      {/* controls */}
      <div className="cal-controls calendar-bleed">
        <button className="btn" onClick={() => setHolidayDialog(true)}>Holidays</button>
        <button className="btn" onClick={() => setWeatherDialog(true)}>Weather</button>
      </div>

      {/* calendar */}
      <div className="surface p-2 calendar-bleed">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={initialDate}
            height="auto"
          dayCellDidMount={dayCellDidMount}
          eventContent={eventContent}
          expandRows
          handleWindowResize
          windowResizeDelay={100}
          dayMaxEventRows
          fixedWeekCount={false}
          selectable
          selectMirror
          editable
          eventStartEditable
          eventDurationEditable
          select={handleSelect}
          datesSet={handleDatesSet}
          events={allEvents}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          buttonText={{ today: 'Today' }}
          eventClassNames={arg => (arg.event.display === 'background' ? ['holiday-bg'] : [])}
        />
      </div>

      {/* modal */}
      {open && draft ? (
        <div className="modal-root">
          <div className="modal-card">
            <h3 className="modal-title">{editId ? 'Edit event' : 'Add event'}</h3>
            <div className="form-grid form-compact">
              <label className="span-2"><div className="label">Title</div>
                <input type="text" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
              </label>
              {isMobile ? (
                <>
                  <label><div className="label">Start date</div>
                    <input type="date" value={toLocalDate(draft.start)} onChange={e => {
                      const date = e.target.value;
                      const time = toLocalTime(draft.start);
                      setDraft({ ...draft, start: fromLocalDateTime(date, time) });
                    }} />
                  </label>
                  {!draft.allDay && (
                    <label><div className="label">Start time</div>
                      <input type="time" value={toLocalTime(draft.start)} onChange={e => {
                        const time = e.target.value;
                        const date = toLocalDate(draft.start);
                        setDraft({ ...draft, start: fromLocalDateTime(date, time) });
                      }} />
                    </label>
                  )}
                  <label><div className="label">End date</div>
                    <input type="date" value={toLocalDate(draft.end ?? draft.start)} onChange={e => {
                      const date = e.target.value;
                      const time = toLocalTime(draft.end ?? draft.start);
                      setDraft({ ...draft, end: fromLocalDateTime(date, time) });
                    }} />
                  </label>
                  {!draft.allDay && (
                    <label><div className="label">End time</div>
                      <input type="time" value={toLocalTime(draft.end ?? draft.start)} onChange={e => {
                        const time = e.target.value;
                        const date = toLocalDate(draft.end ?? draft.start);
                        setDraft({ ...draft, end: fromLocalDateTime(date, time) });
                      }} />
                    </label>
                  )}
                </>
              ) : (
                <>
                  <label><div className="label">Start</div>
                    <input type="datetime-local" value={toLocalInput(draft.start)} onChange={e => setDraft({ ...draft, start: fromLocalInput(e.target.value) })} />
                  </label>
                  <label><div className="label">End</div>
                    <input type="datetime-local" value={toLocalInput(draft.end ?? draft.start)} onChange={e => setDraft({ ...draft, end: fromLocalInput(e.target.value) })} />
                  </label>
                </>
              )}
              
              <label><div className="label">Type</div>
                <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as NewEvent['type'] })}>
                  <option value="FENCE">Fence</option><option value="TEMP_FENCE">Temp Fence</option><option value="GUARDRAIL">Guardrail</option><option value="HANDRAIL">Handrail</option><option value="ATTENUATOR">Attenuator</option>
                </select>
              </label>
              <label><div className="label">Invoice #</div>
                <input type="text" value={draft.invoice ?? ''} onChange={e => setDraft({ ...draft, invoice: e.target.value })} />
              </label>
              <label>
                <div className="label">Work Time</div>
                <div className="inline">
                  <label style={{ marginRight: '1rem' }}>
                    <input
                      type="radio"
                      name="shift"
                      value="DAY"
                      checked={(draft.shift ?? 'DAY') === 'DAY'}
                      onChange={() => setDraft({ ...draft, shift: 'DAY' })}
                    />
                    <span> Day</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="shift"
                      value="NIGHT"
                      checked={draft.shift === 'NIGHT'}
                      onChange={() => setDraft({ ...draft, shift: 'NIGHT' })}
                    />
                    <span> Night</span>
                  </label>
                </div>
              </label>
              <label><div className="label">Location</div>
                <input type="text" value={draft.location ?? ''} onChange={e => setDraft({ ...draft, location: e.target.value })} />
                <div className="mt-1">
                  <a
                    href={draft.location && draft.location.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(draft.location)}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-gmap-link"
                    aria-disabled={!draft.location || !draft.location.trim()}
                    onClick={e => { if (!draft.location || !draft.location.trim()) e.preventDefault(); }}
                    title={draft.location && draft.location.trim() ? 'Open in Google Maps' : 'Enter a location to open in Maps'}
                  >
                    Open in Google Maps
                  </a>
                </div>
              </label>
              <label className="span-2"><div className="label">Description</div>
                <textarea value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} />
              </label>
              {/* Checklist controls */}
              <div className="span-2">
                <div className="label">Locate Ticket</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label><div className="label">Ticket #</div>
                    <input type="text" value={draft.checklist?.locate?.ticket ?? ''} onChange={e => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), locate: { ...(draft.checklist?.locate ?? {}), ticket: e.target.value } } })} />
                  </label>
                  <label><div className="label">Requested</div>
                    <input type="date" value={(draft.checklist?.locate?.requested ?? '').slice(0,10)} onChange={e => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), locate: { ...(draft.checklist?.locate ?? {}), requested: e.target.value } } })} />
                  </label>
                  <label><div className="label">Expires</div>
                    <input type="date" value={(draft.checklist?.locate?.expires ?? '').slice(0,10)} onChange={e => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), locate: { ...(draft.checklist?.locate ?? {}), expires: e.target.value } } })} />
                  </label>
                </div>
              </div>
              <div className="span-2">
                <div className="label">Subtasks</div>
                <SubtasksEditor
                  value={draft.checklist?.subtasks ?? []}
                  onChange={(subs) => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), subtasks: subs } })}
                />
              </div>
              <div className="modal-actions span-2">
                {editId ? (<><button className="btn" onClick={duplicateCurrent}>Duplicate</button><button className="btn ghost" onClick={deleteCurrent}>Delete</button></>) : null}
                <button className="btn ghost" onClick={() => { setOpen(false); setDraft(null); setEditId(null); }}>Cancel</button>
                <button className="btn primary" onClick={saveDraft}>Save</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Holidays country prompt */}
      {holidayDialog && (
        <div className="modal-root" onClick={(e) => { if (e.currentTarget === e.target) setHolidayDialog(false); }}>
          <div className="modal-card" role="dialog" aria-modal="true">
            <h3 className="modal-title">Holidays</h3>
            <div className="form-grid">
              <label className="inline span-2"><input type="checkbox" checked={holidayOn} onChange={e => setHolidayOn(e.target.checked)} /><span>Show public holidays</span></label>
              <label>
                <div className="label">Country</div>
                <select value={country} onChange={e => setCountry(e.target.value as string)}>
                  {COUNTRIES.map(c => (<option key={c[0]} value={c[0]}>{c[1]} ({c[0]})</option>))}
                </select>
              </label>
              <div className="modal-actions">
                <button className="btn ghost" onClick={() => setHolidayDialog(false)}>Cancel</button>
                <button className="btn primary" onClick={() => { setHolidayDialog(false); const yr = (visibleRange ? new Date((visibleRange.start.getTime()+visibleRange.end.getTime())/2).getUTCFullYear() : new Date().getUTCFullYear()); fetchHolidays(yr, country); }}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather location prompt */}
      {weatherDialog && (
        <div className="modal-root" onClick={(e) => { if (e.currentTarget === e.target) setWeatherDialog(false); }}>
          <div className="modal-card" role="dialog" aria-modal="true">
            <h3 className="modal-title">Weather</h3>
            <div className="form-grid">
              <label className="span-2">
                <div className="label">City, State or Lat,Lng</div>
                <input type="text" value={weatherQuery} onChange={e => setWeatherQuery(e.target.value)} placeholder="e.g. Orlando, FL or 28.54,-81.38" />
              </label>
              <div className="modal-actions span-2">
                <button className="btn ghost" onClick={() => setWeatherDialog(false)}>Cancel</button>
                <button className="btn primary" onClick={async () => {
                  const g = await geocode(weatherQuery.trim());
                  if (!g) { alert('Location not found. Try City, State or lat,lng'); return; }
                  setCoords(g);
                  localStorage.setItem('weather.coords', JSON.stringify(g));
                  setWeatherDialog(false);
                  if (visibleRange) fetchWeather(visibleRange.start, visibleRange.end, g);
                }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Todo edit prompt */}
      {todoEdit && todoForm && (
        <div className="modal-root" onClick={(e) => { if (e.currentTarget === e.target) { setTodoEdit(null); setTodoForm(null); } }}>
          <div className="modal-card" role="dialog" aria-modal="true">
            <h3 className="modal-title">Edit To-Do</h3>
            <div className="form-grid form-compact">
              <label className="span-2"><div className="label">Title</div>
                <input type="text" value={todoForm.title} onChange={e => setTodoForm({ ...todoForm!, title: e.target.value })} />
              </label>
              <label className="span-2"><div className="label">Description of Work</div>
                <textarea value={todoForm.description} onChange={e => setTodoForm({ ...todoForm!, description: e.target.value })} />
              </label>
              <div className="span-2">
                <div className="label">Locate Ticket</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label><div className="label">Ticket #</div>
                    <input type="text" value={todoForm.locate.ticket} onChange={e => setTodoForm({ ...todoForm!, locate: { ...todoForm!.locate, ticket: e.target.value } })} />
                  </label>
                  <label><div className="label">Requested</div>
                    <input type="date" value={todoForm.locate.requested} onChange={e => setTodoForm({ ...todoForm!, locate: { ...todoForm!.locate, requested: e.target.value } })} />
                  </label>
                  <label><div className="label">Expires</div>
                    <input type="date" value={todoForm.locate.expires} onChange={e => setTodoForm({ ...todoForm!, locate: { ...todoForm!.locate, expires: e.target.value } })} />
                  </label>
                  <label className="inline"><input type="checkbox" checked={todoForm.locate.contacted} onChange={e => setTodoForm({ ...todoForm!, locate: { ...todoForm!.locate, contacted: e.target.checked } })} /><span>Contacted</span></label>
                </div>
              </div>
              <div className="modal-actions span-2">
                <button className="btn ghost" onClick={() => { setTodoEdit(null); setTodoForm(null); }}>Cancel</button>
                <button className="btn primary" onClick={async () => {
                  if (!todoEdit) return;
                  const payload = { description: todoForm!.description, locate: todoForm!.locate };
                  const notes = JSON.stringify(payload);
                  const r = await fetch(`/api/todos/${todoEdit.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: todoForm!.title, notes }) });
                  if (r.ok) {
                    const row = await r.json();
                    setTodos(p => p.map(x => (x.id === row.id ? { id: row.id, title: row.title, notes: row.notes ?? undefined, done: !!row.done, type: row.type } : x)));
                  }
                  setTodoEdit(null); setTodoForm(null);
                }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* todos (local only) */}
      <section className="todo-section todo-bleed">
        <div className="surface p-3">
          <h3 className="todo-title">Job To-Dos</h3>
          <div className="todo-grid">
            {(['FENCE','GUARDRAIL','ATTENUATOR','HANDRAIL','TEMP_FENCE'] as JobType[]).map(typ => (
              <div key={typ} className="todo-col" onDragOver={e => e.preventDefault()} onDrop={e => onDropToColumn(e, typ)}>
                <header className="todo-col-header"><span>{TYPE_LABEL[typ]}</span><span className="todo-count">{byType(typ).length}</span></header>
                <TodoAdder onAdd={(title) => addTodo(typ, title)} placeholder={`Add ${TYPE_LABEL[typ]} job`} />
                <div className="todo-list">
                  {byType(typ).map(t => (
                    <div key={t.id} className="todo-card" draggable onDragStart={(e) => onDragStart(e, t)}>
                      <label className="todo-row">
                        <input type="checkbox" checked={false} onChange={() => completeTodo(t.id)} />
                        <span
                          className="todo-text"
                          role="button"
                          tabIndex={0}
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onClick={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            setTodoEdit(t);
                            const parsed = parseTodoNotes(t.notes);
                            setTodoForm({ title: t.title, description: parsed.description ?? '', locate: { ticket: parsed.locate?.ticket ?? '', requested: parsed.locate?.requested ?? '', expires: parsed.locate?.expires ?? '', contacted: !!parsed.locate?.contacted } });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault(); e.stopPropagation();
                              setTodoEdit(t);
                              const parsed = parseTodoNotes(t.notes);
                              setTodoForm({ title: t.title, description: parsed.description ?? '', locate: { ticket: parsed.locate?.ticket ?? '', requested: parsed.locate?.requested ?? '', expires: parsed.locate?.expires ?? '', contacted: !!parsed.locate?.contacted } });
                            }
                          }}
                        >{t.title}</span>
                      </label>
                      <div className="todo-actions">
                        <select className="todo-move" value={t.type} onChange={e => moveTodo(t.id, e.target.value as JobType)} title="Move to…">
                          {(['FENCE','GUARDRAIL','ATTENUATOR','HANDRAIL','TEMP_FENCE'] as JobType[]).map(v => (<option key={v} value={v}>{TYPE_LABEL[v]}</option>))}
                        </select>
                        <button className="todo-del" onClick={() => deleteTodoLocal(t.id)} title="Delete">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const COUNTRIES: [string, string][] = [
  ['US', 'United States'],
  ['CA', 'Canada'],
  ['GB', 'United Kingdom'],
  ['AU', 'Australia'],
  ['DE', 'Germany'],
  ['MX', 'Mexico'],
  ['FR', 'France'],
  ['ES', 'Spain'],
  ['IT', 'Italy'],
];

function toLocalInput(isoLike: string) { const d = new Date(isoLike); const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fromLocalInput(local: string) { return new Date(local).toISOString(); }
function toLocalDate(isoLike: string) { return toLocalInput(isoLike).slice(0, 10); }
function toLocalTime(isoLike: string) { return toLocalInput(isoLike).slice(11, 16); }
function fromLocalDateTime(date: string, time: string) { return fromLocalInput(`${date}T${time}`); }
function dateToLocalInput(d: Date) { const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
function typeToClass(t?: NewEvent['type']) { switch (t) { case 'FENCE': return 'evt-fence'; case 'TEMP_FENCE': return 'evt-temp-fence'; case 'GUARDRAIL': return 'evt-guardrail'; case 'HANDRAIL': return 'evt-handrail'; case 'ATTENUATOR': return 'evt-attenuator'; default: return ''; } }
function addDaysIso(iso: string, days: number) { const d = new Date(iso); d.setUTCDate(d.getUTCDate() + days); return d.toISOString(); }
function TodoAdder({ onAdd, placeholder }: { onAdd: (title: string) => void; placeholder: string }) {
  const [val, setVal] = useState(''); const submit = () => { if (val.trim()) { onAdd(val); setVal(''); } };
  return (<div className="todo-adder"><input className="todo-input" placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} /><button className="btn primary todo-add-btn" onClick={submit}>Add</button></div>);
}

// (helpers defined once above)

function splitInvoice(desc: string): { invoice: string; rest: string } {
  const lines = (desc || '').split(/\r?\n/)
  let invoice = ''
  const restLines: string[] = []
  const re = /^\s*invoice\s*#?\s*:\s*(.+)\s*$/i
  for (const ln of lines) {
    const m = ln.match(re)
    if (m && !invoice) { invoice = m[1].trim(); continue }
    restLines.push(ln)
  }
  return { invoice, rest: restLines.join('\n').trim() }
}
function splitInvoiceProps(desc: string) { const { invoice, rest } = splitInvoice(desc); return { description: rest, invoice } }
function composeDescription(desc: string, invoice: string): string {
  const d = (desc || '').trim()
  const i = (invoice || '').trim()
  if (!i) return d
  return `Invoice: ${i}` + (d ? `\n${d}` : '')
}

function defaultChecklist(): Checklist { return { locate: { ticket: '', requested: '', expires: '', contacted: false }, subtasks: [] }; }

function parseTodoNotes(notes?: string | null): { description?: string; locate?: { ticket?: string; requested?: string; expires?: string; contacted?: boolean } } {
  if (!notes) return {};
  try {
    const j = JSON.parse(notes);
    if (j && typeof j === 'object') return j;
  } catch {}
  return { description: notes };
}

function SubtasksEditor({ value, onChange }: { value: { id: string; text: string; done: boolean }[]; onChange: (v: { id: string; text: string; done: boolean }[]) => void }) {
  const [text, setText] = useState('');
  const add = () => { const t = text.trim(); if (!t) return; onChange([...(value ?? []), { id: uid(), text: t, done: false }]); setText(''); };
  const toggle = (id: string) => onChange((value ?? []).map(s => s.id === id ? { ...s, done: !s.done } : s));
  const del = (id: string) => onChange((value ?? []).filter(s => s.id !== id));
  return (
    <div className="subtasks">
      <div className="input-row">
        <input className="subtask-input" placeholder="Add subtask" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} />
        <button className="btn" onClick={add}>Add</button>
      </div>
      <div className="subtask-list">
        {(value ?? []).map(s => (
          <div key={s.id} className="subtask-item">
            <input type="checkbox" checked={!!s.done} onChange={() => toggle(s.id)} />
            <span className={s.done ? 'subtask-text muted' : 'subtask-text'}>{s.text}</span>
            <button className="subtask-remove" onClick={() => del(s.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
