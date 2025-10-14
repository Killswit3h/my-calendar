// src/lib/nav.ts
import type { ComponentType } from 'react'
import {
  LayoutDashboard,
  CalendarDays,
  FolderKanban,
  FileText,
  LineChart,
  Package,
  PackageSearch,
  Users,
  Truck,
  ShieldCheck,
  BarChart4,
  Settings2,
} from 'lucide-react'

export type NavItem = {
  key: string
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  section?: string
}

export type NavSection = {
  key: string
  label: string
  items: NavItem[]
}

export const NAV_ITEMS: NavItem[] = [
  // Workspace
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'workspace' },
  { key: 'calendar', label: 'Calendar', href: '/calendar', icon: CalendarDays, section: 'workspace' },
  { key: 'projects', label: 'Projects', href: '/projects', icon: FolderKanban, section: 'workspace' },
  { key: 'documents', label: 'Documents', href: '/documents', icon: FileText, section: 'workspace' },
  { key: 'finance', label: 'Finance', href: '/finance', icon: LineChart, section: 'workspace' },
  { key: 'inventory', label: 'Inventory', href: '/inventory', icon: Package, section: 'workspace' },
  { key: 'procurement', label: 'Procurement', href: '/procurement', icon: PackageSearch, section: 'workspace' },
  { key: 'hr', label: 'HR', href: '/hr', icon: Users, section: 'workspace' },
  { key: 'fleet', label: 'Fleet', href: '/fleet', icon: Truck, section: 'workspace' },
  
  // Oversight
  { key: 'compliance', label: 'Compliance', href: '/compliance', icon: ShieldCheck, section: 'oversight' },
  { key: 'reports', label: 'Reports', href: '/reports', icon: BarChart4, section: 'oversight' },
  
  // Admin
  { key: 'admin', label: 'Admin', href: '/admin', icon: Settings2, section: 'admin' },
]

export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'workspace',
    label: 'Workspace',
    items: NAV_ITEMS.filter(item => item.section === 'workspace'),
  },
  {
    key: 'oversight',
    label: 'Oversight',
    items: NAV_ITEMS.filter(item => item.section === 'oversight'),
  },
  {
    key: 'admin',
    label: 'Administration',
    items: NAV_ITEMS.filter(item => item.section === 'admin'),
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
