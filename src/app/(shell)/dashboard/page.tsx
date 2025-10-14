import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import BackButton from "@/components/BackButton";

const stats = [
  {
    title: "Jobs active",
    value: "16",
    change: 12.4,
    changeLabel: "last period",
  },
  {
    title: "Crews dispatched",
    value: "8",
    change: 5.7,
    changeLabel: "last period",
  },
  {
    title: "Invoices pending",
    value: "11",
    change: 41,
    changeLabel: "last period",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-white text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-[rgb(var(--color-muted))] text-lg">Unified view of jobs, crews, RFIs, and POs</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeLabel={stat.changeLabel}
          />
        ))}
      </div>

      {/* Alerts Section */}
      <div className="card p-8">
        <h3 className="text-white text-lg font-semibold mb-4">Alerts</h3>
        <div className="flex items-center justify-center py-12">
          <p className="text-[rgb(var(--color-muted))] text-lg">No recent activity</p>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-start">
        <BackButton />
      </div>
    </div>
  );
}