import React from 'react'
import { Document, Page, Text, View, StyleSheet, type DocumentProps } from '@react-pdf/renderer'

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

type CompanyBlock = {
  name: string
  address: string
  phones: string[]
  emails: string[]
  footerNotes: string[]
  badges?: string[]
}

export type EstimatePdfData = {
  number: string
  date: string | Date
  companyName: string
  attention?: string | null
  project?: string | null
  shortDesc?: string | null
  terms?: string | null
  notes?: string | null
  subtotalCents: number
  discountCents: number
  taxCents: number
  totalCents: number
  lineItems: Line[]
  companyBlock: CompanyBlock
}

const styles = StyleSheet.create({
  page: { fontSize: 10, color: colors.ink, padding: spacing.xxxl },
  row: { flexDirection: 'row' },
  h1: { fontSize: 16, fontWeight: 700, marginBottom: spacing.md },
  label: { color: colors.muted, width: 110 },
  value: { flex: 1 },
  box: { border: 1, borderColor: colors.border, padding: spacing.lg, borderRadius: 4 },
  mb: { marginBottom: spacing.lg },
  mt: { marginTop: spacing.lg },
  tableHeader: { borderTop: 1, borderBottom: 1, borderColor: colors.border, paddingVertical: spacing.sm },
  th: { fontWeight: 700 },
  cell: { paddingVertical: 6, borderBottom: 1, borderColor: colors.border },
  right: { textAlign: 'right' },
  small: { fontSize: 9, color: colors.muted },
  footer: { marginTop: spacing.xxxl, borderTop: 1, borderColor: colors.border, paddingTop: spacing.lg },
})

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <View style={[styles.row, { marginBottom: 4 }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
)

const Col = ({ w, children, align }: { w: number; children: React.ReactNode; align?: 'right' }) => (
  <View style={{ width: w, paddingRight: 6 }}>
    <Text style={align === 'right' ? styles.right : undefined}>{children as any}</Text>
  </View>
)

export function EstimatePDF({ data }: { data: EstimatePdfData }): React.ReactElement<DocumentProps> {
  const d = data
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h1}>Estimate</Text>

        <View style={[styles.box, styles.mb]}>
          <MetaRow label="Date" value={fmtDate(d.date)} />
          <MetaRow label="Estimate #" value={d.number} />
          <MetaRow label="Company" value={safe(d.companyName)} />
          <MetaRow label="Attention" value={safe(d.attention)} />
          <MetaRow label="Project" value={safe(d.project)} />
          <MetaRow label="Description" value={safe(d.shortDesc)} />
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

        <View style={[styles.row, { marginTop: spacing.lg, justifyContent: 'flex-end' }] }>
          <View style={[styles.box, { width: table.colRate + table.colTotal + 60 }]}>
            <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 4 }]}>
              <Text>Subtotal</Text>
              <Text>{fmtUSD(d.subtotalCents)}</Text>
            </View>
            <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 4 }]}>
              <Text>Discount</Text>
              <Text>{fmtUSD(d.discountCents)}</Text>
            </View>
            <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 4 }]}>
              <Text>Tax</Text>
              <Text>{fmtUSD(d.taxCents)}</Text>
            </View>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={{ fontWeight: 700 }}>Total</Text>
              <Text style={{ fontWeight: 700 }}>{fmtUSD(d.totalCents)}</Text>
            </View>
          </View>
        </View>

        {(d.terms || d.notes) && (
          <View style={[styles.box, styles.mt]}>
            {d.terms ? <Text style={{ marginBottom: spacing.sm }}>{d.terms}</Text> : null}
            {d.notes ? <Text>{d.notes}</Text> : null}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={{ fontWeight: 700, marginBottom: spacing.sm }}>Acceptance Signature</Text>
          <Text style={styles.small}>By signing, you agree to pricing and terms.</Text>

          <View style={[styles.row, styles.mt]}>
            <View style={{ flex: 1, marginRight: spacing.xl }}>
              <Text style={styles.small}>{d.companyBlock.name}</Text>
              <Text style={styles.small}>{d.companyBlock.address}</Text>
              {d.companyBlock.phones.map((phone, index) => (
                <Text key={index} style={styles.small}>{phone}</Text>
              ))}
              {d.companyBlock.emails.map((email, index) => (
                <Text key={index} style={styles.small}>{email}</Text>
              ))}
              {d.companyBlock.badges?.map((badge, index) => (
                <Text key={index} style={{ fontSize: 9 }}>{badge}</Text>
              ))}
            </View>
            <View style={{ flex: 2 }}>
              {d.companyBlock.footerNotes.map((note, index) => (
                <Text key={index} style={styles.small}>* {note}</Text>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
