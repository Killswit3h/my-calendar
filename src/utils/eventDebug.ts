// utils/eventDebug.ts
export function dbgEventSpan(e: { id?: string; title?: string; startsAt: Date | string; endsAt: Date | string }) {
  const s = new Date(e.startsAt);
  const rawEnd = new Date(e.endsAt);
  const endIsMidnight = rawEnd.getHours() === 0 && rawEnd.getMinutes() === 0 && rawEnd.getSeconds() === 0;
  const sameDay = s.toDateString() === rawEnd.toDateString();

  // Many calendars store end exclusive. If end is midnight and not same-day, bump to end of previous day.
  const eFix = endIsMidnight && !sameDay ? new Date(rawEnd.getTime() - 1) : rawEnd;

  const dayMs = 86400000;
  const spanDays = Math.floor((eFix.setHours(23,59,59,999) - new Date(s).setHours(0,0,0,0)) / dayMs) + 1;

  console.log("[SPAN]", { id: e.id, title: e.title, startsAt: s.toISOString(), endsAtRaw: rawEnd.toISOString(), endsAtFixed: eFix.toISOString(), spanDays });
  return { spanDays, s, e: eFix };
}
