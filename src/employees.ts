export type Team = "South" | "Central";
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  team: Team;
}

const LS_KEY = 'employees';

function toId(first: string, last: string): string {
  const kebab = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  return `${kebab(first)}-${kebab(last)}`;
}

const seedData: Omit<Employee, 'id'>[] = [
  { firstName: 'Adrian', lastName: 'Ramos', team: 'South' },
  { firstName: 'Carlos', lastName: 'Manuel Diaz', team: 'South' },
  { firstName: 'Christopher', lastName: 'Jones', team: 'Central' },
  { firstName: 'Daniel', lastName: 'Buell Burnette', team: 'Central' },
  { firstName: 'Edilberto', lastName: 'Acuna', team: 'South' },
  { firstName: 'Esteban', lastName: 'Sanchez', team: 'South' },
  { firstName: 'Fabian', lastName: 'Marquez', team: 'South' },
  { firstName: 'Gerardo', lastName: 'Oliva', team: 'South' },
  { firstName: 'Jaime', lastName: 'Vergara', team: 'South' },
  { firstName: 'Jony', lastName: 'Baquedano Mendoza', team: 'South' },
  { firstName: 'Jose', lastName: 'Fernandez', team: 'South' },
  { firstName: 'Jose', lastName: 'Santos Diaz', team: 'South' },
  { firstName: 'Joselin', lastName: 'Aguila', team: 'South' },
  { firstName: 'Luis', lastName: 'Penaranda', team: 'South' },
  { firstName: 'Moises', lastName: 'Varela', team: 'South' },
  { firstName: 'Nicholas', lastName: 'Sieber', team: 'Central' },
  { firstName: 'Noel', lastName: 'Venero', team: 'South' },
  { firstName: 'Oscar', lastName: 'Hernandez', team: 'South' },
  { firstName: 'Pedro', lastName: 'Manes', team: 'South' },
  { firstName: 'Ramiro', lastName: 'Valle', team: 'South' },
  { firstName: 'Robert', lastName: 'Amparo Lloret', team: 'South' },
  { firstName: 'Robert', lastName: 'Gomez', team: 'South' },
  { firstName: 'Troy', lastName: 'Sturgil', team: 'Central' },
  { firstName: 'Ventura', lastName: 'Hernandez', team: 'South' },
];

const seedEmployees: Employee[] = seedData.map(e => ({
  ...e,
  id: toId(e.firstName, e.lastName),
}));

function sortEmployees(list: Employee[]): Employee[] {
  return list.sort(
    (a, b) =>
      a.firstName.localeCompare(b.firstName) ||
      a.lastName.localeCompare(b.lastName)
  );
}

export function getEmployees(): Employee[] {
  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const parsed: Employee[] = JSON.parse(raw);
        return sortEmployees(parsed);
      } catch {
        // ignore
      }
    }
  }
  return sortEmployees([...seedEmployees]);
}

export function saveEmployees(list: Employee[]): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LS_KEY, JSON.stringify(sortEmployees([...list])));
  }
}

export function addEmployee(emp: Omit<Employee, 'id'>): void {
  const list = getEmployees();
  const next: Employee = { ...emp, id: toId(emp.firstName, emp.lastName) };
  list.push(next);
  saveEmployees(list);
}

export function updateEmployee(id: string, patch: Partial<Omit<Employee, 'id'>>): void {
  const list = getEmployees();
  const idx = list.findIndex(e => e.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch };
    if (patch.firstName || patch.lastName) {
      list[idx].id = toId(list[idx].firstName, list[idx].lastName);
    }
    saveEmployees(list);
  }
}

export function deleteEmployee(id: string): void {
  const list = getEmployees().filter(e => e.id !== id);
  saveEmployees(list);
}

export function resetEmployees(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LS_KEY);
  }
}

