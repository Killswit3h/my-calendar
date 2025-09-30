'use client';

import { useCallback, useEffect, useMemo, useRef, useState, FormEvent, TouchEvent, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DateSelectArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import * as chrono from 'chrono-node';
import '@/styles/calendar.css';
import EmployeeMultiSelect from './EmployeeMultiSelect';
import CustomerCombobox from './CustomerCombobox';
import { getEmployees } from '@/employees';
import { eventOverlapsLocalDay, ymdLocal } from '@/lib/dateUtils';
import { getYardForDate } from '@/lib/yard';
import UnassignedSidebar from '@/components/UnassignedSidebar';

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

const EmployeesLink = () => {
  const pathname = usePathname();
  const href = `/employees?from=${encodeURIComponent(pathname)}`;
  return <Link href={href} className="btn">Employees</Link>;
};

const IconType = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}><path fill="currentColor" d="M3 6l3-3h8l3 3v12l-3 3H6l-3-3V6z"/></svg>
);
const IconClock = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}><path fill="currentColor" d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm1 11h5v2h-7V6h2z"/></svg>
);
const IconLocation = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}><path fill="currentColor" d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z"/></svg>
);
const IconTicket = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}><path fill="currentColor" d="M21 5H3v4h1a2 2 0 1 1 0 4H3v4h18v-4h-1a2 2 0 1 1 0-4h1V5z"/></svg>
);

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
  const startRaw = obj.start ?? obj.startsAt;
  if (!startRaw) {
    const fallback = (obj as { allDay?: boolean }).allDay ? '1970-01-01' : '1970-01-01T00:00:00.000Z';
    return { ...obj, start: fallback, end: fallback } as NormalizedEvent<T>;
  }
  const endRaw = obj.end ?? obj.endsAt ?? startRaw;
  const allDay = Boolean((obj as { allDay?: boolean }).allDay);

  const cast = (value: string | Date | null | undefined, fallback: string): string => {
    if (typeof value === 'string' && value.trim().length > 0) return value;
    if (value instanceof Date) {
      const iso = value.toISOString();
      return allDay ? iso.slice(0, 10) : iso;
    }
    if (value == null) return fallback;
    const str = String(value);
    return str.length ? str : fallback;
  };

  const fallbackStart = allDay ? '1970-01-01' : '1970-01-01T00:00:00.000Z';
  const start = cast(startRaw, fallbackStart);
  const end = cast(endRaw, start);

  return { ...obj, start, end } as NormalizedEvent<T>;
}

