// src/app/calendar/[id]/page.tsx
export const runtime = 'edge'
import CalendarWithData from "@/components/CalendarWithData"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CalendarWithData calendarId={id} />
}
