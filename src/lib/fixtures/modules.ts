export type ProjectFixture = {
  id: string
  name: string
  status: 'Planning' | 'Active' | 'Closeout'
  superintendent: string
  startDate: string
  completion: string
}

export const PROJECT_FIXTURES: ProjectFixture[] = [
  {
    id: 'PRJ-1024',
    name: 'I-95 Sound Barrier Segment 4',
    status: 'Active',
    superintendent: 'Dana Cooper',
    startDate: '2024-07-08',
    completion: '2025-01-15',
  },
  {
    id: 'PRJ-1041',
    name: 'Port Everglades Fence Modernization',
    status: 'Planning',
    superintendent: 'Simon Keller',
    startDate: '2024-09-02',
    completion: '2025-03-10',
  },
  {
    id: 'PRJ-1033',
    name: 'SR-836 Shoulder Barrier Retrofit',
    status: 'Active',
    superintendent: 'Kira Nunez',
    startDate: '2024-05-13',
    completion: '2024-12-20',
  },
]

export type DocumentFixture = {
  id: string
  project: string
  type: string
  updatedAt: string
  owner: string
}

export const DOCUMENT_FIXTURES: DocumentFixture[] = [
  { id: 'DOC-210', project: 'SR-836 Shoulder Barrier Retrofit', type: 'Submittal', updatedAt: '2024-09-22', owner: 'Quality' },
  { id: 'DOC-214', project: 'I-95 Sound Barrier Segment 4', type: 'RFI Response', updatedAt: '2024-09-20', owner: 'Design' },
  { id: 'DOC-199', project: 'Port Everglades Fence Modernization', type: 'Plan Set', updatedAt: '2024-09-18', owner: 'PMO' },
]

export type FinanceFixture = {
  id: string
  type: 'Contract' | 'Pay App' | 'Invoice' | 'Change Order'
  project: string
  amount: number
  status: 'Draft' | 'Pending' | 'Approved'
  dueDate: string
}

export const FINANCE_FIXTURES: FinanceFixture[] = [
  { id: 'CN-203', type: 'Contract', project: 'SR-836 Shoulder Barrier Retrofit', amount: 2150000, status: 'Approved', dueDate: '2024-09-30' },
  { id: 'INV-557', type: 'Invoice', project: 'I-95 Sound Barrier Segment 4', amount: 185000, status: 'Pending', dueDate: '2024-09-28' },
  { id: 'CO-112', type: 'Change Order', project: 'Port Everglades Fence Modernization', amount: 43000, status: 'Draft', dueDate: '2024-10-06' },
]

export type InventoryFixture = {
  id: string
  name: string
  sku: string
  quantity: number
  unit: string
  location: string
  status: 'Available' | 'Reserved' | 'In transit' | 'Service'
  category: string
  minStock?: number
}

export const INVENTORY_FIXTURES: InventoryFixture[] = [
  {
    id: 'INV-311',
    name: '9ga Fence Fabric • 100ft',
    sku: 'FAB-100-9GA',
    quantity: 42,
    unit: 'rolls',
    location: 'Miami Yard',
    status: 'Available',
    category: 'Materials',
    minStock: 30,
  },
  {
    id: 'INV-118',
    name: 'Hydraulic Post Driver',
    sku: 'TOOL-HPD-07',
    quantity: 3,
    unit: 'units',
    location: 'Crew Truck 12',
    status: 'Reserved',
    category: 'Tools',
    minStock: 2,
  },
  {
    id: 'INV-244',
    name: 'Guardrail Panel • 12ft',
    sku: 'GRD-12-STD',
    quantity: 128,
    unit: 'panels',
    location: 'Logistics Hub',
    status: 'In transit',
    category: 'Materials',
    minStock: 120,
  },
  {
    id: 'INV-079',
    name: 'Impact Driver Batteries',
    sku: 'BAT-20V-4AH',
    quantity: 18,
    unit: 'packs',
    location: 'Warehouse B',
    status: 'Available',
    category: 'Consumables',
    minStock: 15,
  },
  {
    id: 'INV-402',
    name: 'Mini-Excavator Attachments',
    sku: 'ATT-MX-18',
    quantity: 2,
    unit: 'sets',
    location: 'Service Bay',
    status: 'Service',
    category: 'Equipment',
    minStock: 1,
  },
]

