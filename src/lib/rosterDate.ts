export function dateKeyUTC(dateISO: string) {
  // Accept "YYYY-MM-DD" or ISO string. Always return canonical "YYYY-MM-DD".
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return dateISO;
  const d = new Date(dateISO);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toUTCDate(dateISO: string) {
  // Return Date at 00:00:00Z for that day
  return new Date(`${dateKeyUTC(dateISO)}T00:00:00.000Z`);
}


