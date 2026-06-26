import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { Invoice } from '@/types'
import { getCustomerFacingLineItems } from '@/lib/discounts'
import type { InvoiceSettlement } from '@/lib/invoice-settlement'
import {
  formatLineDescription,
  invoicePdfStatusLabel,
  SUPPLIER_LOGO,
  type InvoiceCompanySettings,
} from '@/lib/pdf/invoice-pdf-context'
import { attachLotNumbersFromOrder } from '@/lib/trace/lot-display'

const C = {
  brand: '#0092b2',
  dark: '#0f1923',
  mid: '#4a5568',
  light: '#718096',
  faint: '#e8edf2',
  white: '#ffffff',
  muted: '#f7f9fb',
  red: '#c0392b',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 72,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.dark,
    backgroundColor: C.white,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  logo: { width: 150, height: 42, objectFit: 'contain' as const },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 20, flex: 1 },
  supplierLogo: { width: 88, height: 88, objectFit: 'contain' as const },
  headerRight: { alignItems: 'flex-end' },
  headerMeta: { fontSize: 9, color: C.mid, marginTop: 2 },

  partiesRow: { flexDirection: 'row', gap: 20, marginBottom: 18 },
  partyBlock: { flex: 1 },
  partyLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    marginBottom: 4,
  },
  partyName: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  partyLine: { fontSize: 8.5, color: C.mid, lineHeight: 1.55 },

  metaSide: { width: 170, marginBottom: 18 },
  metaSideRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  metaSideLabel: { fontSize: 8.5, color: C.mid },
  metaSideValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.dark },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.muted,
    borderTop: `1px solid ${C.faint}`,
    borderBottom: `1px solid ${C.faint}`,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  tableHeaderText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 7,
    borderBottom: `1px solid ${C.faint}`,
  },
  tableRowAlt: { backgroundColor: C.muted },
  tableCell: { fontSize: 8.5, color: C.dark },

  colNr: { width: 18 },
  colDesc: { flex: 3.2 },
  colLot: { width: 58 },
  colQty: { width: 42, textAlign: 'right' },
  colUnit: { width: 58, textAlign: 'right' },
  colTotal: { width: 62, textAlign: 'right' },

  totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  totalsBox: { width: 230 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3.5,
    paddingHorizontal: 4,
  },
  totalsLabel: { fontSize: 8.5, color: C.mid },
  totalsValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderTop: `1px solid ${C.faint}`,
    marginTop: 2,
  },
  grandTotalLabel: { fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  grandTotalValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold' },

  momsTable: { marginTop: 12, marginBottom: 10 },
  momsTableHeader: {
    flexDirection: 'row',
    borderBottom: `1px solid ${C.faint}`,
    paddingBottom: 4,
  },
  momsTableRow: { flexDirection: 'row', paddingVertical: 3 },
  momsTableLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.light,
    textTransform: 'uppercase',
  },
  momsTableValue: { fontSize: 8.5 },
  mColSats: { width: 50 },
  mColUnder: { width: 80, textAlign: 'right' },
  mColMoms: { width: 70, textAlign: 'right' },
  mColTotal: { width: 80, textAlign: 'right' },

  paymentSection: {
    borderTop: `1px solid ${C.faint}`,
    paddingTop: 10,
    marginTop: 8,
  },
  paymentTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    marginBottom: 6,
  },
  paymentRow: { flexDirection: 'row', gap: 16 },
  paymentBlock: { flex: 1 },
  paymentLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.light,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  paymentValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.dark },

  notes: {
    marginTop: 12,
    padding: 8,
    backgroundColor: C.muted,
    borderRadius: 2,
  },
  notesLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    marginBottom: 3,
  },
  notesText: { fontSize: 8.5, color: C.mid, lineHeight: 1.5 },

  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.brand,
    paddingVertical: 10,
    paddingHorizontal: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerCol: { flex: 1 },
  footerText: { fontSize: 7.5, color: C.white, lineHeight: 1.45 },
})

function formatSEK(amount: number): string {
  return (
    new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      amount,
    ) + ' kr'
  )
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('sv-SE')
}

