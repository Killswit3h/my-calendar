import CalendarWithData from "@/components/CalendarWithData";

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { id } = await params;
  const token = (searchParams?.token as string) || "";

  return (
    <main>
      <h1>GFC Calendar</h1>

      {/* expose ?token= to the client (optional, used later for sharing) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__shareToken=${JSON.stringify(token)};`,
        }}
      />

      <CalendarWithData calendarId={id} />
    </main>
  );
}
