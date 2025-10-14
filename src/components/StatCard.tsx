import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
}

export default function StatCard({ title, value, change, changeLabel, icon }: StatCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return "↗";
    if (change < 0) return "↘";
    return "→";
  };

  const getTrendColor = () => {
    if (change === undefined) return "text-[rgb(var(--color-muted))]";
    if (change > 0) return "text-[rgb(var(--color-accent))]";
    if (change < 0) return "text-red-400";
    return "text-[rgb(var(--color-muted))]";
  };

  return (
    <div className="card p-6">
      <div className="space-y-2">
        <p className="text-white text-sm font-medium">{title}</p>
        <p className="text-white text-4xl font-bold">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            <span>{getTrendIcon()}</span>
            <span>{Math.abs(change)}%</span>
            {changeLabel && <span className="text-[rgb(var(--color-muted))]">vs {changeLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}