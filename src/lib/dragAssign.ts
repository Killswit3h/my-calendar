// Drag-and-assign helpers and configuration

export const EMPLOYEE_MIME = 'application/x-employee';

export type EmployeeDragPayload = {
  id: string;
  name: string;
};

export function buildEmployeePayload(id: string, name: string): string {
  try {
    return JSON.stringify({ id, name } satisfies EmployeeDragPayload);
  } catch {
    return JSON.stringify({ id, name: String(name || '') });
  }
}

export function parseEmployeePayload(raw: string | null | undefined): EmployeeDragPayload | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj.id === 'string') {
      const name = typeof obj.name === 'string' ? obj.name : '';
      return { id: obj.id, name };
    }
  } catch {}
  return null;
}

// Configurable defaults for created events via drop onto a day cell
export const DEFAULT_SHIFT_START_LOCAL = '07:00'; // local time HH:mm
export const DEFAULT_SHIFT_DURATION_MINUTES = 480; // 8h
export const ALLOW_ALL_DAY_ON_DROP = true; // match current app behavior

export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromLocal(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

export function addMinutes(iso: string, minutes: number): string {
  const t = new Date(iso).getTime() + minutes * 60_000;
  return new Date(t).toISOString();
}
