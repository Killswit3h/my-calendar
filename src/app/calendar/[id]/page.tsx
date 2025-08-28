import CalendarWithData from "@/components/CalendarWithData";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="container mx-auto p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">GFC Calendar</h1>
      </header>

      <div className="p-2">
        <CalendarWithData calendarId={id} />
      </div>
    </main>
  );
}
