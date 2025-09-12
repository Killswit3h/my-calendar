// src/lib/excel.ts
import ExcelJS from 'exceljs'

export async function writeWorkbook(options: {
  filePath: string
  sheetName?: string
  rows: Record<string, any>[]
}) {
  const { filePath, sheetName = 'Sheet1', rows } = options
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(sheetName)

  if (rows.length > 0) {
    const columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k }))
    // @ts-expect-error ExcelJS types allow header/key pairs
    ws.columns = columns
    rows.forEach((r) => ws.addRow(r))
    ws.columns?.forEach((c: any) => {
      const w = Math.min(40, Math.max(10, String(c.header ?? '').length + 2))
      c.width = w
    })
  }

  await wb.xlsx.writeFile(filePath)
}

export async function readFirstSheet(input: string | ArrayBuffer | Uint8Array) {
  const wb = new ExcelJS.Workbook()
  if (typeof input === 'string') {
    await wb.xlsx.readFile(input)
  } else {
    const data = input instanceof ArrayBuffer ? new Uint8Array(input) : input
    await wb.xlsx.load(data)
  }
  const ws = wb.worksheets[0]
  if (!ws) return []

  const headers: string[] = []
  ws.getRow(1).eachCell((cell, col) => {
    headers[col - 1] = String(cell.value ?? '')
  })

  const out: Record<string, any>[] = []
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const obj: Record<string, any> = {}
    row.eachCell((cell, col) => {
      obj[headers[col - 1] ?? `col${col}`] = (cell.value as any) ?? null
    })
    out.push(obj)
  })
  return out
}
