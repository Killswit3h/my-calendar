"use client";
import { useEffect, useMemo, useState } from "react";

type FileItem = { id: string; kind: 'DAILY_PDF'|'DAILY_XLSX'|'WEEKLY_PDF'; reportDate?: string; weekStart?: string; weekEnd?: string; vendor?: string|null; blobUrl: string; createdAt: string };

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function fmtYmd(d: Date) { return d.toISOString().slice(0,10); }
function mondayOf(d: Date) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const wd = x.getUTCDay(); const diff = (wd+6)%7; x.setUTCDate(x.getUTCDate()-diff); return x; }
function sundayOf(d: Date) { const m = mondayOf(d); const s = new Date(m.getTime()); s.setUTCDate(s.getUTCDate()+6); return s; }

export default function ReportsPage() {
  const [daily, setDaily] = useState<FileItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [vendor, setVendor] = useState<string>("");
  const [wStart, setWStart] = useState<string>(()=>fmtYmd(mondayOf(new Date())));
  const [wEnd, setWEnd] = useState<string>(()=>fmtYmd(sundayOf(new Date())));
  const [genUrl, setGenUrl] = useState<string>("");
  const [genErr, setGenErr] = useState<string>("");

  useEffect(() => { (async () => {
    const j = await api<{ items: FileItem[] }>(`/api/reports/list?kind=DAILY_PDF`);
    setDaily(j.items.slice(0, 40));
  })().catch(()=>{}); }, []);

  const last14 = useMemo(() => {
    const map = new Map<string, { date: string; pdf?: FileItem; xlsx?: FileItem; vendor?: string|null }>();
    for (const it of daily) {
      const key = (it.reportDate || '') + '|' + (it.vendor || '');
      const rec = map.get(key) || { date: it.reportDate || '', vendor: it.vendor || null };
      if (it.kind === 'DAILY_PDF') rec.pdf = it;
      if (it.kind === 'DAILY_XLSX') rec.xlsx = it;
      map.set(key, rec);
    }
    return Array.from(map.values()).slice(0,14);
  }, [daily]);

  async function generateWeekly() {
    setBusy(true); setGenErr(""); setGenUrl("");
    try {
      const j = await api<{ pdfUrl: string }>(`/api/reports/weekly/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weekStart: wStart, weekEnd: wEnd, vendor: vendor || null }) });
      setGenUrl(j.pdfUrl);
    } catch (e: any) { setGenErr(e?.message || 'failed'); }
    finally { setBusy(false); }
  }

  return (
    <main className="cal-shell">
      <h1 className="page-title">Reports</h1>
      <section className="surface p-4" style={{ marginTop: 12 }}>
        <h3>Daily Auto-Saved</h3>
        <ul className="space-y-2" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {last14.map((r, i) => (
            <li key={i} className="flex items-center justify-between border border-[var(--border)] rounded-[10px] p-2 bg-[var(--card-2)]">
              <span>{r.date?.slice(0,10)} {r.vendor ? `• ${r.vendor}` : ''}</span>
              <span className="flex gap-2">
                {r.pdf ? <a className="btn" href={r.pdf.blobUrl} target="_blank">PDF</a> : null}
                {r.xlsx ? <a className="btn" href={r.xlsx.blobUrl} target="_blank">Excel</a> : null}
              </span>
            </li>
          ))}
          {last14.length === 0 ? <li className="muted-sm">No files yet</li> : null}
        </ul>
      </section>

      <section className="surface p-4" style={{ marginTop: 12 }}>
        <h3>Generate Weekly Report</h3>
        <div className="form-grid" style={{ maxWidth: 700 }}>
          <label>
            <div>Week Start (Mon)</div>
            <input type="date" value={wStart} onChange={e=>setWStart(e.target.value)} />
          </label>
          <label>
            <div>Week End (Sun)</div>
            <input type="date" value={wEnd} onChange={e=>setWEnd(e.target.value)} />
          </label>
          <label>
            <div>Vendor</div>
            <select value={vendor} onChange={e=>setVendor(e.target.value)}>
              <option value="">All vendors</option>
              <option value="JORGE">Jorge</option>
              <option value="TONY">Tony</option>
              <option value="CHRIS">Chris</option>
            </select>
          </label>
          <div className="modal-actions">
            <button className="btn primary" disabled={busy} onClick={generateWeekly}>{busy ? 'Generating…' : 'Generate'}</button>
            {genUrl ? <a className="btn" href={genUrl} target="_blank">Download</a> : null}
          </div>
          {genErr ? <div style={{ color: '#ef4444' }}>{genErr}</div> : null}
        </div>
      </section>
    </main>
  );
}

