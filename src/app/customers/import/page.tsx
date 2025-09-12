"use client";
import { useState } from "react";

export default function ImportCustomersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { total: number; inserted: number; skipped: number; errors: number; topErrors?: { message: string; count: number }[] }>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onImport() {
    setErr(null); setResult(null);
    if (!file) { setErr("Choose a CSV file"); return; }
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true);
    try {
      const r = await fetch("/api/customers/import", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Import failed");
      setResult(j);
    } catch (e: any) {
      setErr(e?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="cal-shell">
      <h1 className="page-title">Import Customers</h1>
      <p className="muted-sm">Upload a CSV (UTF-8). The first row should have a header like Customer, Display Name, Company, or Name. A single-column CSV with header Customer also works. We ignore duplicates case-insensitively.</p>
      <div className="surface p-4" style={{ marginTop: 12 }}>
        <div className="form-grid" style={{ maxWidth: 560 }}>
          <label className="span-2">
            <div>CSV File</div>
            <input type="file" accept=".csv,text/csv" onChange={e => setFile(e.currentTarget.files?.[0] ?? null)} />
          </label>
          <div className="modal-actions">
            <button className="btn primary" onClick={onImport} disabled={busy || !file}>{busy ? "Importing..." : "Import"}</button>
          </div>
          {err ? <div style={{ color: "#ef4444" }}>{err}</div> : null}
          {result ? (
            <div>
              <div>Total rows: {result.total}</div>
              <div>Inserted: {result.inserted}</div>
              <div>Skipped: {result.skipped}</div>
              <div>Errors: {result.errors}</div>
              {result.topErrors && result.topErrors.length ? (
                <div style={{ marginTop: 8 }}>
                  <div className="muted-sm">Top error reasons:</div>
                  <ul>
                    {result.topErrors.map((e, i) => (
                      <li key={i}>{e.message} ({e.count})</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
