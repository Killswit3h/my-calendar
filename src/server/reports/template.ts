import type { DaySnapshot, ReportRow } from "./queries";

export function renderWeeklyHtml(days: DaySnapshot[], vendor: string | null, tz: string): string {
  const pages = days.map(d => renderDaySection(d, tz, vendor));
  const legend = vendor ? `<div class="legend">Vendor: <span class="pill">${escapeHtml(vendor)}</span></div>` : "";
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: Letter landscape; margin: 0.25in; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #111; }
    .page { page-break-after: always; }
    h1 { margin: 0 0 8px; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
    th, td { border: 1px solid #999; padding: 4px 6px; vertical-align: top; }
    th { background: #efefef; text-align: left; font-weight: 700; }
    tr:nth-child(even) td { background: #fafafa; }
    .center { text-align: center; }
    .status { width: 6%; }
    .project { width: 20%; }
    .invoice { width: 10%; }
    .crew { width: 18%; }
    .work { width: 10%; }
    .payroll { width: 10%; }
    .payment { width: 8%; }
    .vendor { width: 8%; }
    .time { width: 10%; }
    .pill { display: inline-block; padding: 2px 6px; border-radius: 10px; background: #e6f2ff; border: 1px solid #9ec9ff; }
    .footer { position: fixed; bottom: 6px; right: 12px; font-size: 10px; color: #666; }
    .legend { position: absolute; top: 8px; right: 12px; font-size: 12px; color: #333; }
  </style>
</head>
<body>
${legend}
${pages.join("\n")}
<script>
  (function(){
    const pages = document.querySelectorAll('.page');
    pages.forEach((p, i) => {
      const f = document.createElement('div');
      f.className = 'footer';
      f.textContent = 'Page ' + (i+1) + ' • Generated ' + new Date().toLocaleString();
      p.appendChild(f);
    });
  })();
</script>
</body>
</html>`;
}

function renderDaySection(day: DaySnapshot, tz: string, vendor: string | null): string {
  const title = new Date(day.dateYmd + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  const rows = day.rows.length ? day.rows.map(r => renderRow(r)).join("\n") : `<tr><td colspan="9" class="center" style="font-weight:700">No scheduled work</td></tr>`;
  return `<div class="page">
    <h1>${escapeHtml(title)}${vendor ? ' — ' + escapeHtml(vendor) : ''}</h1>
    <table>
      <thead>
        <tr>
          <th class="status">Status</th>
          <th class="project">Project / Company</th>
          <th class="invoice">Invoice</th>
          <th class="crew">Crew Members</th>
          <th class="work">Work</th>
          <th class="payroll">Payroll</th>
          <th class="payment">Payment</th>
          <th class="vendor">Vendor</th>
          <th class="time">Time</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>`;
}

function renderRow(r: ReportRow): string {
  const status = (r.work === 'SHOP' || r.work === 'NO WORK') ? r.work : 'WORK';
  const crew = r.crew.map(escapeHtml).join(', ');
  const payroll = r.payroll.map(p => `<span class="pill">${escapeHtml(p)}</span>`).join(' ');
  return `<tr>
    <td class="center">${escapeHtml(status)}</td>
    <td>${escapeHtml(r.project)}${r.notes ? '<div style="margin-top:4px;color:#555">'+escapeHtml(r.notes)+'</div>' : ''}</td>
    <td>${escapeHtml(r.invoice)}</td>
    <td>${crew}</td>
    <td>${escapeHtml(r.work)}</td>
    <td>${payroll}</td>
    <td>${escapeHtml(r.payment)}</td>
    <td>${escapeHtml(r.vendor || '')}</td>
    <td>${escapeHtml(r.timeUnit)}</td>
  </tr>`;
}

function escapeHtml(s: string): string { return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c] as string)); }

