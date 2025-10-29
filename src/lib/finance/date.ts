export function dateOnly(d: Date | string): Date {
  const x = typeof d === "string" ? new Date(d) : d;
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

export function inclusiveDaySpan(start: Date | string, end: Date | string): number {
  const s = dateOnly(start);
  const e = dateOnly(end);
  if (Number.isNaN(+s) || Number.isNaN(+e)) return 0;
  const ms = e.getTime() - s.getTime();
  return Math.floor(ms / 86400000) + 1;
}
