'use client';

import { useCallback, useEffect, useMemo, useRef, useState, TouchEvent, Suspense } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DateSelectArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import '@/styles/calendar.css';
import { getEmployees } from '@/employees';
import { getYardForDate } from '@/lib/yard';
import { getAbsentForDate } from '@/lib/absent';
import UnassignedSidebar from '@/components/UnassignedSidebar';
import {
  APP_TIMEZONE,
  APP_TZ,
  parseAppDateTime,
  parseAppDateOnly,
  formatInTimeZone,
  zonedStartOfDayUtc,
  addDaysUtc,
} from '@/lib/timezone';

type Props = { calendarId: string; initialYear?: number | null; initialMonth0?: number | null; };
type JobType = 'FENCE' | 'GUARDRAIL' | 'ATTENUATOR' | 'HANDRAIL' | 'TEMP_FENCE';
type Vendor = 'JORGE' | 'TONY' | 'CHRIS';
type Checklist = {
  locate?: { ticket?: string; requested?: string; expires?: string; contacted?: boolean };
  subtasks?: { id: string; text: string; done: boolean }[];
  employees?: string[];
};
type WorkShift = 'DAY' | 'NIGHT';
type PaymentType = 'DAILY' | 'ADJUSTED';
type NewEvent = { title: string; start: string; end?: string; allDay: boolean; location?: string; description?: string; invoice?: string; payment?: PaymentType; type?: JobType; vendor?: Vendor; payroll?: boolean; shift?: WorkShift; checklist?: Checklist | null };
type Todo = { id: string; title: string; notes?: string; done: boolean; type: JobType };

const DAY_MS = 86_400_000;
const TYPE_LABEL: Record<JobType, string> = { FENCE:'Fence', GUARDRAIL:'Guardrail', ATTENUATOR:'Attenuator', HANDRAIL:'Handrail', TEMP_FENCE:'Temporary Fence' };
const TYPE_COLOR: Record<JobType, string> = {
  FENCE: 'var(--evt-fence)',
  GUARDRAIL: 'var(--evt-guardrail)',
  ATTENUATOR: 'var(--evt-attenuator)',
  HANDRAIL: 'var(--evt-handrail)',
  TEMP_FENCE: 'var(--evt-temp-fence)',
};
const VENDOR_COLOR: Record<Vendor, string> = {
  JORGE: 'green',
  TONY: 'blue',
  CHRIS: 'orange',
};

/** Normalizes event payloads so downstream code can rely on {start,end}. */
type EventLikeWithLegacyFields = {
  start?: string | Date | null;
  end?: string | Date | null;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  allDay?: boolean | null;
};

type NormalizedEvent<T> = T & { start: string; end: string };

function normalizeEvent<T extends EventLikeWithLegacyFields>(obj: T): NormalizedEvent<T> {
  const startRaw = obj.start ?? obj.startsAt
  if (!startRaw) {
    const fallback = (obj as { allDay?: boolean }).allDay ? '1970-01-01' : '1970-01-01T00:00:00.000Z'
    return { ...obj, start: fallback, end: fallback } as NormalizedEvent<T>
  }
  const endRaw = obj.end ?? obj.endsAt ?? startRaw
  const allDay = Boolean((obj as { allDay?: boolean }).allDay)

  const cast = (value: string | Date | null | undefined, fallback: string): string => {
    if (typeof value === 'string' && value.trim().length > 0) return value
    if (value instanceof Date) {
      const iso = value.toISOString()
      return allDay ? iso.slice(0, 10) : iso
    }
    if (value == null) return fallback
    const str = String(value)
    return str.length ? str : fallback
  }

  const fallbackStart = allDay ? '1970-01-01' : '1970-01-01T00:00:00.000Z'
  const start = cast(startRaw, fallbackStart)
  const end = cast(endRaw, start)

  return { ...obj, start, end } as NormalizedEvent<T>
}

