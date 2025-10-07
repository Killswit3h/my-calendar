export function normalizeCustomerName(raw: string): { compare: string; display: string } {
  const collapsed = (raw || "").replace(/\s+/g, " ").trim();
  return { compare: collapsed.toLowerCase(), display: collapsed };
}

export function parseCsv(text: string): Array<Record<string, string>> {
  // Edge-safe CSV parser with quoted field support (",", \"\" escapes)
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { pushField(); }
      else if (ch === '\n') { pushField(); pushRow(); }
      else if (ch === '\r') {
        const next = text[i + 1];
        if (next === '\n') { i++; }
        pushField(); pushRow();
      } else { field += ch; }
    }
  }
  // last field/row
  pushField(); if (row.length) pushRow();

  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  const out: Array<Record<string, string>> = [];
  for (let r = 1; r < rows.length; r++) {
    const obj: Record<string, string> = {};
    const cells = rows[r];
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c] || `col_${c}`;
      obj[key] = (cells[c] ?? "").trim();
    }
    out.push(obj);
  }
  return out;
}

