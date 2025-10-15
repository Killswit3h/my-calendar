import BackButton from "@/components/BackButton";

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <BackButton />
      <header>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted">Unified view of jobs, crews, RFIs, and POs</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {["Jobs active","Crews dispatched","Invoices pending","Alerts"].map((t)=>(
          <div key={t} className="card p-5">
            <div className="text-sm text-muted">{t}</div>
            <div className="mt-2 text-4xl font-bold">—</div>
            <div className="text-xs text-muted mt-1">vs last period</div>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <div className="text-lg font-medium mb-2">Recent activity</div>
        <div className="text-muted">No recent activity</div>
      </section>
    </main>
  );
}