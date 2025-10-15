import BackButton from "@/components/BackButton";
import CalendarView from "@/components/calendar/CalendarView";
import JobTodos from "@/components/jobs/JobTodos"; // keep or remove if not used

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6">
      <BackButton />
      <header>
        <h1 className="text-3xl font-semibold">Calendar</h1>
        <p className="text-neutral-400">Manage your events and schedule</p>
      </header>

      <section className="card p-3 md:p-4 relative z-0">
        {/* Never absolute-position this wrapper. Let FullCalendar size inside. */}
        <CalendarView />
      </section>

      <section className="card p-4">
        <JobTodos />
      </section>
    </main>
  );
}