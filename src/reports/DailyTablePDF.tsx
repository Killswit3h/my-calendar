import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer'
import fs from 'fs'
import path from 'path'

export type JobRow = {
  projectCompany: string
  invoice: string
  crewMembers: string[]
  work: string
  payroll: boolean
  payment: string
  vendor: string
  time: string
}

export type DailyReport = {
  date: string
  rows: JobRow[]
}

// Fonts: try to load Calibri/Carlito from public/fonts if present; otherwise rely on default fonts
function registerFontIfExists(family: string, file: string, weight: 400 | 700) {
  const p = path.join(process.cwd(), 'public', 'fonts', file)
  if (fs.existsSync(p)) {
    Font.register({ family, src: p, fontStyle: 'normal', fontWeight: weight })
  }
}
registerFontIfExists('Calibri', 'Calibri-Regular.ttf', 400)
registerFontIfExists('Calibri', 'Calibri-Bold.ttf', 700)
registerFontIfExists('Carlito', 'Carlito-Regular.ttf', 400)
registerFontIfExists('Carlito', 'Carlito-Bold.ttf', 700)

const TABLOID_LANDSCAPE = { width: 17 * 72, height: 11 * 72 }

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#000',
  },
  headerWrap: {
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 700,
  },
  topBar: { height: 2, backgroundColor: '#5A6EE1', marginTop: 2, marginBottom: 2 },
  rule: {
    height: 1,
    backgroundColor: '#000',
    marginTop: 6,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderLeftWidth: 0.8,
    borderColor: '#000',
  },
  headerCell: {
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: '#000',
    backgroundColor: '#d9d9d9',
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 6,
  },
  headerText: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: 700,
    textAlign: 'center',
  },
  body: {},
  row: {
    flexDirection: 'row',
  },
  // Keep rows white to match the sample
  rowAlt: {},
  cell: {
    borderRightWidth: 0.8,
    borderBottomWidth: 1.2,
    borderColor: '#000',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 6,
    paddingRight: 6,
    justifyContent: 'center', // vertical middle
  },
  // Column widths via flexGrow ratios (sum = 100)
  colStatus: { flexGrow: 5, flexShrink: 0, flexBasis: 0 },
  colProject: { flexGrow: 34, flexShrink: 0, flexBasis: 0 },
  colInvoice: { flexGrow: 10, flexShrink: 0, flexBasis: 0 },
  colCrew: { flexGrow: 28, flexShrink: 0, flexBasis: 0 },
  colWork: { flexGrow: 5, flexShrink: 0, flexBasis: 0 },
  colPayroll: { flexGrow: 5, flexShrink: 0, flexBasis: 0 },
  colPayment: { flexGrow: 8, flexShrink: 0, flexBasis: 0 },
  colVendor: { flexGrow: 3, flexShrink: 0, flexBasis: 0, minWidth: 40 },
  colTime: { flexGrow: 2, flexShrink: 0, flexBasis: 0 },
  center: { textAlign: 'center' },
  bold: { fontWeight: 700 },
  upper: { textTransform: 'uppercase' as any },
  vendorCell: {
    paddingLeft: 2,
    paddingRight: 2,
  },
  vendorText: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: 'uppercase' as any,
    textAlign: 'center',
    lineHeight: 1,
  },
})

function formatTitle(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function vendorColor(vendor: string): string | undefined {
  const v = (vendor || '').trim().toLowerCase()
  if (v === 'jorge') return '#4CAF50'
  if (v === 'tony') return '#3B82F6'
  if (v === 'chris') return '#6B7280'
  return undefined
}

function isReactElement(x: any): boolean {
  return !!(x && typeof x === 'object' && '$$typeof' in x && 'type' in x && 'props' in x)
}

function toText(x: any): string {
  if (x == null) return '-'
  if (typeof x === 'string') return x
  if (typeof x === 'number' || typeof x === 'boolean') return String(x)
  if (Array.isArray(x)) return x.map((v) => toText(v)).join('\n')
  if (isReactElement(x)) return '-'
  try { return String(x) } catch { return '-' }
}

function Header({ date }: { date: string }) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.topBar} />
      <Text style={styles.title}>{formatTitle(date)}</Text>
      <View style={styles.rule} />
      <View style={styles.headerRow}>
        <View style={[styles.headerCell, styles.colStatus]}><Text style={styles.headerText}>Status</Text></View>
        <View style={[styles.headerCell, styles.colProject]}><Text style={styles.headerText}>Project/Company</Text></View>
        <View style={[styles.headerCell, styles.colInvoice]}><Text style={styles.headerText}>Invoice</Text></View>
        <View style={[styles.headerCell, styles.colCrew]}><Text style={styles.headerText}>Crew Members</Text></View>
        <View style={[styles.headerCell, styles.colWork]}><Text style={styles.headerText}>Work</Text></View>
        <View style={[styles.headerCell, styles.colPayroll]}><Text style={styles.headerText}>Payroll</Text></View>
        <View style={[styles.headerCell, styles.colPayment]}><Text style={styles.headerText}>Payment</Text></View>
        <View style={[styles.headerCell, styles.colVendor]}><Text style={styles.headerText}>Vendor</Text></View>
        <View style={[styles.headerCell, styles.colTime]}><Text style={styles.headerText}>TIME</Text></View>
      </View>
    </View>
  )
}

function BodyRow({ r, index }: { r: JobRow; index: number }) {
  const bg = vendorColor(r.vendor)
  const rowStyle = index % 2 === 1 ? [styles.row, styles.rowAlt] : [styles.row]
  const vendorCellStyle: any[] = [styles.cell, styles.colVendor, styles.center, styles.vendorCell]
  if (bg) vendorCellStyle.push({ backgroundColor: bg })
  const vendorTextStyle: any[] = [styles.vendorText]
  if (bg) vendorTextStyle.push({ color: '#fff' })
  return (
    <View style={rowStyle}>
      <View style={[styles.cell, styles.colStatus]}><Text>{''}</Text></View>
      <View style={[styles.cell, styles.colProject, styles.center]}><Text style={[styles.bold, styles.upper]}>{toText(r.projectCompany)}</Text></View>
      <View style={[styles.cell, styles.colInvoice, styles.center]}><Text style={styles.bold}>{toText(r.invoice)}</Text></View>
      <View style={[styles.cell, styles.colCrew, styles.center]}><Text>{toText(r.crewMembers)}</Text></View>
      <View style={[styles.cell, styles.colWork, styles.center]}><Text>{toText(r.work)}</Text></View>
      <View style={[styles.cell, styles.colPayroll, styles.center]}><Text>{r.payroll ? 'Yes' : 'No'}</Text></View>
      <View style={[styles.cell, styles.colPayment, styles.center]}><Text style={styles.bold}>{toText(r.payment)}</Text></View>
      <View style={vendorCellStyle}><Text style={vendorTextStyle} wrap={false}>{toText(r.vendor)}</Text></View>
      <View style={[styles.cell, styles.colTime, styles.center]}><Text>{toText(r.time)}</Text></View>
    </View>
  )
}

export function DailyTablePDF({ data }: { data: DailyReport }): React.ReactElement {
  return (
    <Document>
      <Page size={TABLOID_LANDSCAPE} style={styles.page} orientation="landscape">
        <Header date={data.date} />
        <View style={styles.body}>
          {data.rows.map((r, i) => (
            <BodyRow key={i} r={r} index={i} />
          ))}
        </View>
      </Page>
    </Document>
  )
}

export async function renderDailyTablePDF(data: DailyReport): Promise<Buffer> {
  const buffer = await renderToBuffer(<DailyTablePDF data={data} />)
  return buffer
}
