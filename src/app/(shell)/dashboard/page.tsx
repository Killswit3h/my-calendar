import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Link from "next/link";

const stats = [
  {
    title: "Jobs Active",
    value: "11",
    change: 12.4,
    changeLabel: "last month",
    icon: "📊",
  },
  {
    title: "Crews Dispatched",
    value: "8",
    change: 5.7,
    changeLabel: "last week",
    icon: "👥",
  },
  {
    title: "Invoices Pending",
    value: "107",
    change: -2.1,
    changeLabel: "last week",
    icon: "📄",
  },
  {
    title: "Safety Alerts",
    value: "2",
    change: 0,
    changeLabel: "last week",
    icon: "⚠️",
  },
];

const recentActivity = [
  {
    id: "1",
    type: "Project Update",
    description: "I-95 Sound Barrier Segment 4 - Panel installation complete",
    time: "2 hours ago",
    status: "completed",
  },
  {
    id: "2",
    type: "RFI",
    description: "Port Everglades Fence - Material specification clarification",
    time: "4 hours ago",
    status: "pending",
  },
  {
    id: "3",
    type: "Safety Incident",
    description: "Near miss report - Guardrail panel lift",
    time: "6 hours ago",
    status: "investigation",
  },
  {
    id: "4",
    type: "Inventory Alert",
    description: "Low stock alert - 9ga Fence Fabric",
    time: "8 hours ago",
    status: "warning",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Unified view of jobs, crews, RFIs, and operations"
        showBackButton={false}
        actions={
          <div className="flex gap-2">
            <Link href="/calendar" className="btn btn-primary">
              Open Calendar
            </Link>
            <Link href="/reports/daily" className="btn">
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

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 rounded-md hover:bg-black/5 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{activity.type}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activity.status === "completed" ? "bg-green-100 text-green-800" :
                    activity.status === "pending" ? "bg-blue-100 text-blue-800" :
                    activity.status === "investigation" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {activity.status}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mt-1">{activity.description}</p>
                <p className="text-xs text-neutral-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}