export default function CalendarWithData({ calendarId, initialYear, initialMonth0 }: Props) {
  const initialDate = useMemo(() => {
    const now = new Date();
    const y = Number.isFinite(initialYear as any) ? Number(initialYear) : now.getUTCFullYear();
    const m = Number.isFinite(initialMonth0 as any) ? Number(initialMonth0) : now.getUTCMonth();
    return new Date(y, m, 1);
  }, [initialYear, initialMonth0]);

  const [employees, setEmployees] = useState<any[]>([]);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [holidays, setHolidays] = useState<EventInput[]>([]);
  const [holidayOn, setHolidayOn] = useState(false);
  const [weather, setWeather] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const [yardTick, setYardTick] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [optsOpen, setOptsOpen] = useState(false);
  const touchStart = useRef<number | null>(null);

  // Event modal state
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewEvent>({
    title: '',
    start: '',
    end: '',
    allDay: true,
    location: '',
    description: '',
    invoice: '',
    payment: 'DAILY',
    type: 'FENCE',
    vendor: 'JORGE',
    payroll: false,
    shift: 'DAY',
    checklist: null,
  });

  useEffect(() => {
    setEmployees(getEmployees());
  }, []);

  useEffect(() => {
    const m = window.matchMedia('(max-width: 640px)');
    const handler = () => setIsMobile(m.matches);
    handler();
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const m = window.matchMedia('(max-width: 1024px)');
    const handler = () => setIsTablet(m.matches);
    handler();
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);

  const onYard = useCallback(() => {
    setYardTick(t => t + 1);
  }, []);

  useEffect(() => {
    window.addEventListener('yard-changed' as any, onYard);
    return () => window.removeEventListener('yard-changed' as any, onYard);
  }, []);

  const filterEventsForSearch = useCallback((events: EventInput[]) => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(ev => {
      const title = (ev.title || '').toLowerCase();
      const desc = ((ev.extendedProps as any)?.description || '').toLowerCase();
      const crew = ((ev.extendedProps as any)?.crew || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || crew.includes(q);
    });
  }, [searchQuery]);

  const [currentView, setCurrentView] = useState<'dayGridWeek' | 'dayGridMonth'>('dayGridMonth');
  const calendarRef = useRef<FullCalendar | null>(null);
  const [visibleDate, setVisibleDate] = useState<Date | null>(null);
  const [selectedDayYmd, setSelectedDayYmd] = useState<string>('');
  const selectedDay = useMemo(() => (selectedDayYmd ? new Date(`${selectedDayYmd}T00:00:00`) : null), [selectedDayYmd]);

  const selectDay = useCallback((input: Date | string | null | undefined) => {
    if (!input) {
      setSelectedDayYmd('');
      return;
    }
    if (typeof input === 'string') {
      const trimmed = input.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        setSelectedDayYmd(trimmed);
        return;
      }
      const parsed = new Date(input);
      if (!Number.isNaN(parsed.getTime())) {
        const { date } = formatInTimeZone(parsed, APP_TZ);
        setSelectedDayYmd(date);
      }
      return;
    }
    const { date } = formatInTimeZone(input, APP_TZ);
    setSelectedDayYmd(date);
  }, []);

  const refetchCalendar = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.refetchEvents();
  }, []);

  const fetchEventsForView = useCallback(
    async (
      info: { startStr?: string; endStr?: string; start?: Date; end?: Date },
      success: (events: EventInput[]) => void,
      failure?: (error: Error) => void,
    ) => {
      try {
        const base = new URL(`/api/calendars/${calendarId}/events`, window.location.origin);
        const startParam = info?.startStr ?? (info?.start ? info.start.toISOString() : null);
        const endParam = info?.endStr ?? (info?.end ? info.end.toISOString() : null);
        if (startParam) base.searchParams.set('start', startParam);
        if (endParam) base.searchParams.set('end', endParam);
        const res = await fetch(base.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const payload = await res.json();
        const rows = Array.isArray(payload?.events) ? payload.events : Array.isArray(payload) ? payload : [];
        const mapped = rows.map((row: any) => {
          const normalized = normalizeEvent(row);
          const hasQuantities = !!(row.hasQuantities ?? (row._count?.quantities ?? 0) > 0)
          const { invoice, payment, vendor, payroll, rest } = splitInvoice(normalized.description ?? '');
          
          return {
            id: normalized.id,
            title: normalized.title,
            start: normalized.start,
            end: normalized.end,
            allDay: !!normalized.allDay,
            extendedProps: {
              location: normalized.location ?? '',
              description: rest,
              invoice,
              payment,
              vendor,
              payroll,
              type: normalized.type ?? null,
              shift: normalized.shift ?? null,
              checklist: normalized.checklist ?? null,
              calendarId: normalized.calendarId ?? '',
              hasQuantities,
            },
            className: typeToClass(normalized.type),
            display: 'block',
          } as EventInput;
        });
        setEvents(mapped);
        const filtered = filterEventsForSearch(mapped);
        const result = holidayOn ? [...filtered, ...holidays] : filtered;
        success(result);
      } catch (err) {
        console.error(err);
        const error = err instanceof Error ? err : new Error('Failed to load events');
        if (failure) failure(error);
      }
    },
    [calendarId, filterEventsForSearch, holidayOn, holidays],
  );

  const handleDatesSet = useCallback((info: any) => {
    setVisibleDate(info.start);
  }, []);

  const handleDateClick = useCallback((info: any) => {
    const dateStr = info.dateStr || info.date?.toISOString().slice(0, 10);
    selectDay(dateStr);
    setDraft({
      title: '',
      start: dateStr,
      end: dateStr,
      allDay: true,
      location: '',
      description: '',
      invoice: '',
      payment: 'DAILY',
      type: 'FENCE',
      vendor: 'JORGE',
      payroll: false,
      shift: 'DAY',
      checklist: null,
    });
    setEditId(null);
    setOpen(true);
  }, [selectDay]);

  const handleEventClick = useCallback((info: EventClickArg) => {
    const event = info.event;
    const eventInput: EventInput = {
      id: event.id,
      title: event.title,
      start: event.start?.toISOString() || '',
      end: event.end?.toISOString() || '',
      allDay: event.allDay,
      extendedProps: event.extendedProps,
    };
    setSelectedEvent(eventInput);
  }, []);

  const handleEventDrop = useCallback(async (info: any) => {
    const { event } = info;
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          start: event.start?.toISOString(),
          end: event.end?.toISOString(),
          }),
        });
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to update event');
      return;
    }
      refetchCalendar();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    }
  }, [refetchCalendar]);

  const handleEventResize = useCallback(async (info: any) => {
    const { event } = info;
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: event.start?.toISOString(),
          end: event.end?.toISOString(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to update event');
        return;
      }
      refetchCalendar();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    }
  }, [refetchCalendar]);

  const dayCellDidMount = useCallback((info: any) => {
    const { el, date } = info;
    const btn = document.createElement('button');
    btn.className = 'day-add-btn';
    btn.textContent = '+';
    btn.onclick = () => {
      const dateStr = date.toISOString().slice(0, 10);
      selectDay(dateStr);
      setDraft({
        title: '',
        start: dateStr,
        end: dateStr,
        allDay: true,
        location: '',
        description: '',
        invoice: '',
        payment: 'DAILY',
        type: 'FENCE',
        vendor: 'JORGE',
        payroll: false,
        shift: 'DAY',
        checklist: null,
      });
      setEditId(null);
      setOpen(true);
    };
    el.appendChild(btn);
  }, [selectDay]);

  const eventContent = useCallback((arg: EventContentArg) => {
    const { event } = arg;
    const type = (event.extendedProps as any)?.type;
    const color = type ? TYPE_COLOR[type as JobType] : 'var(--evt-fence)';
    
    return (
      <div className="event-content" style={{ backgroundColor: color, color: 'white' }}>
        <div className="event-dot" style={{ backgroundColor: color }} />
        <span className="event-title">{event.title}</span>
      </div>
    );
  }, []);

  const handleSidebarQuickAdd = useCallback((employeeId: string, day: Date) => {
    const dayStr = day.toISOString().slice(0, 10);
    setDraft({
      title: '',
      start: dayStr,
      end: dayStr,
      allDay: true,
      location: '',
      description: '',
      invoice: '',
      payment: 'DAILY',
      type: 'FENCE',
      vendor: 'JORGE',
      payroll: false,
      shift: 'DAY',
      checklist: {
        employees: [employeeId],
        subtasks: [],
      },
    });
    setEditId(null);
    setOpen(true);
  }, []);

  return (
    <div className="calendar-container">
      {/* Calendar Controls */}
      <div className="cal-controls">
          <input
            type="text"
          placeholder="Search events..."
            value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        <div className="view-toggle">
            <button
            className={`btn ${currentView === 'dayGridMonth' ? 'primary' : 'ghost'}`}
            onClick={() => setCurrentView('dayGridMonth')}
          >
            Month
          </button>
          <button
            className={`btn ${currentView === 'dayGridWeek' ? 'primary' : 'ghost'}`}
            onClick={() => setCurrentView('dayGridWeek')}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar-wrapper">
        <div className="calendar-pane">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView={currentView}
              initialDate={initialDate}
              timeZone={APP_TZ}
              height="auto"
              dayCellDidMount={dayCellDidMount}
              eventContent={eventContent}
              displayEventTime={false}
              expandRows
              handleWindowResize
              windowResizeDelay={100}
              dayMaxEventRows
              fixedWeekCount={false}
              
              editable
              eventStartEditable
              eventDurationEditable
              
              datesSet={handleDatesSet}
              dateClick={handleDateClick}
              events={fetchEventsForView}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
              buttonText={{ today: 'Today' }}
              eventClassNames={arg => (arg.event.display === 'background' ? ['holiday-bg'] : [])}
            />
          </div>
        
        {/* Sidebar */}
        <div className="details-pane">
            {selectedDay ? (
              <UnassignedSidebar
                employees={employees}
                events={events}
                selectedDate={selectedDay}
                weekStartsOn={1}
                onQuickAdd={handleSidebarQuickAdd}
              />
            ) : (
              <div className="muted-sm">Click a day to see unassigned employees</div>
            )}
          
          {selectedEvent && (
            <div className="event-details">
              <h3>{selectedEvent.title}</h3>
              {selectedEvent.extendedProps && (selectedEvent.extendedProps as any).description && (
                <p>{(selectedEvent.extendedProps as any).description}</p>
              )}
              <button className="btn" onClick={() => {
                setEditId(selectedEvent.id as string);
                setDraft({
                  title: selectedEvent.title || '',
                  start: selectedEvent.start as string,
                  end: selectedEvent.end as string,
                  allDay: selectedEvent.allDay as boolean,
                  location: (selectedEvent.extendedProps as any)?.location || '',
                  description: (selectedEvent.extendedProps as any)?.description || '',
                  invoice: (selectedEvent.extendedProps as any)?.invoice || '',
                  payment: (selectedEvent.extendedProps as any)?.payment || 'DAILY',
                  type: (selectedEvent.extendedProps as any)?.type || 'FENCE',
                  vendor: (selectedEvent.extendedProps as any)?.vendor || 'JORGE',
                  payroll: (selectedEvent.extendedProps as any)?.payroll || false,
                  shift: (selectedEvent.extendedProps as any)?.shift || 'DAY',
                  checklist: (selectedEvent.extendedProps as any)?.checklist || null,
                });
                setOpen(true);
              }}>
                Edit Event
              </button>
              </div>
            )}
          </div>
        </div>

      {/* Event Modal */}
      {open && (
        <div className="modal-root">
          <div className="modal-card">
            <h3 className="modal-title">{editId ? 'Edit Event' : 'Add Event'}</h3>
            <div className="form-grid">
              <label>
                <div className="label">Title</div>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Event title"
                />
              </label>
              
              <label>
                <div className="label">Start Date</div>
                <input
                  type="date"
                  value={draft.start}
                  onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                />
              </label>
              
              <label>
                <div className="label">End Date</div>
                <input
                  type="date"
                  value={draft.end}
                  onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                />
              </label>
              
              <label className="inline">
                <input
                  type="checkbox"
                  checked={draft.allDay}
                  onChange={(e) => setDraft({ ...draft, allDay: e.target.checked })}
                />
                <span>All Day</span>
              </label>
              
              <label>
                <div className="label">Job Type</div>
                <select
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value as JobType })}
                >
                  {Object.entries(TYPE_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>
              
              <label>
                <div className="label">Location</div>
                <input
                  type="text"
                  value={draft.location || ''}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  placeholder="Event location"
                />
              </label>
              
              <label className="span-2">
                <div className="label">Description</div>
                <textarea
                  value={draft.description || ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Event description"
                />
              </label>
              </div>
            
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
                <button className="btn primary" onClick={async () => {
                try {
                  const url = editId ? `/api/events/${editId}` : '/api/events';
                  const method = editId ? 'PATCH' : 'POST';
                  
                  const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...draft,
                      calendarId,
                    }),
                  });
                  
                  if (!response.ok) {
                    const error = await response.json();
                    alert(error.error || 'Failed to save event');
                    return;
                  }
                  
                  setOpen(false);
                  refetchCalendar();
                } catch (error) {
                  console.error('Error saving event:', error);
                  alert('Failed to save event');
                }
              }}>
                {editId ? 'Update' : 'Create'}
              </button>
                      </div>
                    </div>
                </div>
      )}
    </div>
  );
}

