'use client'

export interface HolidayPillProps {
  title: string
}

export default function HolidayPill({ title }: HolidayPillProps) {
  return (
    <div className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
      {title}
    </div>
  )
}
