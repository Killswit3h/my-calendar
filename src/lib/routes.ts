import type { ComponentType } from 'react'
import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  LineChart,
  Package,
  Users,
  Truck,
  ShieldCheck,
  PackageSearch,
  Settings2,
  BarChart4,
  FolderKanban,
} from 'lucide-react'

export type NavItem = {
  key: string
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

export const SHELL_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'calendar', label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { key: 'projects', label: 'Projects', href: '/projects', icon: FolderKanban },
  { key: 'documents', label: 'Documents', href: '/documents', icon: FileText },
  { key: 'finance', label: 'Finance', href: '/finance', icon: LineChart },
  { key: 'inventory', label: 'Inventory', href: '/inventory', icon: Package },
  { key: 'procurement', label: 'Procurement', href: '/procurement', icon: PackageSearch },
  { key: 'hr', label: 'HR', href: '/hr', icon: Users },
  { key: 'fleet', label: 'Fleet', href: '/fleet', icon: Truck },
  { key: 'compliance', label: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { key: 'reports', label: 'Reports', href: '/reports', icon: BarChart4 },
  { key: 'admin', label: 'Admin', href: '/admin', icon: Settings2 },
]

export type NavGroup = {
  key: string
  label: string
  items: NavItem[]
}

export const SHELL_NAV_GROUPS: NavGroup[] = [
  {
    key: 'work',
    label: 'Workspace',
    items: SHELL_NAV_ITEMS.slice(0, 9),
  },
  {
    key: 'oversight',
    label: 'Oversight',
    items: SHELL_NAV_ITEMS.slice(9, 11),
  },
  {
    key: 'admin',
    label: 'Administration',
    items: SHELL_NAV_ITEMS.slice(11),
  },
]

export const QUICK_LINKS = [
  { label: 'New Project', href: '/projects?create=1' },
  { label: 'Log Incident', href: '/compliance/incidents?create=1' },
  { label: 'Add Inventory Item', href: '/inventory/items?create=1' },
]

export const HOTKEYS = {
  focusSearch: ['meta+k', 'ctrl+k', '/'],
  goDashboard: ['g d', 'g h'],
  goCalendar: ['g c'],
}

export const SHELL_EVENTS = {
  focusSearch: 'shell:focus-search',
}
