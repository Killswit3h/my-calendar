import AppSidebar from "@/components/shell/AppSidebar";
import AppTopbar from "@/components/shell/AppTopbar";
import BackButton from "@/components/BackButton";

export default function CalendarPage() {
  return (
    <div className="min-h-dvh flex">
      <AppSidebar current="/calendar" />
      <div className="flex-1">
        <AppTopbar />
        <main className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
          <BackButton />
          <header>
            <h1 className="text-3xl font-semibold">Calendar</h1>
            <p className="text-muted">Manage your events and schedule</p>
          </header>

          <section className="card p-6">
            <div className="text-lg font-medium mb-4">Calendar View</div>
            <div className="text-muted">Calendar functionality will be integrated here</div>
          </section>
        </main>
      </div>
    </div>
  );
}
