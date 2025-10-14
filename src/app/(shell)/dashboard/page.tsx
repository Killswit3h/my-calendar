// src/app/(shell)/dashboard/page.tsx
import { PageHeader } from '@/components/shell/PageHeader'
import { StatCard } from '@/components/shell/StatCard'
import { KpiTrend } from '@/components/shell/KpiTrend'
import { DataTable } from '@/components/shell/DataTable'
import { Badge } from '@/components/ui/badge'
import { 
  MapPinned, 
  Timer, 
  ArrowDownRight, 
  ArrowUpRight, 
  Compass, 
  CalendarDays,
  TrendingUp,
  Users,
  FileText,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

export const revalidate = 60

// Mock data - replace with actual data fetching
const stats = [
  {
    title: 'Jobs Active',
    value: '11',
    change: 12.4,
    changeLabel: 'last month',
    icon: <MapPinned className="h-6 w-6" />
  },
  {
    title: 'Crews Dispatched',
    value: '8',
    change: 5.7,
    changeLabel: 'last week',
    icon: <Users className="h-6 w-6" />
  },
  {
    title: 'Invoices Pending',
    value: '107',
    change: -2.1,
    changeLabel: 'last week',
    icon: <FileText className="h-6 w-6" />
  },
  {
    title: 'Safety Alerts',
    value: '2',
    change: 0,
    changeLabel: 'last week',
    icon: <AlertTriangle className="h-6 w-6" />
  }
]

const recentActivity = [
  {
    id: '1',
    type: 'Project Update',
    description: 'I-95 Sound Barrier Segment 4 - Panel installation complete',
    time: '2 hours ago',
    status: 'completed'
  },
  {
    id: '2',
    type: 'RFI',
    description: 'Port Everglades Fence - Material specification clarification',
    time: '4 hours ago',
    status: 'pending'
  },
  {
    id: '3',
    type: 'Safety Incident',
    description: 'Near miss report - Guardrail panel lift',
    time: '6 hours ago',
    status: 'investigation'
  },
  {
    id: '4',
    type: 'Inventory Alert',
    description: 'Low stock alert - 9ga Fence Fabric',
    time: '8 hours ago',
    status: 'warning'
  }
]

const activityColumns = [
  { key: 'type' as const, header: 'Type' },
  { key: 'description' as const, header: 'Description' },
  { key: 'time' as const, header: 'Time' },
  { 
    key: 'status' as const, 
    header: 'Status',
    render: (status: string) => {
      const variants = {
        completed: 'success',
        pending: 'info',
        investigation: 'warning',
        warning: 'warning'
      } as const
      
      return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>
    }
  }
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Unified view of jobs, crews, RFIs, and operations"
        showBackButton={false}
        actions={
          <div className="flex gap-2">
            <Link 
              href="/calendar"
              className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent/90"
            >
              Open Calendar
            </Link>
            <Link 
              href="/reports/daily"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:opacity-80"
            >
              Daily Report
            </Link>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeLabel={stat.changeLabel}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KpiTrend 
          title="Performance Trend" 
          data={[
            { name: 'Jan', value: 65 },
            { name: 'Feb', value: 72 },
            { name: 'Mar', value: 68 },
            { name: 'Apr', value: 75 },
            { name: 'May', value: 82 },
            { name: 'Jun', value: 78 },
          ]}
        />
        
        <DataTable
          title="Recent Activity"
          data={recentActivity}
          columns={activityColumns}
        />
      </div>
    </div>
  )
}