export default function CalendarWithData({ calendarId, initialYear, initialMonth0 }: Props) {
  const initialDate = useMemo(() => {
    const now = new Date();
    const y = Number.isFinite(initialYear as any) ? Number(initialYear) : now.getUTCFullYear();
    const m0 = Number.isFinite(initialMonth0 as any) ? Math.min(11, Math.max(0, Number(initialMonth0))) : now.getUTCMonth();
    return new Date(Date.UTC(y, m0, now.getUTCDate()));
  }, [initialYear, initialMonth0]);

  const employees = useMemo(() => getEmployees(), []);

  const [events, setEvents] = useState<EventInput[]>([]);
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
  const [userChangedStart, setUserChangedStart] = useState(false);
  const [userChangedEnd, setUserChangedEnd] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const autoRef = useRef<any>(null);
  const [locInput, setLocInput] = useState('');
  const [quickText, setQuickText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const filterEventsForSearch = useCallback((list: EventInput[]) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(ev => {
      const title = (ev.title || '').toLowerCase();
      const desc = ((ev.extendedProps as any)?.description || '').toLowerCase();
      const crew = ((ev.extendedProps as any)?.crew || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || crew.includes(q);
    });
  }, [searchQuery]);
  const [currentView, setCurrentView] = useState<'dayGridWeek' | 'dayGridMonth'>('dayGridMonth');
  const calendarRef = useRef<FullCalendar | null>(null);
  const [visibleDate, setVisibleDate] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
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
  const [isTablet, setIsTablet] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const [yardTick, setYardTick] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [optsOpen, setOptsOpen] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const m = window.matchMedia('(max-width: 640px)');
    const handler = () => setIsMobile(m.matches);
    handler();
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const onYard = () => setYardTick(v => v + 1);
    window.addEventListener('yard-changed' as any, onYard);
    return () => window.removeEventListener('yard-changed' as any, onYard);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const handler = () => setIsTablet(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    refetchCalendar();
  }, [refetchCalendar, searchQuery, holidayOn, holidays]);

  useEffect(() => {
    if (descRef.current) {
      descRef.current.style.height = 'auto';
      descRef.current.style.height = Math.min(descRef.current.scrollHeight, 200) + 'px';
    }
  }, [draft?.description]);

  useEffect(() => { if (open) setLocInput(draft?.location ?? ''); }, [open, draft?.location]);

  useEffect(() => {
    if (!draft) return;
    const t = setTimeout(() => setDraft(d => d ? { ...d, location: locInput } : d), 300);
    return () => clearTimeout(t);
  }, [locInput]);

  useEffect(() => {
    if (!open) return;
    const init = () => {
      if (!locationRef.current || !(window as any).google) return;
      autoRef.current = new (window as any).google.maps.places.Autocomplete(locationRef.current, { componentRestrictions: { country: 'us' } });
      autoRef.current.addListener('place_changed', () => {
        const place = autoRef.current.getPlace();
        const addr = place.formatted_address || place.name || '';
        setLocInput(addr);
        setDraft(d => d ? { ...d, location: addr } : d);
      });
    };
    if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
      init();
    } else {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!key) return;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
      return () => { document.head.removeChild(script); };
    }
  }, [open]);

  const views: ('dayGridWeek' | 'dayGridMonth')[] = ['dayGridWeek', 'dayGridMonth'];
  const changeView = useCallback((v: 'dayGridWeek' | 'dayGridMonth') => {
    setCurrentView(v);
    calendarRef.current?.getApi().changeView(v);
  }, []);
  const cycleView = useCallback((dir: number) => {
    const idx = views.indexOf(currentView);
    const next = views[(idx + dir + views.length) % views.length];
    changeView(next);
  }, [currentView, changeView]);
  const handleTouchStart = (e: TouchEvent) => { touchStart.current = e.changedTouches[0].clientX; };
  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) cycleView(dx < 0 ? 1 : -1);
    touchStart.current = null;
  };

  const escapeReg = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const highlightText = (text: string, q: string) => {
    if (!q) return text;
    const re = new RegExp(`(${escapeReg(q)})`, 'ig');
    return text.replace(re, '<mark>$1</mark>');
  };

  const handleQuickAdd = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    let txt = quickText.trim();
    if (!txt) return;

    const typeMatch = txt.match(/\b(temp(?:orary)?\s*fence|guardrail|fence|attenuator|handrail)\b/i);
    let type: JobType | null = null;
    if (typeMatch) {
      const kw = typeMatch[1].toLowerCase();
      if (kw.includes('temp')) type = 'TEMP_FENCE';
      else if (kw === 'guardrail') type = 'GUARDRAIL';
      else if (kw === 'attenuator') type = 'ATTENUATOR';
      else if (kw === 'handrail') type = 'HANDRAIL';
      else if (kw === 'fence') type = 'FENCE';
      txt = txt.replace(typeMatch[0], '').trim();
    }

    const parsed = chrono.parse(txt)[0];
    if (parsed && parsed.start) {
      const hasTime = parsed.start.isCertain('hour');
      const start = parsed.start.date();
      const end = parsed.end
        ? parsed.end.date()
        : hasTime
          ? new Date(start.getTime() + 60 * 60 * 1000)
          : start;
      const title = (txt.replace(parsed.text, '').trim()) || 'Event';
      const r = await fetch(`/api/calendars/${calendarId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: '',
          start: start.toISOString(),
          end: end.toISOString(),
          allDay: !hasTime,
          location: '',
          type,
          shift: null,
          checklist: null,
        }),
      });
      if (r.ok) {
        const c = await r.json();
        const normalized = normalizeEvent(c);
        setEvents(p => [
          ...p,
          {
            id: normalized.id,
            title: normalized.title,
            start: normalized.start,
            end: normalized.end,
            allDay: !!normalized.allDay,
            extendedProps: {
              location: normalized.location ?? '',
              ...splitInvoiceProps(normalized.description ?? ''),
              type: normalized.type ?? null,
              shift: normalized.shift ?? null,
              checklist: normalized.checklist ?? null,
              calendarId: normalized.calendarId ?? '',
            },
            className: typeToClass(normalized.type),
            display: 'block',
          },
        ]);
        refetchCalendar();
      }
    } else {
      const nowIso = new Date().toISOString();
      setDraft({ title: txt, start: toLocalInput(nowIso), end: toLocalInput(nowIso), allDay: false, location: '', description: '', type: type ?? 'FENCE', payment: 'DAILY', vendor: 'JORGE', payroll: false, checklist: defaultChecklist() });
      setEditId(null);
      setOpen(true);
    }
    setQuickText('');
  }, [quickText, calendarId, refetchCalendar]);

  const fetchHolidays = useCallback(async (year: number, cc: string) => {
    const res = await fetch(`/api/holidays?year=${year}&country=${cc}`); const json = await res.json();
    const bg: EventInput[] = (json.holidays as { date: string; title: string }[]).map(h => ({
      start: h.date, end: h.date, allDay: true, title: h.title, display: 'background', className: 'holiday-bg', editable: false,
    })); setHolidays(bg);
  }, []);

  const fetchWeather = useCallback(async (start: Date, end: Date, c: { lat: number; lon: number }) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmtLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const startDate = fmtLocal(start);
    const endAdj = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
    const endDate = fmtLocal(endAdj);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${startDate}&end_date=${endDate}&temperature_unit=fahrenheit`;
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

  useEffect(() => {
    if (!coords) return;
    const y = initialDate.getUTCFullYear();
    const m = initialDate.getUTCMonth();
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 1));
    fetchWeather(start, end, coords);
  }, [coords, initialDate, fetchWeather]);

  const handleDatesSet = useCallback((arg: { start: Date; end: Date; view: any }) => {
    setVisibleRange({ start: arg.start, end: arg.end });
    setCurrentView(arg.view.type);
    const mid = new Date((arg.start.getTime() + arg.end.getTime()) / 2);
    setVisibleDate(mid);
    const y = mid.getUTCFullYear();
    fetchHolidays(y, country);
    if (coords) fetchWeather(arg.start, arg.end, coords);
  }, [country, fetchHolidays, coords, fetchWeather]);

  const weatherIcon = (code: number, pop: number) => {
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
    // Override with explicit Fahrenheit unit for display
    try { txt.textContent = `${Math.round(data.tmax)}\u00B0F ${Math.round(data.pop)}%`; } catch {}
    a.href = `https://www.google.com/search?q=weather%20${encodeURIComponent(`${coords.lat.toFixed(2)},${coords.lon.toFixed(2)} ${ymd}`)}`;
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    ['click','mousedown','mouseup','pointerdown','pointerup','touchstart','touchend'].forEach(evt => {
      a.addEventListener(evt as any, (e) => { e.stopPropagation(); });
    });
    const dayNum = top.querySelector('.fc-daygrid-day-number');
    if (dayNum && dayNum.parentNode) {
      dayNum.parentNode.insertBefore(a, dayNum);
    } else {
      top.insertBefore(a, top.firstChild);
    }

    // Add a small plus button at bottom-right for creating an event
    const frame = cell.querySelector('.fc-daygrid-day-frame') as HTMLElement | null;
    if (frame) {
      const prev = frame.querySelector('.day-add-btn');
      if (prev) prev.remove();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-add-btn';
      btn.title = 'Add event';
      btn.setAttribute('aria-label', `Add event on ${ymd}`);
      btn.textContent = '+';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const parts = ymd.split('-').map(n => parseInt(n, 10));
        const d = new Date(parts[0], parts[1]-1, parts[2], 0, 0, 0, 0);
        const startLocal = dateToLocalInput(d);
        setEditId(null);
        setDraft({
          title: 'Event',
          start: fromLocalInput(startLocal),
          end: fromLocalInput(startLocal),
          allDay: true,
          location: '',
          description: '',
          type: 'FENCE',
          payment: 'DAILY',
          vendor: 'JORGE',
          payroll: false,
          shift: 'DAY',
          checklist: defaultChecklist(),
        });
        setOpen(true);
      });
      frame.appendChild(btn);
    }
  };

  const dayCellDidMount = useCallback((arg: { date: Date; el: HTMLElement }) => {
    injectBadgeIntoCell(arg.el);

    const el = arg.el;
    const dateStr = dateToLocalInput(arg.date).slice(0, 10);
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
        const response: Response = await fetch(`/api/calendars/${calendarId}/events`, {
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
        if (!response.ok) return;
        const c = await response.json();
        const normalized = normalizeEvent(c);
        setEvents(p => [
          ...p,
          {
            id: normalized.id,
            title: normalized.title,
            start: normalized.start,
            end: normalized.end,
            allDay: !!normalized.allDay,
            extendedProps: {
              location: normalized.location ?? '',
              ...splitInvoiceProps(normalized.description ?? ''),
              type: normalized.type ?? null,
              shift: normalized.shift ?? null,
              checklist: normalized.checklist ?? null,
              calendarId: normalized.calendarId ?? '',
            },
            className: typeToClass(normalized.type),
            display: 'block',
          },
        ]);
        refetchCalendar();
        try { await fetch(`/api/todos/${id}`, { method: 'DELETE' }); } catch {}
        setTodos(p => p.filter(t => t.id !== id));
      } catch {}
    };
    el.addEventListener('dragover', onDragOver as any);
    el.addEventListener('drop', onDrop as any);
  }, [weather, coords, calendarId, refetchCalendar]);

  useEffect(() => {
    const cells = document.querySelectorAll('.fc-daygrid-day');
    cells.forEach(injectBadgeIntoCell);
  }, [weather, coords]);

  const handleDateClick = useCallback((arg: { date: Date }) => {
    setSelectedDay(new Date(arg.date.getFullYear(), arg.date.getMonth(), arg.date.getDate()));
  }, []);

  const freeCount = useMemo(() => {
    if (!selectedDay) return 0;
    const day = selectedDay;
    const key = ymdLocal(day);
    const assigned = new Set<string>(getYardForDate(key));
    for (const ev of events) {
      const ex: any = ev.extendedProps ?? {};
      const ids: string[] = Array.isArray(ex?.checklist?.employees) ? ex.checklist.employees : [];
      if (!ids.length) continue;
      if (eventOverlapsLocalDay({ start: ev.start as any, end: ev.end as any, allDay: !!ev.allDay }, day)) {
        ids.forEach(id => assigned.add(id));
      }
    }
    return employees.filter(e => !assigned.has(e.id)).length;
  }, [selectedDay, events, employees, yardTick]);

  const handleSidebarQuickAdd = useCallback((employeeId: string, day: Date) => {
    // Prefill an all-day event on the selected local day with the chosen employee
    const startLocal = dateToLocalInput(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0));
    setDraft({
      title: 'Event',
      start: startLocal,
      end: startLocal,
      allDay: true,
      location: '',
      description: '',
      type: 'FENCE',
      payment: 'DAILY',
      vendor: 'JORGE',
      payroll: false,
      checklist: { ...(defaultChecklist()), employees: [employeeId] },
    });
    setEditId(null);
    setOpen(true);
  }, []);


  async function geocode(q: string): Promise<{ lat: number; lon: number } | null> {
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

  const handleSelect = useCallback((sel: DateSelectArg) => {
    setEditId(null);

    const startLocal = dateToLocalInput(sel.start);
    const endLocal = dateToLocalInput(sel.end ?? sel.start);

    setDraft({
      title: '',
      start: fromLocalInput(startLocal),
      end: fromLocalInput(endLocal),
      allDay: sel.allDay,
      type: 'FENCE',
      invoice: '',
      payment: 'DAILY',
      vendor: 'JORGE',
      payroll: false,
      shift: 'DAY',
      checklist: defaultChecklist(),
    });
    if (sel.start) setSelectedDay(new Date(sel.start.getFullYear(), sel.start.getMonth(), sel.start.getDate()));
    setOpen(true);
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const e = arg.event; if (!e.id) return;
    if (isTablet) {
      setSelectedEvent({
        id: e.id,
        title: e.title,
        start: e.start ? e.start.toISOString() : new Date().toISOString(),
        end: e.end ? e.end.toISOString() : undefined,
        allDay: e.allDay,
        extendedProps: e.extendedProps,
        className: e.classNames.join(' '),
      } as EventInput);
    } else {
      setEditId(e.id);
      setDraft({
        title: e.title,
        start: e.start ? e.start.toISOString() : new Date().toISOString(),
        end: e.end ? e.end.toISOString() : undefined,
        allDay: e.allDay,
        location: e.extendedProps['location'] as string | undefined,
        description: e.extendedProps['description'] as string | undefined,
        invoice: e.extendedProps['invoice'] as string | undefined,
        payment: e.extendedProps['payment'] as PaymentType | undefined,
        vendor: e.extendedProps['vendor'] as Vendor | undefined,
        payroll: e.extendedProps['payroll'] as boolean | undefined,
        type: e.extendedProps['type'] as JobType | undefined,
        shift: e.extendedProps['shift'] as WorkShift | undefined,
        checklist: (e.extendedProps as any)['checklist'] ?? defaultChecklist(),
      });
      setOpen(true);
    }
  }, [isTablet]);

  const openEditFromDetails = useCallback(() => {
    if (!selectedEvent) return;
    const e: any = selectedEvent;
    setEditId(e.id as string);
    setDraft({
      title: e.title,
      start: e.start as string,
      end: e.end as string | undefined,
      allDay: e.allDay as boolean,
      location: e.extendedProps?.location as string | undefined,
      description: e.extendedProps?.description as string | undefined,
      invoice: e.extendedProps?.invoice as string | undefined,
      payment: e.extendedProps?.payment as PaymentType | undefined,
      vendor: e.extendedProps?.vendor as Vendor | undefined,
      payroll: e.extendedProps?.payroll as boolean | undefined,
      type: e.extendedProps?.type as JobType | undefined,
      shift: e.extendedProps?.shift as WorkShift | undefined,
      checklist: e.extendedProps?.checklist ?? defaultChecklist(),
    });
    setOpen(true);
  }, [selectedEvent]);

  const updateEventById = useCallback((id: string, patch: Partial<NewEvent>) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, start: patch.start ?? (ev.start as string), end: patch.end ?? (ev.end as string | undefined), allDay: patch.allDay ?? (ev.allDay as boolean) } : ev));
    refetchCalendar();
  }, [refetchCalendar]);

  const handleEventDrop = useCallback(async (arg: any) => {
    const e = arg.event; if (!e.id) return;
    const newStart = e.startStr ?? e.start?.toISOString() ?? null;
    const newEnd = e.endStr ?? (e.end ? e.end.toISOString() : newStart);
    const r = await fetch(`/api/events/${e.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: newStart, end: newEnd, allDay: e.allDay }) });
    if (r.ok) updateEventById(e.id, { start: newStart!, end: newEnd!, allDay: e.allDay });
    else {
      const err = await r.json().catch(() => ({}));
      alert(err.error || 'Failed to move event');
    }
  }, [updateEventById]);

  const handleEventResize = useCallback(async (arg: any) => {
    const e = arg.event; if (!e.id) return;
    const newStart = e.startStr ?? e.start?.toISOString() ?? null;
    const newEnd = e.endStr ?? (e.end ? e.end.toISOString() : newStart);
    const r = await fetch(`/api/events/${e.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: newStart, end: newEnd, allDay: e.allDay }) });
    if (r.ok) updateEventById(e.id, { start: newStart!, end: newEnd!, allDay: e.allDay });
    else {
      const err = await r.json().catch(() => ({}));
      alert(err.error || 'Failed to resize event');
    }
  }, [updateEventById]);

  const saveDraft = useCallback(async () => {
    if (!draft?.title) return;
    if (editId) {
      const r = await fetch(`/api/events/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draft.title, description: composeDescription(draft.description ?? '', draft.invoice ?? '', draft.payment ?? '', draft.vendor ?? '', draft.payroll ?? false), start: fromLocalInput(draft.start), end: fromLocalInput(draft.end ?? draft.start), startsAt: fromLocalInput(draft.start), endsAt: fromLocalInput(draft.end ?? draft.start), allDay: !!draft.allDay, location: draft.location ?? '', type: draft.type ?? null, payment: draft.payment ?? null, vendor: draft.vendor ?? null, payroll: draft.payroll ?? null, shift: draft.shift ?? null, checklist: draft.checklist ?? null }) });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert(err.error || 'Failed to update event');
        return;
      }
      const u = await r.json();
      const normalized = normalizeEvent(u);
      setEvents(prev => prev.map(ev => (ev.id === editId ? {
        id: normalized.id,
        title: normalized.title,
        start: normalized.start,
        end: normalized.end,
        allDay: !!normalized.allDay,
        extendedProps: {
          location: normalized.location ?? '',
          ...splitInvoiceProps(normalized.description ?? ''),
          type: normalized.type ?? null,
          shift: normalized.shift ?? null,
          checklist: normalized.checklist ?? null,
          calendarId: normalized.calendarId ?? '',
        },
        className: typeToClass(normalized.type),
        display: 'block',
        } : ev)));
    } else {
      const r = await fetch(`/api/calendars/${calendarId}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draft.title, description: composeDescription(draft.description ?? '', draft.invoice ?? '', draft.payment ?? '', draft.vendor ?? '', draft.payroll ?? false), start: fromLocalInput(draft.start), end: fromLocalInput(draft.end ?? draft.start), startsAt: fromLocalInput(draft.start), endsAt: fromLocalInput(draft.end ?? draft.start), allDay: !!draft.allDay, location: draft.location ?? '', type: draft.type ?? null, payment: draft.payment ?? null, vendor: draft.vendor ?? null, payroll: draft.payroll ?? null, shift: draft.shift ?? null, checklist: draft.checklist ?? null }) });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert(err.error || 'Failed to create event');
        return;
      }
      const c = await r.json();
      const normalized = normalizeEvent(c);
      setEvents(p => [
        ...p,
        {
          id: normalized.id,
          title: normalized.title,
          start: normalized.start,
          end: normalized.end,
          allDay: !!normalized.allDay,
          extendedProps: {
            location: normalized.location ?? '',
            ...splitInvoiceProps(normalized.description ?? ''),
            type: normalized.type ?? null,
            shift: normalized.shift ?? null,
            checklist: normalized.checklist ?? null,
            calendarId: normalized.calendarId ?? '',
          },
          className: typeToClass(normalized.type),
          display: 'block',
        },
      ]);
      refetchCalendar();
    }
    setOpen(false); setDraft(null); setEditId(null);
  }, [draft, editId, calendarId, refetchCalendar]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setDraft(null); setEditId(null); }
      if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') { e.preventDefault(); saveDraft(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, saveDraft]);

  const deleteCurrent = useCallback(async () => {
    if (!editId) return; await fetch(`/api/events/${editId}`, { method: 'DELETE' });
    setEvents(prev => prev.filter(e => e.id !== editId));
    refetchCalendar();
    setOpen(false); setDraft(null); setEditId(null);
  }, [editId, refetchCalendar]);

  const duplicateCurrent = useCallback(async () => {
    if (!draft) return;
    const r = await fetch(`/api/calendars/${calendarId}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${draft.title}`, description: composeDescription(draft.description ?? '', draft.invoice ?? '', draft.payment ?? '', draft.vendor ?? '', draft.payroll ?? false), start: fromLocalInput(draft.start), end: fromLocalInput(draft.end ?? draft.start), allDay: !!draft.allDay, location: draft.location ?? '', type: draft.type ?? null, shift: draft.shift ?? null, checklist: draft.checklist ?? null }) });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err.error || 'Failed to duplicate event');
      return;
    }
    const c = await r.json();
    const normalized = normalizeEvent(c);
    setEvents(p => [
      ...p,
      {
        id: normalized.id,
        title: normalized.title,
        start: normalized.start,
        end: normalized.end,
        allDay: !!normalized.allDay,
        extendedProps: {
          location: normalized.location ?? '',
          ...splitInvoiceProps(normalized.description ?? ''),
          type: normalized.type ?? null,
          shift: normalized.shift ?? null,
          checklist: normalized.checklist ?? null,
          calendarId: normalized.calendarId ?? '',
        },
        className: typeToClass(normalized.type),
        display: 'block',
      },
    ]);
    refetchCalendar();
  }, [draft, calendarId, refetchCalendar]);

  const updateStart = (iso: string) => {
    if (!draft) return;
    const prevStart = new Date(draft.start);
    const newStartDate = new Date(iso);
    let endIso = draft.end;
    if (!userChangedEnd && draft.end) {
      const duration = new Date(draft.end).getTime() - prevStart.getTime();
      endIso = new Date(newStartDate.getTime() + duration).toISOString();
    }
    setDraft({ ...draft, start: iso, end: endIso });
    setUserChangedStart(true);
  };

  const updateEnd = (iso: string) => {
    if (!draft) return;
    const endDate = new Date(iso);
    if (endDate < new Date(draft.start)) endDate.setTime(new Date(draft.start).getTime());
    setDraft({ ...draft, end: endDate.toISOString() });
    setUserChangedEnd(true);
  };

  const toggleShift = () => {
    if (!draft) return;
    const newShift = (draft.shift ?? 'DAY') === 'DAY' ? 'NIGHT' : 'DAY';
    let startIso = draft.start;
    let endIso = draft.end ?? draft.start;
    if (newShift === 'NIGHT' && !userChangedStart && !userChangedEnd) {
      const s = new Date(draft.start);
      s.setHours(19, 0, 0, 0);
      const e = new Date(s);
      e.setDate(e.getDate() + 1);
      e.setHours(5, 0, 0, 0);
      startIso = s.toISOString();
      endIso = e.toISOString();
    }
    setDraft({ ...draft, shift: newShift, start: startIso, end: endIso });
  };

  const currentTypeColor = draft ? TYPE_COLOR[(draft.type ?? 'FENCE') as JobType] : 'transparent';
  const currentVendorColor = draft ? VENDOR_COLOR[(draft.vendor ?? 'JORGE') as Vendor] : 'transparent';

  const handleDescKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const start = e.currentTarget.selectionStart;
      const value = e.currentTarget.value;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const line = value.slice(lineStart, start);
      if (line.startsWith('- ')) {
        e.preventDefault();
        const insert = '\n- ';
        const newVal = value.slice(0, start) + insert + value.slice(e.currentTarget.selectionEnd);
        setDraft(d => d ? { ...d, description: newVal } : d);
        requestAnimationFrame(() => {
          if (descRef.current) {
            const pos = start + insert.length;
            descRef.current.selectionStart = descRef.current.selectionEnd = pos;
          }
        });
      }
    }
  };

  const eventContent = useCallback((arg: EventContentArg) => {
    const frag = document.createElement('div');
    frag.style.display = 'flex';
    frag.style.alignItems = 'center';
    frag.style.gap = '0.25rem';
    const span = document.createElement('span');
    span.className = 'evt-title';
    span.innerHTML = highlightText(arg.event.title, searchQuery);
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
  }, [highlightText, searchQuery]);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [reportDate, setReportDate] = useState<string>('');
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
      <div className="cal-controls calendar-bleed flex-col items-start gap-2 flex-nowrap">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="options-wrap">
            <button type="button" className="icon-btn" aria-label="Open menu" aria-haspopup="menu" aria-expanded={optsOpen} onClick={() => setOptsOpen(v => !v)}>⋮</button>
            {optsOpen ? (
              <div className="menu-card" role="menu" onMouseLeave={() => setOptsOpen(false)}>
                <button className="menu-row" role="menuitem" onClick={() => { setHolidayDialog(true); setOptsOpen(false); }}><span className="menu-ico">📅</span><span className="menu-text">Holidays</span></button>
                <button className="menu-row" role="menuitem" onClick={() => { setWeatherDialog(true); setOptsOpen(false); }}><span className="menu-ico">⛅</span><span className="menu-text">Weather</span></button>
                <Link className="menu-row" role="menuitem" href="/customers" onClick={() => setOptsOpen(false)}><span className="menu-ico">📂</span><span className="menu-text">Customers</span></Link>
                <Suspense fallback={<span className="menu-row" aria-disabled>Employees</span>}><EmployeesLink /></Suspense>
              </div>
            ) : null}
          </div>
          <form id="quick-add-form" onSubmit={handleQuickAdd} className="quick-add-form">
            <input
              type="text"
              placeholder="Quick add event"
              value={quickText}
              onChange={e => setQuickText(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn primary">Add</button>
          </form>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="options-wrap">
            <button
              type="button"
              className="btn"
              aria-haspopup="menu"
              aria-expanded={optsOpen}
              onClick={() => setOptsOpen(v => !v)}
            >Options ▾</button>
            {optsOpen ? (
              <div className="menu-card" role="menu" onMouseLeave={() => setOptsOpen(false)}>
                <button className="menu-item" role="menuitem" onClick={() => { setHolidayDialog(true); setOptsOpen(false); }}>Holidays…</button>
                <button className="menu-item" role="menuitem" onClick={() => { setWeatherDialog(true); setOptsOpen(false); }}>Weather…</button>
                <a className="menu-item" role="menuitem" href="/customers" onClick={() => setOptsOpen(false)}>Customers</a>
                <Suspense fallback={<span className="menu-item" aria-disabled>Employees</span>}>
                  <EmployeesLink />
                </Suspense>
              </div>
            ) : null}
          </div>
          <div className="view-toggle inline-flex" style={{ gap: '4px' }}>
            <button type="button" className={`btn${currentView==='dayGridWeek' ? ' primary' : ''}`} onClick={() => changeView('dayGridWeek')}>Week</button>
            <button type="button" className={`btn${currentView==='dayGridMonth' ? ' primary' : ''}`} onClick={() => changeView('dayGridMonth')}>Month</button>
          </div>
          <button className="btn" onClick={() => {
            // Default to today's local date regardless of current view
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            setReportDate(`${y}-${m}-${d}`);
            setReportPickerOpen(true);
          }}>Generate Daily Report</button>
        </div>
      </div>

      {/* calendar */}
      {isTablet ? (
        <div className="tablet-split calendar-bleed" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="calendar-pane surface p-2">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView={currentView}
              initialDate={initialDate}
              timeZone="local"
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
          <div className="details-pane surface" style={{ padding: '1rem' }}>
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
            <div style={{ height: '1rem' }} />
            {selectedEvent ? (
              <div>
                <h3 dangerouslySetInnerHTML={{ __html: highlightText(selectedEvent.title || '', searchQuery) }} />
                {selectedEvent.extendedProps && (selectedEvent.extendedProps as any).description ? (
                  <p dangerouslySetInnerHTML={{ __html: highlightText((selectedEvent.extendedProps as any).description || '', searchQuery) }} />
                ) : null}
                <button className="btn" onClick={openEditFromDetails}>Edit</button>
              </div>
            ) : (
              <div className="muted-sm">Select an event</div>
            )}
          </div>
        </div>
      ) : (
        <div className="tablet-split calendar-bleed" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="calendar-pane surface p-2">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView={currentView}
              initialDate={initialDate}
              timeZone="local"
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
          {/* Hide sidebar on mobile; drawer handles it */}
          <div className="details-pane surface" style={{ padding: '1rem' }}>
            {!isMobile ? (
              selectedDay ? (
                <UnassignedSidebar
                  employees={employees}
                  events={events}
                  selectedDate={selectedDay}
                  weekStartsOn={1}
                  onQuickAdd={handleSidebarQuickAdd}
                />
              ) : (
                <div className="muted-sm">Click a day to see unassigned employees</div>
              )
            ) : null}
          </div>
        </div>
      )}

      {/* Mobile drawer + FAB for Unassigned */}
      {isMobile && (
        <>
          <button
            className="fab-people"
            aria-label="Show unassigned employees"
            onClick={() => setMobileSidebarOpen(true)}
            title="Unassigned employees"
          >
            👥
            {freeCount > 0 ? <span className="fab-badge" aria-hidden>{freeCount}</span> : null}
          </button>
          {mobileSidebarOpen ? (
            <div className="drawer-root" onClick={e => { if (e.currentTarget === e.target) setMobileSidebarOpen(false); }}>
              <div className="drawer-panel" role="dialog" aria-modal="true">
                <div className="drawer-header">
                  <div>Unassigned</div>
                  <button className="icon-btn" aria-label="Close" onClick={() => setMobileSidebarOpen(false)}>✕</button>
                </div>
                {selectedDay ? (
                  <UnassignedSidebar
                    employees={employees}
                    events={events}
                    selectedDate={selectedDay}
                    weekStartsOn={1}
                    onQuickAdd={handleSidebarQuickAdd}
                  />
                ) : (
                  <div className="muted-sm">Tap a day to see unassigned employees</div>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* daily report date picker */}
      {reportPickerOpen ? (
        <div className="modal-root">
          <div className="modal-card" style={{ maxWidth: '360px' }}>
            <h3 className="modal-title">Generate Daily Report</h3>
            <div className="form-grid form-compact">
              <label><div className="label">Date</div>
                <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setReportPickerOpen(false)}>Cancel</button>
              <button className="btn primary" onClick={async () => {
                const ymd = reportDate.trim();
                if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) { alert('Invalid date'); return; }
                try {
                  const r = await fetch('/api/reports/daily/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: ymd, vendor: null, force: true }) });
                  const j = await r.json();
                  if (r.ok && j.pdfUrl) { window.open(j.pdfUrl, '_blank'); setReportPickerOpen(false); }
                  else alert(j.error || 'Failed to generate');
                } catch { alert('Failed to generate'); }
              }}>Generate</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* modal */}
      {open && draft ? (
        <div className="modal-root">
          <div className="modal-card">
            <h3 className="modal-title" style={{ borderLeft: `4px solid ${currentTypeColor}`, paddingLeft: '0.5rem' }}>{editId ? 'Edit event' : 'Add event'}</h3>
            <div className="form-grid form-compact">
              <div className="form-section span-2">Event Info</div>
              <label className="span-2"><div className="label">Title</div>
                <CustomerCombobox value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
              </label>
              {isMobile ? (
                <>
                  <label><div className="label">Start date</div>
                    <input type="date" value={toLocalDate(draft.start)} onChange={e => { const date = e.target.value; const time = toLocalTime(draft.start); updateStart(fromLocalDateTime(date, time)); }} />
                  </label>
                  {!draft.allDay && (
                    <label><div className="label">Start time</div>
                      <input type="time" value={toLocalTime(draft.start)} onChange={e => { const time = e.target.value; const date = toLocalDate(draft.start); updateStart(fromLocalDateTime(date, time)); }} />
                    </label>
                  )}
                  <label><div className="label">End date</div>
                    <input type="date" min={toLocalDate(draft.start)} value={toLocalDate(draft.end ?? draft.start)} onChange={e => { const date = e.target.value; const time = toLocalTime(draft.end ?? draft.start); updateEnd(fromLocalDateTime(date, time)); }} />
                  </label>
                  {!draft.allDay && (
                    <label><div className="label">End time</div>
                      <input type="time" value={toLocalTime(draft.end ?? draft.start)} onChange={e => { const time = e.target.value; const date = toLocalDate(draft.end ?? draft.start); updateEnd(fromLocalDateTime(date, time)); }} />
                    </label>
                  )}
                </>
              ) : (
                <>
                  <label><div className="label">Start</div>
                    <input type="datetime-local" value={toLocalInput(draft.start)} onChange={e => updateStart(fromLocalInput(e.target.value))} />
                  </label>
                  <label><div className="label">End</div>
                    <input type="datetime-local" min={toLocalInput(draft.start)} value={toLocalInput(draft.end ?? draft.start)} onChange={e => updateEnd(fromLocalInput(e.target.value))} />
                  </label>
                </>
              )}
              <label><div className="label"><IconClock className="ico" />Work Time</div>
                <button type="button" className={`shift-toggle ${draft.shift === 'NIGHT' ? 'night' : 'day'}`} onClick={toggleShift} aria-label="Toggle work time">{(draft.shift ?? 'DAY') === 'DAY' ? 'Day' : 'Night'}</button>
              </label>
              <label><div className="label"><IconType className="ico" />Type</div>
                <div className="inline"><span className="type-chip" style={{ background: currentTypeColor }}></span>
                  <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as NewEvent['type'] })}>
                    <option value="FENCE">Fence</option><option value="TEMP_FENCE">Temp Fence</option><option value="GUARDRAIL">Guardrail</option><option value="HANDRAIL">Handrail</option><option value="ATTENUATOR">Attenuator</option>
                  </select>
                </div>
              </label>
              <label><div className="label">Vendor</div>
                <div className="inline"><span className="type-chip" style={{ background: currentVendorColor }}></span>
                  <select value={draft.vendor ?? 'JORGE'} onChange={e => setDraft({ ...draft, vendor: e.target.value as Vendor })}>
                    <option value="JORGE" style={{ color: VENDOR_COLOR.JORGE }}>Jorge</option>
                    <option value="TONY" style={{ color: VENDOR_COLOR.TONY }}>Tony</option>
                    <option value="CHRIS" style={{ color: VENDOR_COLOR.CHRIS }}>Chris</option>
                  </select>
                </div>
              </label>
              <label><div className="label">Payroll</div>
                <select value={draft.payroll ? 'YES' : 'NO'} onChange={e => setDraft({ ...draft, payroll: e.target.value === 'YES' })}>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </label>
              <label><div className="label">Payment</div>
                <select value={draft.payment ?? 'DAILY'} onChange={e => setDraft({ ...draft, payment: e.target.value as PaymentType })}>
                  <option value="DAILY">Daily</option>
                  <option value="ADJUSTED">Adjusted</option>
                </select>
              </label>
              <label className="span-2"><div className="label">Employees</div>
                <EmployeeMultiSelect
                  employees={employees}
                  value={draft.checklist?.employees ?? []}
                  onChange={(sel) => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), employees: sel } })}
                />
              </label>
              <div className="form-section span-2">Work Details</div>
              <label><div className="label"><IconLocation className="ico" />Location</div>
                <input ref={locationRef} type="text" value={locInput} onChange={e => { setLocInput(e.target.value); if (!e.target.value) { autoRef.current?.set && autoRef.current.set('place', null); } }} />
                <div className="mt-1">
                  <a href={locInput && locInput.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locInput)}` : '#'} target="_blank" rel="noopener noreferrer" className="event-gmap-link" aria-disabled={!locInput || !locInput.trim()} onClick={e => { if (!locInput || !locInput.trim()) e.preventDefault(); }} title={locInput && locInput.trim() ? 'Open in Google Maps' : 'Enter a location to open in Maps'}>Open in Google Maps</a>
                </div>
              </label>
              <label><div className="label">Invoice #</div>
                <input type="text" inputMode="numeric" value={draft.invoice ?? ''} onChange={e => setDraft({ ...draft, invoice: e.target.value })} />
              </label>
              <label className="span-2"><div className="label">Description</div>
                <textarea ref={descRef} value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} onKeyDown={handleDescKeyDown} />
              </label>
              <div className="form-section span-2">Tickets</div>
              <div className="span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label><div className="label"><IconTicket className="ico" />Ticket #</div>
                    <input type="text" inputMode="numeric" value={draft.checklist?.locate?.ticket ?? ''} onChange={e => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), locate: { ...(draft.checklist?.locate ?? {}), ticket: e.target.value } } })} />
                  </label>
                  <label><div className="label">Requested</div>
                    <input type="date" value={(draft.checklist?.locate?.requested ?? '').slice(0,10)} onChange={e => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), locate: { ...(draft.checklist?.locate ?? {}), requested: e.target.value } } })} />
                  </label>
                  <label><div className="label">Expires</div>
                    <input type="date" value={(draft.checklist?.locate?.expires ?? '').slice(0,10)} onChange={e => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), locate: { ...(draft.checklist?.locate ?? {}), expires: e.target.value } } })} />
                  </label>
                </div>
              </div>
              <div className="form-section span-2">Subtasks</div>
              <div className="span-2">
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
                <TodoCustomerAdder onAdd={(title) => addTodo(typ, title)} placeholder={`Add ${TYPE_LABEL[typ]} job`} />
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

function TodoAdder({ onAdd, placeholder }: { onAdd: (title: string) => void; placeholder: string }) {
  const [val, setVal] = useState(''); const submit = () => { if (val.trim()) { onAdd(val); setVal(''); } };
  return (<div className="todo-adder"><input className="todo-input" placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} /><button className="btn primary todo-add-btn" onClick={submit}>Add</button></div>);
}

function TodoCustomerAdder({ onAdd, placeholder }: { onAdd: (title: string) => void; placeholder: string }) {
  const [val, setVal] = useState('');
  const submit = () => { const t = val.trim(); if (t) { onAdd(t); setVal(''); } };
  return (
    <div className="todo-adder">
      <div>
        <CustomerCombobox value={val} onChange={setVal} />
      </div>
      <button className="btn primary todo-add-btn" onClick={submit}>Add</button>
    </div>
  );
}

function splitInvoice(desc: string): { invoice: string; payment: PaymentType | ''; vendor: Vendor | ''; payroll: boolean | null; rest: string } {
  const lines = (desc || '').split(/\r?\n/)
  let invoice = ''
  let payment: PaymentType | '' = ''
  let vendor: Vendor | '' = ''
  let payroll: boolean | null = null
  const restLines: string[] = []
  const reInv = /^\s*invoice\s*#?\s*:\s*(.+)\s*$/i
  const rePay = /^\s*payment\s*:\s*(daily|adjusted)\s*$/i
  const reVen = /^\s*vendor\s*:\s*(jorge|tony|chris)\s*$/i
  const rePayr = /^\s*payroll\s*:\s*(yes|no)\s*$/i
  for (const ln of lines) {
    const mi = ln.match(reInv)
    if (mi && !invoice) { invoice = mi[1].trim(); continue }
    const mp = ln.match(rePay)
    if (mp && !payment) { payment = mp[1].toUpperCase() as PaymentType; continue }
    const mv = ln.match(reVen)
    if (mv && !vendor) { vendor = mv[1].toUpperCase() as Vendor; continue }
    const mpr = ln.match(rePayr)
    if (mpr && payroll === null) { payroll = mpr[1].toUpperCase() === 'YES'; continue }
    restLines.push(ln)
  }
  return { invoice, payment, vendor, payroll, rest: restLines.join('\n').trim() }
}
function splitInvoiceProps(desc: string) { const { invoice, payment, vendor, payroll, rest } = splitInvoice(desc); return { description: rest, invoice, payment, vendor, payroll } }
function composeDescription(desc: string, invoice: string, payment: string, vendor: string, payroll: boolean): string {
  const d = (desc || '').trim()
  const i = (invoice || '').trim()
  const p = (payment || '').trim().toUpperCase()
  const v = (vendor || '').trim().toUpperCase()
  const parts: string[] = []
  if (i) parts.push(`Invoice: ${i}`)
  if (p) parts.push(`Payment: ${p === 'ADJUSTED' ? 'Adjusted' : 'Daily'}`)
  if (v) {
    const name = v === 'JORGE' ? 'Jorge' : v === 'TONY' ? 'Tony' : v === 'CHRIS' ? 'Chris' : v
    parts.push(`Vendor: ${name}`)
  }
  if (typeof payroll === 'boolean') parts.push(`Payroll: ${payroll ? 'Yes' : 'No'}`)
  if (d) parts.push(d)
  return parts.join('\n')
}

function defaultChecklist(): Checklist { return { locate: { ticket: '', requested: '', expires: '', contacted: false }, subtasks: [], employees: [] }; }

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