// Helper functions
function splitInvoice(description: string) {
  const invoiceMatch = description.match(/INVOICE:\s*([^\n]+)/i);
  const paymentMatch = description.match(/PAYMENT:\s*([^\n]+)/i);
  const vendorMatch = description.match(/VENDOR:\s*([^\n]+)/i);
  const payrollMatch = description.match(/PAYROLL:\s*([^\n]+)/i);
  
  const invoice = invoiceMatch ? invoiceMatch[1].trim() : '';
  const payment = paymentMatch ? paymentMatch[1].trim() as PaymentType : 'DAILY';
  const vendor = vendorMatch ? vendorMatch[1].trim() as Vendor : 'JORGE';
  const payroll = payrollMatch ? payrollMatch[1].trim().toLowerCase() === 'true' : false;
  
  const rest = description
    .replace(/INVOICE:\s*[^\n]+/gi, '')
    .replace(/PAYMENT:\s*[^\n]+/gi, '')
    .replace(/VENDOR:\s*[^\n]+/gi, '')
    .replace(/PAYROLL:\s*[^\n]+/gi, '')
    .trim();
  
  return { invoice, payment, vendor, payroll, rest };
}

function typeToClass(type?: string | null): string {
  if (!type) return 'evt-fence';
  return `evt-${type.toLowerCase().replace('_', '-')}`;
}