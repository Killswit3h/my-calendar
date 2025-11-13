import React from 'react'
import { Document, Page, StyleSheet, Text, View, type DocumentProps } from '@react-pdf/renderer'

import { colors, spacing, table } from './theme'
import { fmtDate, fmtUSD, safe } from './util'

type Line = {
  description: string
  qty: string
  uom: string
  rateCents: number
  totalCents: number
  note?: string | null
}

export type ChangeOrderPdfData = {
  number: string
  date: string | Date
  project: string
  baseEstimate?: string | null
  reason?: string | null
  terms?: string | null
  notes?: string | null
  subtotalCents: number
  discountCents: number
  taxCents: number
  totalCents: number
  lineItems: Line[]
}

const styles = StyleSheet.create({
  page: { fontSize: 10, color: colors.ink, padding: spacing.xxxl },
  h1: { fontSize: 16, fontWeight: 700, marginBottom: spacing.md },
  box: { border: 1, borderColor: colors.border, padding: spacing.lg, borderRadius: 4, marginBottom: spacing.lg },
  row: { flexDirection: 'row' },
  tableHeader: { borderTop: 1, borderBottom: 1, borderColor: colors.border, paddingVertical: spacing.sm },
  th: { fontWeight: 700 },
  cell: { paddingVertical: 6, borderBottom: 1, borderColor: colors.border },
  right: { textAlign: 'right' },
  small: { fontSize: 9, color: colors.muted },
})

const MetaLine = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null
  return (
    <Text>
      {label}: {value}
    </Text>
  )
}

const Col = ({ w, children, align }: { w: number; children: React.ReactNode; align?: 'right' }) => (
  <View style={{ width: w, paddingRight: 6 }}>
    <Text style={align === 'right' ? styles.right : undefined}>{children as any}</Text>
  </View>
)

export function ChangeOrderPDF({ data }: { data: ChangeOrderPdfData }): React.ReactElement<DocumentProps> {
  const d = data

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h1}>Change Order</Text>

        <View style={styles.box}>
          <MetaLine label="CO Number" value={d.number} />
          <MetaLine label="Date" value={fmtDate(d.date)} />
          <MetaLine label="Project" value={safe(d.project)} />
          <MetaLine label="Base Estimate" value={safe(d.baseEstimate)} />
          <MetaLine label="Reason" value={safe(d.reason)} />
        </View>

        <View style={[styles.row, styles.tableHeader]}>
          <Col w={table.colDesc}>
            <Text style={styles.th}>Item Description</Text>
          </Col>
          <Col w={table.colQty} align="right">
            <Text style={styles.th}>Qty</Text>
          </Col>
          <Col w={table.colUom}>
            <Text style={styles.th}>U/M</Text>
          </Col>
          <Col w={table.colRate} align="right">
            <Text style={styles.th}>Rate</Text>
          </Col>
          <Col w={table.colTotal} align="right">
            <Text style={styles.th}>Total</Text>
          </Col>
        </View>

        {d.lineItems.map((line, index) => (
          <View key={index} style={[styles.row, styles.cell]}>
            <Col w={table.colDesc}>
              <Text>{line.description}</Text>
              {line.note ? <Text style={styles.small}>{line.note}</Text> : null}
            </Col>
            <Col w={table.colQty} align="right">
              <Text>{line.qty}</Text>
            </Col>
            <Col w={table.colUom}>
              <Text>{line.uom}</Text>
            </Col>
            <Col w={table.colRate} align="right">
              <Text>{fmtUSD(line.rateCents)}</Text>
            </Col>
            <Col w={table.colTotal} align="right">
              <Text>{fmtUSD(line.totalCents)}</Text>
            </Col>
          </View>
        ))}

        <View style={{ marginTop: spacing.lg, alignSelf: 'flex-end', width: table.colRate + table.colTotal + 60 }}>
          <Text>Subtotal: {fmtUSD(d.subtotalCents)}</Text>
          <Text>Discount: {fmtUSD(d.discountCents)}</Text>
          <Text>Tax: {fmtUSD(d.taxCents)}</Text>
          <Text style={{ fontWeight: 700 }}>Total: {fmtUSD(d.totalCents)}</Text>
        </View>

        {(d.terms || d.notes) && (
          <View style={styles.box}>
            {d.terms ? <Text style={{ marginBottom: d.notes ? spacing.sm : 0 }}>{d.terms}</Text> : null}
            {d.notes ? <Text>{d.notes}</Text> : null}
          </View>
        )}
      </Page>
    </Document>
  )
}
