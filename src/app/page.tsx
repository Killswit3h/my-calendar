export default function Page() {
  return (
    <main className="p-6 md:p-10">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {["Jobs active","Crews dispatched","Invoices pending","Alerts"].map((t,i)=>(
          <div key={i} className="card p-4">
            <div className="text-sm text-neutral-500">{t}</div>
            <div className="mt-2 text-3xl font-bold">—</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <button className="btn btn-primary">Primary</button>
        <button className="btn">Secondary</button>
      </div>
    </main>
  );
}