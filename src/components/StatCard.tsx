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
    if (change === undefined) return "text-neutral-500";
    if (change > 0) return "text-[hsl(var(--color-accent))]";
    if (change < 0) return "text-red-500";
    return "text-neutral-500";
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="text-2xl font-bold text-[hsl(var(--color-fg))]">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
              <span>{getTrendIcon()}</span>
              <span>{Math.abs(change)}%</span>
              {changeLabel && <span className="text-neutral-500">vs {changeLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="h-12 w-12 rounded-lg bg-[hsl(var(--color-accent)/0.1)] flex items-center justify-center text-[hsl(var(--color-accent))]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}