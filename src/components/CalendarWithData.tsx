'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import '@/styles/calendar.css';

type Props = { calendarId: string; initialYear?: number | null; initialMonth0?: number | null; };
type JobType = 'FENCE' | 'GUARDRAIL' | 'ATTENUATOR' | 'HANDRAIL' | 'TEMP_FENCE';
type SubTask = { id: string; title: string; done: boolean };
type Checklist = { needsLocate: boolean; locateTicket: string; tasks: SubTask[] };
type NewEvent = { title: string; start: string; end?: string; allDay: boolean; location?: string; description?: string; type?: JobType; checklist?: Checklist };
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
      setEvents(rows.map((row: any) => ({
        id: row.id, title: row.title,
        start: new Date(row.startsAt).toISOString(),
        end: new Date(row.endsAt).toISOString(),
        allDay: !!row.allDay,
        extendedProps: { location: row.location ?? '', description: row.description ?? '', type: row.type ?? null, checklist: row.checklist ?? null },
        className: typeToClass(row.type),
      })));
    }
    load().catch(() => {});
  }, [calendarId]);

  const [holidayOn, setHolidayOn] = useState(true);
  const [country, setCountry] = useState('US');
  const [holidays, setHolidays] = useState<EventInput[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<NewEvent | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchHolidays = useCallback(async (year: number, cc: string) => {
    const res = await fetch(`/api/holidays?year=${year}&country=${cc}`); const json = await res.json();
    const bg: EventInput[] = (json.holidays as { date: string; title: string }[]).map(h => ({
      start: h.date, end: h.date, allDay: true, title: h.title, display: 'background', className: 'holiday-bg', editable: false,
    })); setHolidays(bg);
  }, []);

  const handleDatesSet = useCallback((arg: { start: Date; end: Date }) => {
    const mid = new Date((arg.start.getTime() + arg.end.getTime()) / 2); const y = mid.getUTCFullYear(); fetchHolidays(y, country);
  }, [country, fetchHolidays]);

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
      checklist: { needsLocate: false, locateTicket: '', tasks: [] },
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
      type: e.extendedProps['type'] as JobType | undefined,
      checklist: (e.extendedProps['checklist'] as any) ?? { needsLocate: false, locateTicket: '', tasks: [] },
    }); setOpen(true);
  }, []);

  const updateEventById = useCallback((id: string, patch: Partial<NewEvent>) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, start: patch.start ?? (ev.start as string), end: patch.end ?? (ev.end as string | undefined), allDay: patch.allDay ?? (ev.allDay as boolean) } : ev));
  }, []);

  const handleEventDrop = useCallback(async (arg: any) => {
    const e = arg.event; if (!e.id) return;
    const newStart = e.start?.toISOString(); const newEnd = e.end ? e.end.toISOString() : newStart;
    const r = await fetch(`/api/events/${e.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startsAt: newStart, endsAt: newEnd, allDay: e.allDay }) });
    if (r.ok) updateEventById(e.id, { start: newStart, end: newEnd, allDay: e.allDay });
  }, [updateEventById]);

  const handleEventResize = useCallback(async (arg: any) => {
    const e = arg.event; if (!e.id) return;
    const newStart = e.start?.toISOString(); const newEnd = e.end ? e.end.toISOString() : newStart;
    const r = await fetch(`/api/events/${e.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startsAt: newStart, endsAt: newEnd, allDay: e.allDay }) });
    if (r.ok) updateEventById(e.id, { start: newStart, end: newEnd, allDay: e.allDay });
  }, [updateEventById]);

  const saveDraft = useCallback(async () => {
    if (!draft?.title) return;
    if (editId) {
      const r = await fetch(`/api/events/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draft.title, description: draft.description ?? '', startsAt: fromLocalInput(draft.start), endsAt: fromLocalInput(draft.end ?? draft.start), allDay: !!draft.allDay, location: draft.location ?? '', type: draft.type ?? null, checklist: draft.checklist ?? null }) });
      if (!r.ok) return; const u = await r.json();
      setEvents(prev => prev.map(ev => ev.id === editId ? {
        id: u.id, title: u.title, start: new Date(u.startsAt).toISOString(), end: new Date(u.endsAt).toISOString(), allDay: !!u.allDay,
        extendedProps: { location: u.location ?? '', description: u.description ?? '', type: u.type ?? null, checklist: u.checklist ?? null }, className: typeToClass(u.type),
      } : ev));
    } else {
      const r = await fetch(`/api/calendars/${calendarId}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draft.title, description: draft.description ?? '', startsAt: fromLocalInput(draft.start), endsAt: fromLocalInput(draft.end ?? draft.start), allDay: !!draft.allDay, location: draft.location ?? '', type: draft.type ?? null, checklist: draft.checklist ?? null }) });
      if (!r.ok) return; const c = await r.json();
      setEvents(p => [...p, { id: c.id, title: c.title, start: new Date(c.startsAt).toISOString(), end: new Date(c.endsAt).toISOString(), allDay: !!c.allDay,
        extendedProps: { location: c.location ?? '', description: c.description ?? '', type: c.type ?? null, checklist: c.checklist ?? null }, className: typeToClass(c.type) }]);
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
      body: JSON.stringify({ title: `${draft.title}`, description: draft.description ?? '', startsAt: fromLocalInput(draft.start), endsAt: fromLocalInput(draft.end ?? draft.start), allDay: !!draft.allDay, location: draft.location ?? '', type: draft.type ?? null, checklist: draft.checklist ?? null }) });
    if (!r.ok) return; const c = await r.json();
    setEvents(p => [...p, { id: c.id, title: c.title, start: new Date(c.startsAt).toISOString(), end: new Date(c.endsAt).toISOString(), allDay: !!c.allDay,
      extendedProps: { location: c.location ?? '', description: c.description ?? '', type: c.type ?? null, checklist: c.checklist ?? null }, className: typeToClass(c.type) }]);
  }, [draft, calendarId]);

  const allEvents = useMemo(() => (holidayOn ? [...events, ...holidays] : events), [events, holidays, holidayOn]);

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
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => { e.dataTransfer.setData('text/plain', id); };
  const onDropToColumn = (e: React.DragEvent<HTMLDivElement>, type: JobType) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) moveTodo(id, type); };
  const byType = (typ: JobType) => todos.filter(t => t.type === typ);

  const addSubtask = () => setDraft(d => d ? { ...d, checklist: { ...(d.checklist ?? { needsLocate: false, locateTicket: '', tasks: [] }), tasks: [...(d.checklist?.tasks ?? []), { id: uid(), title: '', done: false }] } } : d);
  const updateSubtask = (id: string, patch: Partial<SubTask>) => setDraft(d => d ? { ...d, checklist: { ...(d.checklist ?? { needsLocate: false, locateTicket: '', tasks: [] }), tasks: (d.checklist?.tasks ?? []).map(t => t.id === id ? { ...t, ...patch } : t) } } : d);
  const removeSubtask = (id: string) => setDraft(d => d ? { ...d, checklist: { ...(d.checklist ?? { needsLocate: false, locateTicket: '', tasks: [] }), tasks: (d.checklist?.tasks ?? []).filter(t => t.id !== id) } } : d);

  return (
    <div className="cal-shell">
      {/* controls */}
      <div className="surface p-4 mb-4 flex items-center gap-3 flex-wrap">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={holidayOn} onChange={e => setHolidayOn(e.target.checked)} />
          <span>Show public holidays</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="muted-sm">Country</span>
          <input value={country} onChange={e => setCountry(e.target.value.toUpperCase())} onBlur={() => { const y = new Date().getUTCFullYear(); fetchHolidays(y, country); }} className="country-input" />
        </div>
      </div>

      {/* calendar */}
      <div className="surface p-2 calendar-bleed">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={initialDate}
          height="auto"
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
              <label><div className="label">Start</div>
                <input type="datetime-local" value={toLocalInput(draft.start)} onChange={e => setDraft({ ...draft, start: fromLocalInput(e.target.value) })} />
              </label>
              <label><div className="label">End</div>
                <input type="datetime-local" value={toLocalInput(draft.end ?? draft.start)} onChange={e => setDraft({ ...draft, end: fromLocalInput(e.target.value) })} />
              </label>
              <label className="inline span-2"><input type="checkbox" checked={draft.allDay} onChange={e => setDraft({ ...draft, allDay: e.target.checked })} /><span>All day</span></label>
              <label><div className="label">Type</div>
                <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as NewEvent['type'] })}>
                  <option value="FENCE">Fence</option><option value="TEMP_FENCE">Temp Fence</option><option value="GUARDRAIL">Guardrail</option><option value="HANDRAIL">Handrail</option><option value="ATTENUATOR">Attenuator</option>
                </select>
              </label>
              <label><div className="label">Location</div>
                <input type="text" value={draft.location ?? ''} onChange={e => setDraft({ ...draft, location: e.target.value })} />
              </label>
              <label className="span-2"><div className="label">Description</div>
                <textarea value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} />
              </label>
              <div className="span-2">
                <div className="label">Checklist</div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={draft.checklist?.needsLocate ?? false} onChange={e => setDraft({ ...draft, checklist: { ...(draft.checklist ?? { needsLocate: false, locateTicket: '', tasks: [] }), needsLocate: e.target.checked } })} />
                    <span>Locate ticket</span>
                    <input type="text" className="ml-2 flex-1" value={draft.checklist?.locateTicket ?? ''} onChange={e => setDraft({ ...draft, checklist: { ...(draft.checklist ?? { needsLocate: false, locateTicket: '', tasks: [] }), locateTicket: e.target.value } })} placeholder="Ticket #" />
                  </label>
                  {(draft.checklist?.tasks ?? []).map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={t.done} onChange={e => updateSubtask(t.id, { done: e.target.checked })} />
                      <input type="text" className="flex-1" value={t.title} onChange={e => updateSubtask(t.id, { title: e.target.value })} />
                      <button type="button" className="todo-del" onClick={() => removeSubtask(t.id)} title="Delete">×</button>
                    </div>
                  ))}
                  <button type="button" className="btn" onClick={addSubtask}>Add subtask</button>
                </div>
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
                    <div key={t.id} className="todo-card" draggable onDragStart={(e) => onDragStart(e, t.id)}>
                      <label className="todo-row"><input type="checkbox" checked={false} onChange={() => completeTodo(t.id)} /><span className="todo-text">{t.title}</span></label>
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

function toLocalInput(isoLike: string) { const d = new Date(isoLike); const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fromLocalInput(local: string) { return new Date(local).toISOString(); }
function dateToLocalInput(d: Date) { const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
function typeToClass(t?: NewEvent['type']) { switch (t) { case 'FENCE': return 'evt-fence'; case 'TEMP_FENCE': return 'evt-temp-fence'; case 'GUARDRAIL': return 'evt-guardrail'; case 'HANDRAIL': return 'evt-handrail'; case 'ATTENUATOR': return 'evt-attenuator'; default: return ''; } }
function TodoAdder({ onAdd, placeholder }: { onAdd: (title: string) => void; placeholder: string }) {
  const [val, setVal] = useState(''); const submit = () => { if (val.trim()) { onAdd(val); setVal(''); } };
  return (<div className="todo-adder"><input className="todo-input" placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} /><button className="btn primary todo-add-btn" onClick={submit}>Add</button></div>);
}
