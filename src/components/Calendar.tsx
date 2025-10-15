'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DateSelectArg, EventClickArg, EventContentArg } from '@fullcalendar/core';

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
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(() => {
    try { const s = localStorage.getItem('weather.coords'); if (s) return JSON.parse(s); } catch {}
    return null;
  });
  const [weather, setWeather] = useState<Record<string, { tmax: number; tmin: number; pop: number; code: number }>>({});
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);
  const [holidayDialog, setHolidayDialog] = useState(false);
  const [weatherDialog, setWeatherDialog] = useState(false);
  // country already defined above; remove accidental duplicate
  const [weatherQuery, setWeatherQuery] = useState('');

  useEffect(() => {
    const m = window.matchMedia('(max-width: 640px)');
    const handler = () => setIsMobile(m.matches);
    handler();
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);
  

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
      setVisibleRange({ start: arg.start, end: arg.end });
      const mid = new Date((arg.start.getTime() + arg.end.getTime()) / 2);
      const y = mid.getUTCFullYear();
      fetchHolidays(y, country);
      if (coords) fetchWeather(arg.start, arg.end, coords);
    },
    [country, fetchHolidays, coords]
  );

  // manual location only (set via Weather dialog)

  // fetch daily forecast for visible range
  const fetchWeather = useCallback(async (start: Date, end: Date, c: { lat: number; lon: number }) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmtLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const startDate = fmtLocal(start);
    // FullCalendar provides an exclusive end; move back one day using local calendar math
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
    const base = initialDate ?? new Date();
    const y = base.getUTCFullYear();
    const m = base.getUTCMonth();
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 1));
    fetchWeather(start, end, coords);
  }, [coords, initialDate, fetchWeather]);

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

  const dayCellDidMount = useCallback((arg: { date: Date; el: HTMLElement }) => {
    const ymd = (arg.el as HTMLElement).getAttribute('data-date')
      ?? new Date(arg.date.getTime() - arg.date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const top = arg.el.querySelector('.fc-daygrid-day-top');
    if (!top || !ymd) return;
    const existing = top.querySelector('.day-weather');
    if (existing) existing.remove();
    const data = weather[ymd];
    if (!data || !coords) return;
    const a = document.createElement('a');
    a.className = 'day-weather';
    const ico = document.createElement('span'); ico.className = 'ico'; ico.textContent = weatherIcon(data.code, data.pop);
    const txt = document.createElement('span'); txt.textContent = `${Math.round(data.tmax)}\u00B0F ${Math.round(data.pop)}%`;
    a.appendChild(ico); a.appendChild(txt);
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
  }, [weather, coords]);

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

  // create
  const handleSelect = useCallback((sel: DateSelectArg) => {
    setEditId(null);
    // FullCalendar selection provides exclusive end date (day after)
    // We keep it as-is for proper multi-day spanning
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

    // For multi-day events: ensure end date is properly set
    // FullCalendar uses exclusive end dates (the day after the last displayed day)
    let finalEnd = draft.end;
    if (draft.allDay && draft.end) {
      const startDate = new Date(draft.start);
      const endDate = new Date(draft.end);
      // If user selected same day for start and end, or end is before start, add one day
      if (endDate <= startDate) {
        const nextDay = new Date(startDate);
        nextDay.setDate(nextDay.getDate() + 1);
        finalEnd = nextDay.toISOString().slice(0, 10);
      }
    }

    if (editId) {
      // update
      setEvents(prev =>
        prev.map(ev =>
          ev.id === editId
            ? {
                ...ev,
                title: draft.title,
                start: draft.start,
                end: finalEnd,
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
          end: finalEnd,
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

  return (
    <div className="cal-shell">
      <div className="mb-4 flex items-center gap-3 flex-wrap justify-start">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={holidayOn}
            onChange={e => setHolidayOn(e.target.checked)}
          />
        <span>Show public holidays</span>
        </label>
        <button className="btn" onClick={() => setHolidayDialog(true)}>Holidays…</button>
        <button className="btn" onClick={() => setWeatherDialog(true)}>Weather…</button>
      </div>

      <div className="surface p-2">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={initialDate}
          height="auto"
          dayCellDidMount={dayCellDidMount}
          eventContent={eventContent}
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

              {isMobile ? (
                <>
                  <label>
                    <div>Start date</div>
                    <input
                      type="date"
                      value={toLocalDate(draft.start)}
                      onChange={e => {
                        const date = e.target.value;
                        const time = toLocalTime(draft.start);
                        setDraft({ ...draft, start: fromLocalDateTime(date, time) });
                      }}
                    />
                  </label>
                  {!draft.allDay && (
                    <label>
                      <div>Start time</div>
                      <input
                        type="time"
                        value={toLocalTime(draft.start)}
                        onChange={e => {
                          const time = e.target.value;
                          const date = toLocalDate(draft.start);
                          setDraft({ ...draft, start: fromLocalDateTime(date, time) });
                        }}
                      />
                    </label>
                  )}
                  <label>
                    <div>End date</div>
                    <input
                      type="date"
                      value={toLocalDate(draft.end ?? draft.start)}
                      onChange={e => {
                        const date = e.target.value;
                        const time = toLocalTime(draft.end ?? draft.start);
                        setDraft({ ...draft, end: fromLocalDateTime(date, time) });
                      }}
                    />
                  </label>
                  {!draft.allDay && (
                    <label>
                      <div>End time</div>
                      <input
                        type="time"
                        value={toLocalTime(draft.end ?? draft.start)}
                        onChange={e => {
                          const time = e.target.value;
                          const date = toLocalDate(draft.end ?? draft.start);
                          setDraft({ ...draft, end: fromLocalDateTime(date, time) });
                        }}
                      />
                    </label>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}

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

              <label className="span-2">
                <div>Location</div>
                <input
                  type="text"
                  value={draft.location ?? ''}
                  onChange={e => setDraft({ ...draft, location: e.target.value })}
                />
                <div className="mt-2">
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

      {holidayDialog && (
        <div className="modal-root" onClick={(e) => { if (e.currentTarget === e.target) setHolidayDialog(false); }}>
          <div className="modal-card" role="dialog" aria-modal="true">
            <h3 className="modal-title">Holiday Country</h3>
            <div className="form-grid">
              <label>
                <div>Country</div>
                <select value={country} onChange={e => setCountry(e.target.value)}>
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

      {weatherDialog && (
        <div className="modal-root" onClick={(e) => { if (e.currentTarget === e.target) setWeatherDialog(false); }}>
          <div className="modal-card" role="dialog" aria-modal="true">
            <h3 className="modal-title">Weather Location</h3>
            <div className="form-grid">
              <label className="span-2">
                <div>City, State or Lat,Lng</div>
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
function toLocalDate(isoLike: string) { return toLocalInput(isoLike).slice(0, 10); }
function toLocalTime(isoLike: string) { return toLocalInput(isoLike).slice(11, 16); }
function fromLocalDateTime(date: string, time: string) { return fromLocalInput(`${date}T${time}`); }
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
