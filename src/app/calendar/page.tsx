"use client";

import dynamicImport from "next/dynamic";
import AppSidebar from "@/components/shell/AppSidebar";
import AppTopbar from "@/components/shell/AppTopbar";
import BackButton from "@/components/BackButton";

const CalendarWithData = dynamicImport(() => import("@/components/calendar/CalendarView"), {
  ssr: false,
  loading: () => <div className="card p-6">Loading calendar…</div>,
});

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
          <section className="card p-4">
            <CalendarWithData />
          </section>
        </main>
      </div>
    </div>
  );
}