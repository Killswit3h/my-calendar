import CalendarWithData from "@/components/CalendarWithData";

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const qs = (await searchParams) ?? {};
  const token = (qs.token as string) || "";

  return (
    <main>
    

      {/* expose ?token= to the client (optional, used for sharing) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__shareToken=${JSON.stringify(token)};`,
        }}
      />

      <CalendarWithData calendarId={id} />
    </main>
  );
}
