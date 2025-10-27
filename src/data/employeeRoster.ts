export type LegacyTeam = 'South' | 'Central'

export const legacyRoster: Array<{ firstName: string; lastName: string; team: LegacyTeam }> = [
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
]

export const crewByTeam: Record<LegacyTeam, string> = {
  South: 'Fence South',
  Central: 'Guardrail A',
}

export const roleByTeam: Record<LegacyTeam, 'Skilled Labor' | 'Foreman'> = {
  South: 'Skilled Labor',
  Central: 'Foreman',
}

export const payById: Record<string, number> = {
  'edilberto-acuna': 25.5,
  'joselin-aguila': 21.5,
  'robert-amparo-lloret': 18.25,
  'jony-baquedano-mendoza': 31,
  'carlos-manuel-diaz': 17,
  'jose-santos-diaz': 17,
  'jose-fernandez': 23,
  'robert-gomez': 19,
  'oscar-hernandez': 15,
  'ventura-hernandez': 23,
  'pedro-manes': 23,
  'fabian-marquez': 25,
  'gerardo-oliva': 25,
  'luis-penaranda': 19,
  'adrian-ramos': 25,
  'esteban-sanchez': 15,
  'ramiro-valle': 15,
  'noel-venero': 18,
  'jaime-vergara': 28,
  'moises-varela': 28,
  'daniel-buell-burnette': 19.5,
  'christopher-jones': 28,
  'nicholas-sieber': 28,
  'troy-sturgil': 19,
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

export const toLegacyId = (firstName: string, lastName: string) => `${normalize(firstName)}-${normalize(lastName)}`