export type ProcurementFixture = {
  id: string
  type: 'RFQ' | 'PO' | 'Delivery'
  vendor: string
  project: string
  status: string
  expectedOn?: string
}

export const PROCUREMENT_FIXTURES: ProcurementFixture[] = [
  { id: 'RFQ-88', type: 'RFQ', vendor: 'SteelCo', project: 'SR-836 Shoulder Barrier Retrofit', status: 'Awaiting bids', expectedOn: '2024-09-27' },
  { id: 'PO-321', type: 'PO', vendor: 'Sunshine ReadyMix', project: 'I-95 Sound Barrier Segment 4', status: 'Issued', expectedOn: '2024-09-25' },
  { id: 'DLV-144', type: 'Delivery', vendor: 'Fasteners USA', project: 'Port Everglades Fence Modernization', status: 'In transit', expectedOn: '2024-09-23' },
]

export type HrFixture = {
  id: string
  name: string
  role: string
  status: string
  certifications: number
}

export const HR_FIXTURES: HrFixture[] = [
  { id: 'EMP-014', name: 'Maria Velasquez', role: 'Crew Lead', status: 'Active', certifications: 5 },
  { id: 'EMP-027', name: "D'Andre Hill", role: 'Installer', status: 'Active', certifications: 3 },
  { id: 'EMP-032', name: 'Kevin Zhang', role: 'Estimator', status: 'PTO', certifications: 2 },
]

export type FleetFixture = {
  id: string
  unit: string
  status: string
  location: string
  nextService: string
}

export const FLEET_FIXTURES: FleetFixture[] = [
  { id: 'FLT-201', unit: 'Service Truck 07', status: 'Active', location: 'Miami Yard', nextService: '2024-10-12' },
  { id: 'FLT-148', unit: 'Mini-Excavator', status: 'Shop hold', location: 'Service Bay', nextService: '2024-09-28' },
  { id: 'FLT-133', unit: 'Dump Truck 03', status: 'Active', location: 'I-95 Segment 4', nextService: '2024-11-03' },
]

export type ComplianceFixture = {
  id: string
  type: 'Incident' | 'Expiration' | 'Policy'
  reference: string
  status: string
  owner: string
  due: string
}

export const COMPLIANCE_FIXTURES: ComplianceFixture[] = [
  { id: 'INC-45', type: 'Incident', reference: 'Near miss – panel lift', status: 'Investigation', owner: 'Safety', due: '2024-09-24' },
  { id: 'EXP-12', type: 'Expiration', reference: 'FDOT ROW Permit', status: '15 days', owner: 'Permitting', due: '2024-10-05' },
  { id: 'POL-07', type: 'Policy', reference: 'Fall Protection SOP', status: 'Revision draft', owner: 'Safety', due: '2024-09-30' },
]

export type ReportFixture = {
  id: string
  category: 'Daily' | 'Weekly' | 'Finance' | 'Exports'
  title: string
  generatedOn: string
  author: string
}

export const REPORT_FIXTURES: ReportFixture[] = [
  { id: 'RPT-D-982', category: 'Daily', title: 'Daily Snapshot – 2024-09-21', generatedOn: '2024-09-21T18:05:00Z', author: 'Automation' },
  { id: 'RPT-W-344', category: 'Weekly', title: 'Weekly Summary – Week 38', generatedOn: '2024-09-22T12:40:00Z', author: 'Analytics' },
  { id: 'RPT-F-117', category: 'Finance', title: 'Cash Flow – September', generatedOn: '2024-09-20T09:15:00Z', author: 'Finance' },
]

export type AdminFixture = {
  id: string
  name: string
  type: 'User' | 'Role' | 'Integration' | 'Automation'
  status: string
  updatedAt: string
}

export const ADMIN_FIXTURES: AdminFixture[] = [
  { id: 'USR-221', name: 'Michelle Alvarez', type: 'User', status: 'Active', updatedAt: '2024-09-18' },
  { id: 'ROL-014', name: 'Yard Supervisor', type: 'Role', status: 'In review', updatedAt: '2024-09-17' },
  { id: 'INT-009', name: 'Procore Sync', type: 'Integration', status: 'Connected', updatedAt: '2024-09-12' },
  { id: 'AUT-003', name: 'Daily weather alert', type: 'Automation', status: 'Enabled', updatedAt: '2024-09-19' },
]
