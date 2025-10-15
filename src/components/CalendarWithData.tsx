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
import EmployeeMultiSelect from './EmployeeMultiSelect';
import CustomerCombobox from './CustomerCombobox';
import { getEmployees } from '@/employees';
import { eventOverlapsLocalDay } from '@/lib/dateUtils';
import { getYardForDate } from '@/lib/yard';
import { getAbsentForDate } from '@/lib/absent';
import UnassignedSidebar from '@/components/UnassignedSidebar';
import EventQuantitiesEditor from '@/components/EventQuantitiesEditor';
import { Toast } from '@/components/Toast';
import PayItemsManager from '@/components/PayItemsManager';
import { CutoffReportDialog } from '@/components/reports/CutoffReportDialog';
import {
  APP_TIMEZONE,
  APP_TZ,
  parseAppDateTime,
  parseAppDateOnly,
  formatInTimeZone,
  zonedStartOfDayUtc,
  addDaysUtc,
} from '@/lib/timezone';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

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

const EmployeesLink = () => {
  const pathname = usePathname();
  const href = `/employees?from=${encodeURIComponent(pathname)}`;
  return <Link href={href} className="btn">Employees</Link>;
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
  const [activeTab, setActiveTab] = useState<'info' | 'work' | 'tickets' | 'quantities'>('info');
  const [modalHasQuantities, setModalHasQuantities] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
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
  const [searchQuery, setSearchQuery] = useState('');
  const notify = useCallback((message: string) => setToast({ open: true, message }), []);
  const closeToast = useCallback(() => setToast({ open: false, message: '' }), []);
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
    if (data && coords) {
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
        const startDateUtc = zonedStartOfDayUtc(ymd, APP_TIMEZONE);
        const endDateUtc = addDaysUtc(startDateUtc, 1);
        setEditId(null);
        setDraft({
          title: '',
          start: startDateUtc.toISOString(),
          end: endDateUtc.toISOString(),
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
        selectDay(ymd);
        setModalHasQuantities(false);
        setUserChangedStart(false);
        setUserChangedEnd(false);
        setOpen(true);
      });
      frame.appendChild(btn);
    }
  };

  const dayCellDidMount = useCallback((arg: { date: Date; dateStr?: string; el: HTMLElement }) => {
    injectBadgeIntoCell(arg.el);

    const el = arg.el;
    const dateStr = (arg as any)?.dateStr ?? formatInTimeZone(arg.date, APP_TZ).date;
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
              hasQuantities: false,
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

  const handleDateClick = useCallback((arg: { date: Date; dateStr?: string }) => {
    if ((arg as any)?.dateStr) {
      selectDay((arg as any).dateStr as string);
      return;
    }
    selectDay(arg.date);
  }, [selectDay]);

  const freeCount = useMemo(() => {
    if (!selectedDay || !selectedDayYmd) return 0;
    const day = selectedDay;
    const key = selectedDayYmd;
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
  }, [selectedDay, selectedDayYmd, events, employees, yardTick]);

  const handleSidebarQuickAdd = useCallback((employeeId: string, day: Date) => {
    // Prefill an all-day event on the selected local day with the chosen employee
    const { date } = formatInTimeZone(day, APP_TIMEZONE);
    const startDateUtc = zonedStartOfDayUtc(date, APP_TIMEZONE);
    const endDateUtc = addDaysUtc(startDateUtc, 1);
    setDraft({
      title: '',
      start: startDateUtc.toISOString(),
      end: endDateUtc.toISOString(),
      allDay: true,
      location: '',
      description: '',
      type: 'FENCE',
      payment: 'DAILY',
      vendor: 'JORGE',
      payroll: false,
      checklist: { ...(defaultChecklist()), employees: [employeeId] },
    });
    selectDay(day);
    setEditId(null);
    setUserChangedStart(false);
    setUserChangedEnd(false);
    setOpen(true);
  }, [selectDay]);


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

    const baseStart = sel.start ?? new Date();
    const baseEnd = sel.end ?? sel.start ?? baseStart;

    if ((sel as any)?.startStr) {
      selectDay((sel as any).startStr);
    } else if (sel.start) {
      selectDay(sel.start);
    }

    if (sel.allDay) {
      const startYmd = (sel as any)?.startStr ? String((sel as any).startStr).slice(0, 10) : formatInTimeZone(baseStart, APP_TZ).date;
      const endYmdRaw = (sel as any)?.endStr ? String((sel as any).endStr).slice(0, 10) : formatInTimeZone(baseEnd, APP_TZ).date;
      const startDate = zonedStartOfDayUtc(startYmd, APP_TIMEZONE);
      let endDate = endYmdRaw ? zonedStartOfDayUtc(endYmdRaw, APP_TIMEZONE) : startDate;
      if (!sel.end || endDate <= startDate) {
        endDate = addDaysUtc(startDate, 1);
      }
      setDraft({
        title: '',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: true,
        type: 'FENCE',
        invoice: '',
        payment: 'DAILY',
        vendor: 'JORGE',
        payroll: false,
        shift: 'DAY',
        checklist: defaultChecklist(),
      });
    } else {
      setDraft({
        title: '',
        start: baseStart.toISOString(),
        end: baseEnd.toISOString(),
        allDay: false,
        type: 'FENCE',
        invoice: '',
        payment: 'DAILY',
        vendor: 'JORGE',
        payroll: false,
        shift: 'DAY',
        checklist: defaultChecklist(),
      });
    }
    setModalHasQuantities(false);
    setUserChangedStart(false);
    setUserChangedEnd(false);
    setLocInput('');
    setOpen(true);
  }, [selectDay]);

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
      const times = normalizeEventTimes({
        start: e.allDay ? (e.startStr ?? undefined) : (e.start ?? undefined),
        end: e.allDay ? (e.endStr ?? undefined) : (e.end ?? undefined),
        allDay: e.allDay,
      });
      setDraft({
        title: e.title,
        start: times.start,
        end: times.end,
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
      setModalHasQuantities(Boolean((e.extendedProps as any)?.hasQuantities));
      setUserChangedStart(false);
      setUserChangedEnd(false);
      setOpen(true);
    }
  }, [isTablet]);

  const openEditFromDetails = useCallback(() => {
    if (!selectedEvent) return;
    const e: any = selectedEvent;
    setEditId(e.id as string);
    const times = normalizeEventTimes({
      start: e.start as string | undefined,
      end: e.end as string | undefined,
      allDay: e.allDay as boolean | undefined,
    });
    setDraft({
      title: e.title,
      start: times.start,
      end: times.end,
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
    setModalHasQuantities(Boolean(e.extendedProps?.hasQuantities));
    setUserChangedStart(false);
    setUserChangedEnd(false);
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
    const { start: normalizedStart, end: normalizedEnd } = normalizeDraftBounds(draft);
    const payloadStart = draft.allDay ? normalizedStart.slice(0, 10) : normalizedStart;
    const payloadEnd = draft.allDay ? normalizedEnd.slice(0, 10) : normalizedEnd;
    const payloadBody = {
      title: draft.title,
      description: composeDescription(draft.description ?? '', draft.invoice ?? '', draft.payment ?? '', draft.vendor ?? '', draft.payroll ?? false),
      start: payloadStart,
      end: payloadEnd,
      startsAt: payloadStart,
      endsAt: payloadEnd,
      allDay: !!draft.allDay,
      location: draft.location ?? '',
      type: draft.type ?? null,
      payment: draft.payment ?? null,
      vendor: draft.vendor ?? null,
      payroll: draft.payroll ?? null,
      shift: draft.shift ?? null,
      checklist: draft.checklist ?? null,
    };

    if (editId) {
      const r = await fetch(`/api/events/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert(err.error || 'Failed to update event');
        return;
      }
      const raw = await r.json();
      const normalized = normalizeEvent(raw);
      const normalizedStartIso = normalized.allDay ? normalizeAllDayIsoValue(normalized.start) : normalized.start;
      const normalizedEndIso = normalized.allDay ? normalizeAllDayIsoValue(normalized.end ?? normalized.start) : normalized.end;
      const startForCalendar = normalized.allDay ? normalizedStartIso.slice(0, 10) : normalizedStartIso;
      const endForCalendar = normalized.allDay ? normalizedEndIso.slice(0, 10) : normalizedEndIso;
      const meta = splitInvoiceProps(normalized.description ?? '');
      const hasQuantities = !!(normalized as any).hasQuantities;

      setEvents(prev => prev.map(ev => (ev.id === editId ? {
        id: normalized.id,
        title: normalized.title,
        start: startForCalendar,
        end: endForCalendar,
        allDay: !!normalized.allDay,
        extendedProps: {
          location: normalized.location ?? '',
          description: meta.description ?? '',
          invoice: meta.invoice ?? '',
          payment: meta.payment || '',
          vendor: meta.vendor || '',
          payroll: typeof meta.payroll === 'boolean' ? meta.payroll : false,
          type: normalized.type ?? null,
          shift: normalized.shift ?? null,
          checklist: normalized.checklist ?? null,
          calendarId: normalized.calendarId ?? '',
          hasQuantities,
        },
        className: typeToClass(normalized.type),
        display: 'block',
        } : ev)));

      setSelectedEvent(prev => {
        if (!prev || prev.id !== editId) return prev;
        return {
          ...prev,
          title: normalized.title,
          start: startForCalendar,
          end: endForCalendar,
          allDay: !!normalized.allDay,
          extendedProps: {
            ...(prev.extendedProps ?? {}),
            location: normalized.location ?? '',
            description: meta.description ?? '',
            invoice: meta.invoice ?? '',
            payment: meta.payment || '',
            vendor: meta.vendor || '',
            payroll: typeof meta.payroll === 'boolean' ? meta.payroll : false,
            type: normalized.type ?? null,
            shift: normalized.shift ?? null,
            checklist: normalized.checklist ?? null,
            calendarId: normalized.calendarId ?? '',
            hasQuantities,
          },
        } as EventInput;
      });

      setModalHasQuantities(hasQuantities);
      setLocInput(normalized.location ?? '');
      notify('Event updated');
      refetchCalendar();
      setOpen(false);
      setDraft(null);
      setEditId(null);
      return;
    }

    const r = await fetch(`/api/calendars/${calendarId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadBody),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err.error || 'Failed to create event');
      return;
    }

    const createdRaw = await r.json();
    const normalized = normalizeEvent(createdRaw);
    const normalizedStartIso = normalized.allDay ? normalizeAllDayIsoValue(normalized.start) : normalized.start;
    const normalizedEndIso = normalized.allDay ? normalizeAllDayIsoValue(normalized.end ?? normalized.start) : normalized.end;
    const startForCalendar = normalized.allDay ? normalizedStartIso.slice(0, 10) : normalizedStartIso;
    const endForCalendar = normalized.allDay ? normalizedEndIso.slice(0, 10) : normalizedEndIso;
    const meta = splitInvoiceProps(normalized.description ?? '');

    setEvents(p => [
      ...p,
      {
        id: normalized.id,
        title: normalized.title,
        start: startForCalendar,
        end: endForCalendar,
        allDay: !!normalized.allDay,
        extendedProps: {
          location: normalized.location ?? '',
          description: meta.description ?? '',
          invoice: meta.invoice ?? '',
          payment: meta.payment || '',
          vendor: meta.vendor || '',
          payroll: typeof meta.payroll === 'boolean' ? meta.payroll : false,
          type: normalized.type ?? null,
          shift: normalized.shift ?? null,
          checklist: normalized.checklist ?? null,
          calendarId: normalized.calendarId ?? '',
          hasQuantities: false,
        },
        className: typeToClass(normalized.type),
        display: 'block',
      },
    ]);
    refetchCalendar();

    setEditId(normalized.id);
    setModalHasQuantities(false);
    setLocInput(normalized.location ?? '');

    const paymentValue = (meta.payment || draft.payment || 'DAILY') as PaymentType;
    const vendorValue = (meta.vendor || draft.vendor || 'JORGE') as Vendor;
    setDraft({
      title: normalized.title,
      start: normalizedStartIso,
      end: normalizedEndIso,
      allDay: !!normalized.allDay,
      location: normalized.location ?? '',
      description: meta.description ?? '',
      invoice: meta.invoice ?? '',
      payment: paymentValue,
      vendor: vendorValue,
      payroll: typeof meta.payroll === 'boolean' ? meta.payroll : draft.payroll ?? false,
      type: (normalized.type as JobType | undefined) ?? draft.type ?? 'FENCE',
      shift: (normalized.shift as WorkShift | undefined) ?? draft.shift ?? 'DAY',
      checklist: normalized.checklist ?? draft.checklist ?? defaultChecklist(),
    });
    setUserChangedStart(false);
    setUserChangedEnd(false);
    notify('Event saved. Add quantities below.');
  }, [draft, editId, calendarId, notify, refetchCalendar]);

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
    const { start: normalizedStart, end: normalizedEnd } = normalizeDraftBounds(draft);
    const payloadStart = draft.allDay ? normalizedStart.slice(0, 10) : normalizedStart;
    const payloadEnd = draft.allDay ? normalizedEnd.slice(0, 10) : normalizedEnd;
    const r = await fetch(`/api/calendars/${calendarId}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${draft.title}`, description: composeDescription(draft.description ?? '', draft.invoice ?? '', draft.payment ?? '', draft.vendor ?? '', draft.payroll ?? false), start: payloadStart, end: payloadEnd, allDay: !!draft.allDay, location: draft.location ?? '', type: draft.type ?? null, shift: draft.shift ?? null, checklist: draft.checklist ?? null }) });
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
          hasQuantities: false,
        },
        className: typeToClass(normalized.type),
        display: 'block',
      },
    ]);
    refetchCalendar();
  }, [draft, calendarId, refetchCalendar]);

  const handleQuantitiesChange = useCallback((has: boolean) => {
    if (!editId) return;
    setModalHasQuantities(has);
    setEvents(prev => prev.map(ev => (ev.id === editId ? {
      ...ev,
      extendedProps: {
        ...(ev.extendedProps ?? {}),
        hasQuantities: has,
      },
    } : ev)));
    setSelectedEvent(prev => {
      if (!prev || prev.id !== editId) return prev;
      return {
        ...prev,
        extendedProps: {
          ...(prev.extendedProps ?? {}),
          hasQuantities: has,
        },
      } as EventInput;
    });
  }, [editId]);

  const updateStart = (iso: string) => {
    if (!draft) return;
    const prevStart = new Date(draft.start);
    const isAllDay = !!draft.allDay;
    const normalizedStart = isAllDay
      ? (parseAppDateOnly(iso, APP_TIMEZONE) ?? zonedStartOfDayUtc(formatInTimeZone(new Date(iso), APP_TIMEZONE).date, APP_TIMEZONE))
      : (parseAppDateTime(iso, APP_TIMEZONE) ?? new Date(iso));
    let endIso = draft.end;
    if (!userChangedEnd && draft.end) {
      const duration = new Date(draft.end).getTime() - prevStart.getTime();
      endIso = new Date(normalizedStart.getTime() + duration).toISOString();
    }
    if (isAllDay) {
      const startDate = normalizedStart;
      const currentEnd = endIso ? parseAppDateOnly(endIso, APP_TIMEZONE) ?? new Date(endIso) : null;
      const exclusive = currentEnd && currentEnd > startDate ? currentEnd : addDaysUtc(startDate, 1);
      endIso = exclusive.toISOString();
    }
    setDraft({ ...draft, start: normalizedStart.toISOString(), end: endIso });
    setUserChangedStart(true);
  };

  const updateEnd = (iso: string) => {
    if (!draft) return;
    if (draft.allDay) {
      const startDate = parseAppDateOnly(String(draft.start), APP_TIMEZONE) ?? zonedStartOfDayUtc(formatInTimeZone(new Date(draft.start), APP_TIMEZONE).date, APP_TIMEZONE);
      const rawDate = parseAppDateOnly(iso, APP_TIMEZONE) ?? zonedStartOfDayUtc(formatInTimeZone(new Date(iso), APP_TIMEZONE).date, APP_TIMEZONE);
      let exclusive = addDaysUtc(rawDate, 1);
      if (exclusive <= startDate) exclusive = addDaysUtc(startDate, 1);
      setDraft({ ...draft, end: exclusive.toISOString() });
      setUserChangedEnd(true);
      return;
    }
    let endDate = parseAppDateTime(iso, APP_TIMEZONE) ?? new Date(iso);
    if (endDate < new Date(draft.start)) endDate = new Date(draft.start);
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

  const createBlankDraft = useCallback((): NewEvent => {
    const base = selectedDay ? new Date(selectedDay.getTime()) : new Date();
    const { date } = formatInTimeZone(base, APP_TIMEZONE);
    const startDay = zonedStartOfDayUtc(date, APP_TIMEZONE);
    const endDay = addDaysUtc(startDay, 1);
    return {
      title: '',
      start: startDay.toISOString(),
      end: endDay.toISOString(),
      allDay: true,
      location: '',
      description: '',
      invoice: '',
      payment: 'DAILY',
      type: 'FENCE',
      vendor: 'JORGE',
      payroll: false,
      shift: 'DAY',
      checklist: defaultChecklist(),
    };
  }, [selectedDay]);

  const handleAddNew = useCallback(() => {
    const blank = createBlankDraft();
    setEditId(null);
    setDraft(blank);
    setSelectedEvent(null);
    setLocInput('');
    setModalHasQuantities(false);
    setUserChangedStart(false);
    setUserChangedEnd(false);
    setActiveTab('info');
  }, [createBlankDraft]);

  const handleAllDayToggle = () => {
    setDraft(prev => {
      if (!prev) return prev;
      if (prev.allDay) {
        const startDate = new Date(prev.start);
        const endDate = prev.end ? new Date(prev.end) : new Date(startDate.getTime() + 60 * 60 * 1000);
        return { ...prev, allDay: false, start: startDate.toISOString(), end: endDate.toISOString() };
      }
      const startUtc = parseAppDateOnly(String(prev.start), APP_TIMEZONE) ?? zonedStartOfDayUtc(formatInTimeZone(new Date(prev.start), APP_TIMEZONE).date, APP_TIMEZONE);
      const endUtc = addDaysUtc(startUtc, 1);
      return { ...prev, allDay: true, start: startUtc.toISOString(), end: endUtc.toISOString() };
    });
    setUserChangedStart(false);
    setUserChangedEnd(false);
  };

  const handleStartFieldChange = (value: string) => {
    if (!draft) return;
    if (draft.allDay) {
      const iso = isoFromDateOnly(value);
      if (!iso) return;
      updateStart(iso);
      return;
    }
    updateStart(fromLocalInput(value));
  };

  const handleEndFieldChange = (value: string) => {
    if (!draft) return;
    if (draft.allDay) {
      const exclusiveIso = exclusiveIsoFromDateOnly(value, draft.start);
      setDraft({ ...draft, end: exclusiveIso });
      setUserChangedEnd(true);
      return;
    }
    updateEnd(fromLocalInput(value));
  };

  const currentTypeColor = draft ? TYPE_COLOR[(draft.type ?? 'FENCE') as JobType] : 'transparent';
  const currentVendorColor = draft ? VENDOR_COLOR[(draft.vendor ?? 'JORGE') as Vendor] : 'transparent';

  const handleDescKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLTextAreaElement | undefined;
    if (!target) return;
    if (e.key === 'Enter') {
      const start = target.selectionStart;
      const value = target.value;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const line = value.slice(lineStart, start);
      if (line.startsWith('- ')) {
        e.preventDefault();
        const insert = '\n- ';
        const newVal = value.slice(0, start) + insert + value.slice(target.selectionEnd);
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
    // Import job type colors and normalization
    const { JOB_TYPE_COLOR, normalizeJobType } = require('@/components/calendar/colors');
    
    const frag = document.createElement('div');
    frag.style.display = 'flex';
    frag.style.alignItems = 'center';
    frag.style.gap = '8px';
    frag.style.padding = '4px 8px';
    frag.style.borderRadius = '10px';
    frag.style.backdropFilter = 'blur(6px)';
    frag.style.overflow = 'hidden';
    
    // Get job type from event extended props
    const eventProps = arg.event.extendedProps as any;
    const jobType = normalizeJobType(eventProps?.type || eventProps?.jobType || '');
    const colors = JOB_TYPE_COLOR[jobType];
    
    // Set translucent background and border
    frag.style.backgroundColor = colors.glass;
    frag.style.border = `1px solid ${colors.solid}22`;
    
    // Create colored dot
    const dot = document.createElement('span');
    dot.style.width = '8px';
    dot.style.height = '8px';
    dot.style.borderRadius = '9999px';
    dot.style.backgroundColor = colors.dot;
    dot.style.boxShadow = `0 0 0 2px ${colors.solid}33`;
    dot.style.flexShrink = '0';
    frag.appendChild(dot);
    
    // Create title span
    const span = document.createElement('span');
    span.className = 'evt-title';
    span.style.whiteSpace = 'nowrap';
    span.style.overflow = 'hidden';
    span.style.textOverflow = 'ellipsis';
    span.style.fontWeight = '600';
    span.style.color = '#e7e9ea';
    span.innerHTML = highlightText(arg.event.title, searchQuery);
    frag.appendChild(span);
    
    // Add quantities badge if present
    const hasQuantities = Boolean(eventProps?.hasQuantities);
    if (hasQuantities) {
      const badge = document.createElement('span');
      badge.className = 'qty-pill';
      badge.textContent = 'QTY';
      badge.style.fontSize = '10px';
      badge.style.padding = '2px 4px';
      badge.style.backgroundColor = colors.solid;
      badge.style.color = '#000';
      badge.style.borderRadius = '4px';
      badge.style.fontWeight = 'bold';
      frag.appendChild(badge);
    }
    
    // Add location link if present
    const loc = eventProps?.location as string | undefined;
    if (loc && loc.trim()) {
      const a = document.createElement('a');
      a.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = 'View in Google Maps';
      a.textContent = '📍';
      a.className = 'event-gmap-link';
      a.style.fontSize = '12px';
      frag.appendChild(a);
    }
    
    return { domNodes: [frag] };
  }, [highlightText, searchQuery]);

  const eventDidMount = useCallback((info: any) => {
    // Disable FullCalendar's default blue styling
    info.el.style.backgroundColor = 'transparent';
    info.el.style.border = 'none';
    info.el.style.boxShadow = 'none';
    info.el.style.padding = '0';
  }, []);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [cutoffReportOpen, setCutoffReportOpen] = useState(false);
  const [reportDate, setReportDate] = useState<string>('');
  const [payItemsDialog, setPayItemsDialog] = useState(false);
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
    if (open) setActiveTab('info');
  }, [open]);
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

  const isAllDay = !!draft?.allDay;
  const startInputType = isAllDay ? 'date' : 'datetime-local';
  const endInputType = startInputType;
  const startInputValue = draft
    ? (isAllDay
        ? formatDateInputValue(draft.start, { allDay: true })
        : formatDateTimeInputValue(draft.start, { allDay: false }))
    : '';
  const endInputValue = draft
    ? (isAllDay
        ? formatDateInputValue(draft.end ?? draft.start, { allDay: true, isEnd: true })
        : formatDateTimeInputValue(draft.end ?? draft.start, { allDay: false, isEnd: true }))
    : '';

  const eventInfoContent: ReactNode = draft ? (
    <Stack spacing={3} sx={{ mt: 1 }}>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Title
        </Typography>
        <CustomerCombobox value={draft.title} onChange={value => setDraft({ ...draft, title: value })} />
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <TextField
          label="Start"
          type={startInputType}
          value={startInputValue}
          onChange={e => handleStartFieldChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="End"
          type={endInputType}
          value={endInputValue}
          onChange={e => handleEndFieldChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Box>
      <Stack
        spacing={2}
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Work Time
          </Typography>
          <ToggleButtonGroup
            value={draft.shift ?? 'DAY'}
            exclusive
            size="small"
            onChange={(_, value) => {
              if (value) setDraft({ ...draft, shift: value as WorkShift });
            }}
          >
            <ToggleButton value="DAY">Day</ToggleButton>
            <ToggleButton value="NIGHT">Night</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <FormControlLabel
          control={<Switch checked={draft.allDay} onChange={handleAllDayToggle} />}
          label={draft.allDay ? 'All-day event' : 'Timed event'}
        />
        <TextField
          select
          label="Type"
          value={draft.type ?? 'FENCE'}
          onChange={e => setDraft({ ...draft, type: e.target.value as NewEvent['type'] })}
          fullWidth
        >
          <MenuItem value="FENCE">Fence</MenuItem>
          <MenuItem value="TEMP_FENCE">Temp Fence</MenuItem>
          <MenuItem value="GUARDRAIL">Guardrail</MenuItem>
          <MenuItem value="HANDRAIL">Handrail</MenuItem>
          <MenuItem value="ATTENUATOR">Attenuator</MenuItem>
        </TextField>
      </Stack>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}>
        <Box>
          <TextField
            label="Location"
            value={locInput}
            onChange={e => {
              setLocInput(e.target.value);
              if (!e.target.value) autoRef.current?.set && autoRef.current.set('place', null);
            }}
            fullWidth
          />
          <Button
            size="small"
            variant="text"
            disabled={!locInput.trim()}
            onClick={() => {
              if (!locInput.trim()) return;
              const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locInput)}`;
              window.open(href, '_blank');
            }}
            sx={{ mt: 1 }}
          >
            Open in Google Maps
          </Button>
        </Box>
        <TextField
          label="Invoice #"
          value={draft.invoice ?? ''}
          onChange={e => setDraft({ ...draft, invoice: e.target.value })}
          fullWidth
        />
      </Box>
    </Stack>
  ) : null;

  const workInfoContent: ReactNode = draft ? (
    <Stack spacing={3} sx={{ mt: 1 }}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
        <TextField
          select
          label="Vendor"
          value={draft.vendor ?? 'JORGE'}
          onChange={e => setDraft({ ...draft, vendor: e.target.value as Vendor })}
          fullWidth
        >
          <MenuItem value="JORGE">Jorge</MenuItem>
          <MenuItem value="TONY">Tony</MenuItem>
          <MenuItem value="CHRIS">Chris</MenuItem>
        </TextField>
        <TextField
          select
          label="Payroll"
          value={draft.payroll ? 'YES' : 'NO'}
          onChange={e => setDraft({ ...draft, payroll: e.target.value === 'YES' })}
          fullWidth
        >
          <MenuItem value="YES">Yes</MenuItem>
          <MenuItem value="NO">No</MenuItem>
        </TextField>
        <TextField
          select
          label="Payment"
          value={draft.payment ?? 'DAILY'}
          onChange={e => setDraft({ ...draft, payment: e.target.value as PaymentType })}
          fullWidth
        >
          <MenuItem value="DAILY">Daily</MenuItem>
          <MenuItem value="ADJUSTED">Adjusted</MenuItem>
        </TextField>
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Employees
        </Typography>
        <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 1.5, maxHeight: 200, overflowY: 'auto' }}>
          <EmployeeMultiSelect
            employees={employees}
            value={draft.checklist?.employees ?? []}
            onChange={(sel) => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), employees: sel } })}
          />
        </Box>
      </Box>
      <TextField
        label="Notes"
        value={draft.description ?? ''}
        onChange={e => setDraft({ ...draft, description: e.target.value })}
        onKeyDown={handleDescKeyDown}
        multiline
        minRows={4}
        fullWidth
      />
    </Stack>
  ) : null;

  const ticketsContent: ReactNode = draft ? (
    <Stack spacing={3} sx={{ mt: 1 }}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
          <TextField
            label="Ticket #"
            value={draft.checklist?.locate?.ticket ?? ''}
            onChange={e => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), locate: { ...(draft.checklist?.locate ?? {}), ticket: e.target.value } } })}
            fullWidth
          />
          <TextField
            label="Requested"
            type="date"
            value={(draft.checklist?.locate?.requested ?? '').slice(0, 10)}
            onChange={e => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), locate: { ...(draft.checklist?.locate ?? {}), requested: e.target.value } } })}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Expires"
            type="date"
            value={(draft.checklist?.locate?.expires ?? '').slice(0, 10)}
            onChange={e => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), locate: { ...(draft.checklist?.locate ?? {}), expires: e.target.value } } })}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>
      </Paper>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Subtasks
        </Typography>
        <SubtasksEditor
          value={draft.checklist?.subtasks ?? []}
          onChange={(subs) => setDraft({ ...draft, checklist: { ...(draft.checklist ?? defaultChecklist()), subtasks: subs } })}
        />
      </Box>
    </Stack>
  ) : null;

  const quantitiesContent: ReactNode = draft ? (
    <Box sx={{ mt: 1 }}>
      {editId ? (
        <EventQuantitiesEditor eventId={editId} onHasQuantitiesChange={handleQuantitiesChange} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Save the event to add quantities.
        </Typography>
      )}
    </Box>
  ) : null;


  return (
    <div className="cal-shell">
      <Toast message={toast.message} open={toast.open} onClose={closeToast} />
      {/* controls */}
      <div className="cal-controls calendar-bleed flex-col items-start gap-2 flex-nowrap">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="options-wrap">
            <button type="button" className="icon-btn" aria-label="Open menu" aria-haspopup="menu" aria-expanded={optsOpen} onClick={() => setOptsOpen(v => !v)}>⋮</button>
            {optsOpen ? (
              <div className="menu-card" role="menu" onMouseLeave={() => setOptsOpen(false)}>
                <button className="menu-row" role="menuitem" onClick={() => { setHolidayDialog(true); setOptsOpen(false); }}><span className="menu-ico">📅</span><span className="menu-text">Holidays</span></button>
                <button className="menu-row" role="menuitem" onClick={() => { setWeatherDialog(true); setOptsOpen(false); }}><span className="menu-ico">⛅</span><span className="menu-text">Weather</span></button>
                <button className="menu-row" role="menuitem" onClick={() => { setPayItemsDialog(true); setOptsOpen(false); }}><span className="menu-ico">📋</span><span className="menu-text">Pay Items</span></button>
                <Link className="menu-row" role="menuitem" href="/admin/fdot-cutoffs" onClick={() => setOptsOpen(false)}><span className="menu-ico">🛣️</span><span className="menu-text">FDOT Cut-Off Dates</span></Link>
                <Link className="menu-row" role="menuitem" href="/customers" onClick={() => setOptsOpen(false)}><span className="menu-ico">📂</span><span className="menu-text">Customers</span></Link>
                <Suspense fallback={<span className="menu-row" aria-disabled>Employees</span>}><EmployeesLink /></Suspense>
              </div>
            ) : null}
          </div>
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
                <button className="menu-item" role="menuitem" onClick={() => { setPayItemsDialog(true); setOptsOpen(false); }}>Pay Items…</button>
                <a className="menu-item" role="menuitem" href="/admin/fdot-cutoffs" onClick={() => setOptsOpen(false)}>FDOT Cut-Off Dates…</a>
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
          <button className="btn" onClick={() => setCutoffReportOpen(true)}>Generate Cut-Off Report</button>
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
              timeZone={APP_TZ}
              height="auto"
              dayCellDidMount={dayCellDidMount}
              eventContent={eventContent}
              eventDidMount={eventDidMount}
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
              timeZone={APP_TZ}
              height="auto"
              dayCellDidMount={dayCellDidMount}
              eventContent={eventContent}
              eventDidMount={eventDidMount}
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
                const yardIds = getYardForDate(ymd);
                const noWorkIds = getAbsentForDate(ymd);
                const [yyyy, mm, dd] = ymd.split('-').map(n => parseInt(n, 10));
                const targetDay = Number.isFinite(yyyy) && Number.isFinite(mm) && Number.isFinite(dd)
                  ? new Date(yyyy, mm - 1, dd)
                  : null;
                const assignedIds = new Set<string>();
                if (targetDay) {
                  events.forEach(ev => {
                    if (!ev) return;
                    const minimal = { start: ev.start as any, end: ev.end as any, allDay: !!ev.allDay } as const;
                    if (!eventOverlapsLocalDay(minimal as any, targetDay)) return;
                    const list: unknown = (ev.extendedProps as any)?.checklist?.employees;
                    if (Array.isArray(list)) {
                      list.forEach(id => {
                        const str = typeof id === 'string' ? id : String(id ?? '');
                        if (str.trim()) assignedIds.add(str);
                      });
                    }
                  });
                }
                const filteredYardIds = yardIds.filter(id => !assignedIds.has(id));
                const nameById = new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
                const yardEmployees = filteredYardIds
                  .map(id => nameById.get(id) || id)
                  .filter((name): name is string => !!name && name.trim().length > 0);
                const noWorkEmployees = noWorkIds
                  .map(id => nameById.get(id) || id)
                  .filter((name): name is string => !!name && name.trim().length > 0);
                try {
                  console.log(
                    '[daily-report-request]',
                    'reportDate:', ymd,
                    'date.toString():', new Date(ymd).toString(),
                    'browserTz:', Intl.DateTimeFormat().resolvedOptions().timeZone,
                  );
                  const r = await fetch('/api/reports/daily/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      date: ymd,
                      vendor: null,
                      force: true,
                      yardEmployees,
                      noWorkEmployees,
                    }),
                  });
                  const j = await r.json();
                  if (r.ok && j.pdfUrl) { window.open(j.pdfUrl, '_blank'); setReportPickerOpen(false); }
                  else alert(j.error || 'Failed to generate');
                } catch { alert('Failed to generate'); }
              }}>Generate</button>
            </div>
          </div>
        </div>
      ) : null}

      <CutoffReportDialog open={cutoffReportOpen} onClose={() => setCutoffReportOpen(false)} />

      {draft ? (
        <Dialog
          open={open}
          onClose={() => { setOpen(false); setDraft(null); setEditId(null); }}
          fullWidth
          maxWidth="md"
          scroll="paper"
        >
          <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" component="span">
                {editId ? 'Edit Event' : 'Add Event'}
              </Typography>
              {editId && modalHasQuantities ? <Chip label="QTY" size="small" color="secondary" /> : null}
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value as typeof activeTab)}
              variant="scrollable"
              allowScrollButtonsMobile
              sx={{ mb: 2 }}
            >
              <Tab value="info" label="Event Info" />
              <Tab value="work" label="Work & Payroll" />
              <Tab value="tickets" label="Tickets & Subtasks" />
              <Tab value="quantities" label="Quantities" />
            </Tabs>
            <Box sx={{ display: activeTab === 'info' ? 'block' : 'none' }}>{eventInfoContent}</Box>
            <Box sx={{ display: activeTab === 'work' ? 'block' : 'none' }}>{workInfoContent}</Box>
            <Box sx={{ display: activeTab === 'tickets' ? 'block' : 'none' }}>{ticketsContent}</Box>
            <Box sx={{ display: activeTab === 'quantities' ? 'block' : 'none' }}>{quantitiesContent}</Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="text" onClick={() => { setOpen(false); setDraft(null); setEditId(null); }}>Cancel</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="outlined" onClick={handleAddNew}>Add</Button>
            {editId ? (
              <>
                <Button variant="outlined" onClick={duplicateCurrent}>Duplicate</Button>
                <Button variant="outlined" color="error" onClick={deleteCurrent}>Delete</Button>
              </>
            ) : null}
            <Button variant="contained" onClick={saveDraft}>Save Event</Button>
          </DialogActions>
        </Dialog>
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

      {payItemsDialog && (
        <div className="modal-root" onClick={(e) => { if (e.currentTarget === e.target) setPayItemsDialog(false); }}>
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 'min(860px, 95vw)', maxHeight: '92vh', overflow: 'auto' }}>
            <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Pay Items</span>
              <button className="icon-btn" aria-label="Close" onClick={() => setPayItemsDialog(false)}>✕</button>
            </div>
            <PayItemsManager condensed />
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

function toLocalInput(isoLike: string) {
  const d = new Date(isoLike)
  if (Number.isNaN(d.getTime())) return isoLike
  const { date, time } = formatInTimeZone(d, APP_TIMEZONE)
  return `${date}T${time.slice(0, 5)}`
}

function fromLocalInput(local: string) {
  const parsed = parseAppDateTime(local, APP_TIMEZONE)
  if (parsed) return parsed.toISOString()
  return new Date(local).toISOString()
}

function toLocalDate(isoLike: string) {
  const d = new Date(isoLike)
  if (Number.isNaN(d.getTime())) return isoLike.slice(0, 10)
  return formatInTimeZone(d, APP_TIMEZONE).date
}

function toLocalTime(isoLike: string) {
  const d = new Date(isoLike)
  if (Number.isNaN(d.getTime())) return ''
  return formatInTimeZone(d, APP_TIMEZONE).time.slice(0, 5)
}

function fromLocalDateTime(date: string, time: string) {
  return fromLocalInput(`${date}T${time}`)
}

function dateToLocalInput(d: Date) {
  const { date, time } = formatInTimeZone(d, APP_TIMEZONE)
  return `${date}T${time.slice(0, 5)}`
}
function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
function typeToClass(t?: NewEvent['type']) { switch (t) { case 'FENCE': return 'evt-fence'; case 'TEMP_FENCE': return 'evt-temp-fence'; case 'GUARDRAIL': return 'evt-guardrail'; case 'HANDRAIL': return 'evt-handrail'; case 'ATTENUATOR': return 'evt-attenuator'; default: return ''; } }

function isUtcMidnight(date: Date): boolean {
  return date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isoFromDateOnly(value: string): string | null {
  if (!DATE_ONLY_RE.test(value)) return null;
  return zonedStartOfDayUtc(value, APP_TIMEZONE).toISOString();
}

function exclusiveIsoFromDateOnly(value: string, minStartIso: string): string {
  const baseIso = isoFromDateOnly(value);
  const minStart = new Date(minStartIso);
  if (!baseIso) {
    return new Date(minStart.getTime() + DAY_MS).toISOString();
  }
  const dayUtc = new Date(baseIso);
  let exclusive = addDaysUtc(dayUtc, 1);
  if (exclusive <= minStart) exclusive = new Date(minStart.getTime() + DAY_MS);
  return exclusive.toISOString();
}

function normalizeAllDayIsoValue(value: string): string {
  const direct = isoFromDateOnly(value);
  if (direct) return direct;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return zonedStartOfDayUtc(formatInTimeZone(parsed, APP_TIMEZONE).date, APP_TIMEZONE).toISOString();
}

function normalizeDraftBounds(draft: NewEvent): { start: string; end: string } {
  if (draft.allDay) {
    const start = typeof draft.start === 'string' ? parseAppDateOnly(draft.start, APP_TIMEZONE) : null
    const startMidnight = start ?? zonedStartOfDayUtc(formatInTimeZone(new Date(), APP_TIMEZONE).date, APP_TIMEZONE)
    let end = typeof draft.end === 'string' ? parseAppDateOnly(draft.end, APP_TIMEZONE) : null
    if (!end || end <= startMidnight) {
      end = addDaysUtc(startMidnight, 1)
    }
    return { start: startMidnight.toISOString(), end: end.toISOString() }
  }

  const startDate = typeof draft.start === 'string' ? parseAppDateTime(draft.start, APP_TIMEZONE) : null
  const startInstant = startDate && !Number.isNaN(startDate.getTime()) ? startDate : new Date(draft.start)
  if (Number.isNaN(startInstant.getTime())) {
    const now = new Date()
    const later = new Date(now.getTime() + 60 * 60 * 1000)
    return { start: now.toISOString(), end: later.toISOString() }
  }

  const endCandidate = typeof draft.end === 'string' ? parseAppDateTime(draft.end, APP_TIMEZONE) : null
  let endDate = endCandidate && !Number.isNaN(endCandidate.getTime()) ? endCandidate : new Date(draft.end ?? startInstant)
  if (Number.isNaN(endDate.getTime()) || endDate <= startInstant) {
    endDate = new Date(startInstant.getTime() + 60 * 60 * 1000)
  }
  return { start: startInstant.toISOString(), end: endDate.toISOString() }
}

type NormalizeEventInput = { start?: string | Date | null; end?: string | Date | null; allDay?: boolean | null };

function normalizeEventTimes(event: NormalizeEventInput): { start: string; end: string } {
  const startInstant = event.start instanceof Date ? event.start : (typeof event.start === 'string' ? parseAppDateTime(event.start, APP_TIMEZONE) : null) ?? new Date(event.start ?? Date.now());
  const endInstantRaw = event.end instanceof Date ? event.end : (typeof event.end === 'string' ? parseAppDateTime(event.end, APP_TIMEZONE) : null);

  if (event.allDay) {
    const startMidnight = (typeof event.start === 'string' ? parseAppDateOnly(event.start, APP_TIMEZONE) : null) ?? zonedStartOfDayUtc(formatInTimeZone(startInstant, APP_TIMEZONE).date, APP_TIMEZONE);
    let endMidnight = typeof event.end === 'string' ? parseAppDateOnly(event.end, APP_TIMEZONE) : null;
    if (!endMidnight || endMidnight <= startMidnight) {
      endMidnight = addDaysUtc(startMidnight, 1);
    }
    return { start: startMidnight.toISOString(), end: endMidnight.toISOString() };
  }

  const endInstant = endInstantRaw && !Number.isNaN(endInstantRaw.getTime()) ? endInstantRaw : startInstant;
  return { start: startInstant.toISOString(), end: endInstant.toISOString() };
}

function formatDateInputValue(iso: string, { allDay, isEnd = false }: { allDay: boolean; isEnd?: boolean }): string {
  if (!iso) return ''
  if (!allDay) {
    const parsed = new Date(iso)
    if (Number.isNaN(parsed.getTime())) return ''
    return formatInTimeZone(parsed, APP_TZ).date
  }

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const { date: ymd, time } = formatInTimeZone(date, APP_TZ)

  if (isEnd && time === '00:00:00') {
    const startOfDayUtc = zonedStartOfDayUtc(ymd, APP_TZ)
    const previous = addDaysUtc(startOfDayUtc, -1)
    return formatInTimeZone(previous, APP_TZ).date
  }

  return ymd
}

function formatDateTimeInputValue(iso: string, { allDay, isEnd = false }: { allDay: boolean; isEnd?: boolean }): string {
  if (!iso) return '';
  if (!allDay) return toLocalInput(iso);
  const date = new Date(iso);
  if (isEnd) {
    if (isUtcMidnight(date)) {
      date.setMinutes(date.getMinutes() - 1);
    }
    date.setHours(23, 59, 0, 0);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return dateToLocalInput(date);
}

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