function formatDateTime(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatOCR(invoiceNumber: string): string {
  return invoiceNumber.replace(/\D/g, '').slice(-10).padStart(10, '0')
}

export interface SwedishCompany extends InvoiceCompanySettings {}

interface GenerateInvoicePDFOptions {
  invoice: Invoice & { items: any[]; customer: any; order?: any }
  company: InvoiceCompanySettings
  settlement?: InvoiceSettlement
}

function FakturaDocument({ invoice, company, settlement }: GenerateInvoicePDFOptions) {
  const currency = invoice.currency ?? 'SEK'
  const paymentDays = company.payment_terms_days ?? 30
  const ocr = formatOCR(invoice.invoice_number)
  const discountRate = Number((invoice as any).discount_rate ?? 0)
  const extraDiscountRate = Number((invoice as any).extra_discount_rate ?? 0)
  const extraDiscountAmount = Number((invoice as any).extra_discount_amount ?? 0)

  const itemsWithLots = attachLotNumbersFromOrder(
    invoice.items ?? [],
    invoice.order?.items ?? [],
  )
  const facingItems = getCustomerFacingLineItems(itemsWithLots, discountRate)
  const netSubtotal = facingItems.reduce((sum, item) => sum + item.net_line_total, 0)
  const taxableSubtotal = Math.max(0, netSubtotal - extraDiscountAmount)

  const paid = settlement?.paid ?? 0
  const balance = settlement?.balanceDue ?? Number(invoice.total)
  const isCancelled = invoice.status === 'cancelled'
  const paymentStatus = invoicePdfStatusLabel(invoice.status, settlement?.status)

  const customerOrg =
    invoice.customer?.org_number?.trim() ||
    invoice.customer?.tax_id?.trim() ||
    null

  const noteText =
    invoice.notes?.trim() ||
    customerOrg ||
    null

  const buyer = [
    invoice.customer?.address,
    customerOrg ? `Org.nr: ${customerOrg}` : null,
    invoice.customer?.phone ? `Tel: ${invoice.customer.phone}` : null,
    invoice.customer?.email ? `E-post: ${invoice.customer.email}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const issueDateTime = invoice.issue_date
    ? `${formatDate(invoice.issue_date)} 12:00`
    : formatDateTime(invoice.created_at)

  return (
    <Document title={`Faktura ${invoice.invoice_number}`} author={company.name}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            {company.logo_src ? (
              <Image src={company.logo_src} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.brand }}>
                {company.name}
              </Text>
            )}
            <Image src={SUPPLIER_LOGO} style={styles.supplierLogo} />
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 9, color: C.mid }}>Fakturanummer:</Text>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold' }}>{invoice.invoice_number}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1 }}>
            <View style={styles.partiesRow}>
              <View style={styles.partyBlock}>
                <Text style={styles.partyLabel}>Till:</Text>
                <Text style={styles.partyName}>{invoice.customer?.name ?? '—'}</Text>
                <Text style={styles.partyLine}>{buyer || '—'}</Text>
              </View>
              <View style={styles.partyBlock}>
                <Text style={styles.partyLabel}>Från:</Text>
                <Text style={styles.partyName}>{company.name}</Text>
                <Text style={styles.partyLine}>{company.address || '—'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.metaSide}>
            <View style={styles.metaSideRow}>
              <Text style={styles.metaSideLabel}>Datum:</Text>
              <Text style={styles.metaSideValue}>{issueDateTime}</Text>
            </View>
            <View style={styles.metaSideRow}>
              <Text style={styles.metaSideLabel}>Fakturanummer:</Text>
              <Text style={styles.metaSideValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.metaSideRow}>
              <Text style={styles.metaSideLabel}>{isCancelled ? 'Status:' : 'Betalningsstatus:'}</Text>
              <Text style={[styles.metaSideValue, isCancelled ? { color: C.red } : {}]}>{paymentStatus}</Text>
            </View>
            <View style={styles.metaSideRow}>
              <Text style={styles.metaSideLabel}>Förfallodatum:</Text>
              <Text style={styles.metaSideValue}>{formatDate(invoice.due_date)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={{ ...styles.tableHeaderText, ...styles.colNr }}>Nr</Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colDesc }}>Beskrivning</Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colLot }}>Lot.nr</Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colQty }}>Antal</Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colUnit }}>À-pris</Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colTotal }}>Belopp</Text>
        </View>

        {facingItems.map((item: any, i: number) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={{ ...styles.tableCell, ...styles.colNr }}>{i + 1}</Text>
            <Text style={{ ...styles.tableCell, ...styles.colDesc }}>
              {formatLineDescription(item)}
            </Text>
            <Text style={{ ...styles.tableCell, ...styles.colLot }}>{item.lot_numbers || '—'}</Text>
            <Text style={{ ...styles.tableCell, ...styles.colQty }}>
              {Number(item.quantity).toFixed(2)} st
            </Text>
            <Text style={{ ...styles.tableCell, ...styles.colUnit }}>
              {formatSEK(item.net_unit_price)}
            </Text>
            <Text style={{ ...styles.tableCell, ...styles.colTotal }}>
              {formatSEK(item.net_line_total)}
            </Text>
          </View>
        ))}

        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Summa ({currency})</Text>
              <Text style={styles.totalsValue}>{formatSEK(netSubtotal)}</Text>
            </View>
            {extraDiscountRate > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Extrarabatt ({extraDiscountRate}%)</Text>
                <Text style={[styles.totalsValue, { color: C.red }]}>
                  −{formatSEK(extraDiscountAmount)}
                </Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Moms ({currency})</Text>
              <Text style={styles.totalsValue}>{formatSEK(invoice.tax_amount)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Totalt belopp ({currency})</Text>
              <Text style={styles.grandTotalValue}>{formatSEK(invoice.total)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Betalt ({currency})</Text>
              <Text style={styles.totalsValue}>{formatSEK(paid)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Saldo ({currency})</Text>
              <Text style={styles.grandTotalValue}>{formatSEK(balance)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.momsTable}>
          <View style={styles.momsTableHeader}>
            <Text style={{ ...styles.momsTableLabel, ...styles.mColSats }}>Momssats</Text>
            <Text style={{ ...styles.momsTableLabel, ...styles.mColUnder }}>Underlag</Text>
            <Text style={{ ...styles.momsTableLabel, ...styles.mColMoms }}>Moms</Text>
            <Text style={{ ...styles.momsTableLabel, ...styles.mColTotal }}>Ink. moms</Text>
          </View>
          <View style={styles.momsTableRow}>
            <Text style={{ ...styles.momsTableValue, ...styles.mColSats }}>
              {invoice.tax_rate ?? 25}%
            </Text>
            <Text style={{ ...styles.momsTableValue, ...styles.mColUnder }}>
              {formatSEK(taxableSubtotal)}
            </Text>
            <Text style={{ ...styles.momsTableValue, ...styles.mColMoms }}>
              {formatSEK(invoice.tax_amount)}
            </Text>
            <Text style={{ ...styles.momsTableValue, ...styles.mColTotal }}>
              {formatSEK(invoice.total)}
            </Text>
          </View>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Betalningsinformation</Text>
          <View style={styles.paymentRow}>
            {company.bankgiro ? (
              <View style={styles.paymentBlock}>
                <Text style={styles.paymentLabel}>Bankgiro</Text>
                <Text style={styles.paymentValue}>{company.bankgiro}</Text>
              </View>
            ) : null}
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>OCR / Referens</Text>
              <Text style={styles.paymentValue}>{ocr}</Text>
            </View>
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>Betalningsvillkor</Text>
              <Text style={styles.paymentValue}>{paymentDays} dagar netto</Text>
            </View>
          </View>
        </View>

        {noteText ? (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Meddelande:</Text>
            <Text style={styles.notesText}>{noteText}</Text>
          </View>
        ) : null}

        <View style={styles.footerBar} fixed>
          <View style={styles.footerCol}>
            <Text style={styles.footerText}>{company.name}</Text>
            {company.org_number ? (
              <Text style={styles.footerText}>{company.org_number}</Text>
            ) : null}
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerText}>{company.address || '—'}</Text>
          </View>
          <View style={styles.footerCol}>
            {company.phone ? <Text style={styles.footerText}>{company.phone}</Text> : null}
            {company.email ? <Text style={styles.footerText}>{company.email}</Text> : null}
          </View>
          <View style={styles.footerCol}>
            {company.bankgiro ? (
              <Text style={styles.footerText}>Bankgiro: {company.bankgiro}</Text>
            ) : null}
            {company.f_skatt !== false ? (
              <Text style={styles.footerText}>Godkänt för F-skatt</Text>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function generateInvoicePDF(options: GenerateInvoicePDFOptions): Promise<Buffer> {
  return await renderToBuffer(<FakturaDocument {...options} />)
}
