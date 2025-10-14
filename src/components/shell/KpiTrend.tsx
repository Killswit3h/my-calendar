// src/components/shell/KpiTrend.tsx
"use client"

import { cn } from '@/lib/theme'

interface KpiTrendProps {
  title: string
  data?: Array<{ name: string; value: number }>
  className?: string
}

export function KpiTrend({ title, data, className }: KpiTrendProps) {
  // Placeholder for chart - in production, you'd use Recharts here
  const mockData = data || [
    { name: 'Jan', value: 65 },
    { name: 'Feb', value: 72 },
    { name: 'Mar', value: 68 },
    { name: 'Apr', value: 75 },
    { name: 'May', value: 82 },
    { name: 'Jun', value: 78 },
  ]

  return (
    <div className={cn("glass rounded-lg", className)}>
      <div className="p-6 pb-0">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="p-6 pt-0">
        <div className="h-64 flex items-end justify-between gap-2">
          {mockData.map((item, index) => (
            <div key={item.name} className="flex flex-col items-center gap-2">
              <div
                className="w-8 bg-accent rounded-t-sm transition-all duration-300 hover:bg-accent/80"
                style={{ height: `${(item.value / 100) * 200}px` }}
              />
              <span className="text-xs text-muted">{item.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-muted">
          <p>Performance trend over the last 6 months</p>
        </div>
      </div>
    </div>
  )
}
