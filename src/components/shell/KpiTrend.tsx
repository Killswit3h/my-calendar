// src/components/shell/KpiTrend.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className={cn("glass", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
