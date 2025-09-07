export default function HolidayPill({ title }: { title: string }) {
  return (
    <span
      className="inline-block max-w-full truncate text-xs px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900"
      title={title}
    >
      {title}
    </span>
  )
}
