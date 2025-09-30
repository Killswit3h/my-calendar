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

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000',
  },
  headerWrap: {
    position: 'fixed',
    top: 24, // inside page padding area
    left: 24,
    right: 24,
  },
  title: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 700,
  },
  rule: {
    height: 1,
    backgroundColor: '#000',
    marginTop: 6,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    borderTopWidth: 0.8,
    borderLeftWidth: 0.8,
    borderColor: '#000',
  },
  headerCell: {
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: '#000',
    backgroundColor: '#e9e9e9',
    padding: 6,
  },
  headerText: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: 700,
    textAlign: 'center',
  },
  body: {
    marginTop: 80, // leave room for title + rule + header row
  },
  row: {
    flexDirection: 'row',
  },
  rowAlt: {
    backgroundColor: '#f7f7f7',
  },
  cell: {
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: '#000',
    padding: 6,
    justifyContent: 'center', // vertical middle
  },
  // Column widths via fixed flexBasis percentages
  colProject: { flexGrow: 0, flexShrink: 0, flexBasis: '34%' },
  colInvoice: { flexGrow: 0, flexShrink: 0, flexBasis: '10%' },
  colCrew: { flexGrow: 0, flexShrink: 0, flexBasis: '24%' },
  colWork: { flexGrow: 0, flexShrink: 0, flexBasis: '6%' },
  colPayroll: { flexGrow: 0, flexShrink: 0, flexBasis: '6%' },
  colPayment: { flexGrow: 0, flexShrink: 0, flexBasis: '10%' },
  colVendor: { flexGrow: 0, flexShrink: 0, flexBasis: '5%' },
  colTime: { flexGrow: 0, flexShrink: 0, flexBasis: '5%' },
  center: { textAlign: 'center' },
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

function Header({ date }: { date: string }) {
  return (
    <View style={styles.headerWrap} fixed>
      <Text style={styles.title}>{formatTitle(date)}</Text>
      <View style={styles.rule} />
      <View style={styles.headerRow}>
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
  return (
    <View style={[styles.row, index % 2 === 1 ? styles.rowAlt : null]} wrap={false}>
      <View style={[styles.cell, styles.colProject]}><Text>{r.projectCompany || '—'}</Text></View>
      <View style={[styles.cell, styles.colInvoice, styles.center]}><Text>{r.invoice || '—'}</Text></View>
      <View style={[styles.cell, styles.colCrew]}><Text>{(r.crewMembers && r.crewMembers.length) ? r.crewMembers.join('\n') : '—'}</Text></View>
      <View style={[styles.cell, styles.colWork, styles.center]}><Text>{r.work || '—'}</Text></View>
      <View style={[styles.cell, styles.colPayroll, styles.center]}><Text>{r.payroll ? 'Yes' : 'No'}</Text></View>
      <View style={[styles.cell, styles.colPayment, styles.center]}><Text>{r.payment || '—'}</Text></View>
      <View style={[styles.cell, styles.colVendor, styles.center, bg ? { backgroundColor: bg } : null]}><Text style={bg ? { color: '#fff' } : undefined}>{r.vendor || '—'}</Text></View>
      <View style={[styles.cell, styles.colTime, styles.center]}><Text>{r.time || '—'}</Text></View>
    </View>
  )
}

export function DailyTablePDF({ data }: { data: DailyReport }): React.ReactElement {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
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
