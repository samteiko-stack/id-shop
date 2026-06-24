import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Line,
  Svg,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { Invoice } from '@/types'
import { getCustomerFacingLineItems } from '@/lib/discounts'

/* ─────────────────────────────────────────────
   SWEDISH FAKTURA — ID Shop
   Follows Swedish invoicing law (Fakturalagen)
   ───────────────────────────────────────────── */

const C = {
  brand:   '#0092b2',
  dark:    '#0f1923',
  mid:     '#4a5568',
  light:   '#718096',
  faint:   '#e8edf2',
  white:   '#ffffff',
  muted:   '#f7f9fb',
  red:     '#c0392b',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 80,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.dark,
    backgroundColor: C.white,
  },

  /* ── Header ── */
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  logoBlock: { flex: 1 },
  companyName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.brand, marginBottom: 5 },
  companyLine: { fontSize: 8.5, color: C.mid, lineHeight: 1.55 },

  fakturaBlock: { alignItems: 'flex-end' },
  fakturaLabel: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: C.dark, letterSpacing: 1 },
  fakturaNumber: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.brand, marginTop: 2 },

  /* ── Meta row (fakturadatum, förfallodatum, etc.) ── */
  metaRow: {
    flexDirection: 'row',
    backgroundColor: C.muted,
    borderTop: `2px solid ${C.brand}`,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 20,
    gap: 0,
  },
  metaCell: { flex: 1, paddingHorizontal: 6 },
  metaLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.light, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark },

  /* ── Parties row ── */
  partiesRow: { flexDirection: 'row', gap: 16, marginBottom: 22 },
  partyBlock: { flex: 1 },
  partyLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.light, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5, borderBottom: `1px solid ${C.faint}`, paddingBottom: 3 },
  partyName: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  partyLine: { fontSize: 8.5, color: C.mid, lineHeight: 1.55 },

  /* ── Table ── */
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.dark,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 0,
  },
  tableHeaderText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 7, borderBottom: `1px solid ${C.faint}` },
  tableRowAlt: { backgroundColor: C.muted },
  tableCell: { fontSize: 9, color: C.dark },

  colDesc:    { flex: 4 },
  colQty:     { width: 36, textAlign: 'right' },
  colUnit:    { width: 70, textAlign: 'right' },
  colMoms:    { width: 46, textAlign: 'right' },
  colTotal:   { width: 76, textAlign: 'right' },

  /* ── Totals ── */
  totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalsBox: { width: 220 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3.5, paddingHorizontal: 8 },
  totalsLabel: { fontSize: 8.5, color: C.mid },
  totalsValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  momsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 8, backgroundColor: C.muted },
  grandTotalBox: {
    backgroundColor: C.brand,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  grandTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.white },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.white },

  /* ── Moms summary table ── */
  momsTable: { marginTop: 14, marginBottom: 14 },
  momsTableHeader: { flexDirection: 'row', borderBottom: `1px solid ${C.faint}`, paddingBottom: 4, paddingHorizontal: 0 },
  momsTableRow: { flexDirection: 'row', paddingVertical: 3 },
  momsTableLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.light, textTransform: 'uppercase', letterSpacing: 0.4 },
  momsTableValue: { fontSize: 8.5 },
  mColSats: { width: 50 },
  mColUnder: { width: 80, textAlign: 'right' },
  mColMoms: { width: 70, textAlign: 'right' },
  mColTotal: { width: 80, textAlign: 'right' },

  /* ── Payment section ── */
  paymentSection: {
    borderTop: `2px solid ${C.brand}`,
    paddingTop: 12,
    marginTop: 10,
  },
  paymentTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.brand, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  paymentRow: { flexDirection: 'row', gap: 24 },
  paymentBlock: { flex: 1 },
  paymentLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.light, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  paymentValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.dark },
  paymentSub: { fontSize: 8, color: C.mid, marginTop: 2 },

  /* ── Notes ── */
  notes: { marginTop: 16, paddingTop: 10, borderTop: `1px solid ${C.faint}` },
  notesLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.light, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  notesText: { fontSize: 8.5, color: C.mid, lineHeight: 1.55 },

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    borderTop: `1px solid ${C.faint}`,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7.5, color: C.light },
})

/* ── Helpers ── */
function formatSEK(amount: number): string {
  return new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' kr'
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('sv-SE')
}

/** Swedish OCR: invoice number digits only, right-padded to 16, with Luhn check digit */
function formatOCR(invoiceNumber: string): string {
  const digits = invoiceNumber.replace(/\D/g, '').slice(-10).padStart(10, '0')
  return digits
}

/* ── Types ── */
export interface SwedishCompany {
  name:         string
  address:      string
  org_number:   string   // Organisationsnummer: 556xxx-xxxx
  vat_number:   string   // Momsreg.nr: SE556xxxxxxxx01
  phone:        string
  email:        string
  bankgiro:     string   // e.g. 1234-5678
  payment_terms_days?: number
}

interface GenerateInvoicePDFOptions {
  invoice: Invoice & { items: any[]; customer: any }
  company: SwedishCompany
}

/* ── Document ── */
function FakturaDocument({ invoice, company }: GenerateInvoicePDFOptions) {
  const currency = invoice.currency ?? 'SEK'
  const paymentDays = company.payment_terms_days ?? 30
  const ocr = formatOCR(invoice.invoice_number)
  const discountRate = Number((invoice as any).discount_rate ?? 0)
  const extraDiscountRate = Number((invoice as any).extra_discount_rate ?? 0)
  const extraDiscountAmount = Number((invoice as any).extra_discount_amount ?? 0)
  const facingItems = getCustomerFacingLineItems(invoice.items ?? [], discountRate)
  const netSubtotal = facingItems.reduce((sum, item) => sum + item.net_line_total, 0)
  const taxableSubtotal = Math.max(0, netSubtotal - extraDiscountAmount)

  const seller = [
    company.address,
    company.org_number ? `Org.nr: ${company.org_number}` : null,
    company.vat_number ? `Momsreg.nr: ${company.vat_number}` : null,
    company.phone,
    company.email,
  ].filter(Boolean).join('\n')

  const buyer = [
    invoice.customer?.address,
    invoice.customer?.tax_id ? `Org.nr: ${invoice.customer.tax_id}` : null,
    invoice.customer?.email,
    invoice.customer?.phone,
  ].filter(Boolean).join('\n')

  return (
    <Document title={`Faktura ${invoice.invoice_number}`} author={company.name}>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoBlock}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyLine}>{seller}</Text>
          </View>
          <View style={styles.fakturaBlock}>
            <Text style={styles.fakturaLabel}>FAKTURA</Text>
            <Text style={styles.fakturaNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* ── Meta row ── */}
        <View style={styles.metaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Fakturanummer</Text>
            <Text style={styles.metaValue}>{invoice.invoice_number}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Fakturadatum</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.issue_date)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Förfallodatum</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.due_date)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Betalningsvillkor</Text>
            <Text style={styles.metaValue}>{paymentDays} dagar netto</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Valuta</Text>
            <Text style={styles.metaValue}>{currency}</Text>
          </View>
        </View>

        {/* ── Parties ── */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Säljare</Text>
            <Text style={styles.partyName}>{company.name}</Text>
            <Text style={styles.partyLine}>{seller}</Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Köpare / Faktureras till</Text>
            <Text style={styles.partyName}>{invoice.customer?.name ?? '—'}</Text>
            <Text style={styles.partyLine}>{buyer || '—'}</Text>
          </View>
        </View>

        {/* ── Line items ── */}
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.tableHeaderText, ...styles.colDesc }}>Beskrivning</Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colQty }}>Ant.</Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colUnit }}>À-pris</Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colMoms }}>Moms%</Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colTotal }}>Belopp</Text>
        </View>

        {facingItems.map((item: any, i: number) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={{ ...styles.tableCell, ...styles.colDesc }}>{item.description}</Text>
            <Text style={{ ...styles.tableCell, ...styles.colQty }}>{String(item.quantity)}</Text>
            <Text style={{ ...styles.tableCell, ...styles.colUnit }}>{formatSEK(item.net_unit_price)}</Text>
            <Text style={{ ...styles.tableCell, ...styles.colMoms }}>{invoice.tax_rate ?? 25}%</Text>
            <Text style={{ ...styles.tableCell, ...styles.colTotal }}>{formatSEK(item.net_line_total)}</Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Netto (exkl. moms)</Text>
              <Text style={styles.totalsValue}>{formatSEK(netSubtotal)}</Text>
            </View>
            {extraDiscountRate > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Extrarabatt ({extraDiscountRate}%)</Text>
                <Text style={[styles.totalsValue, { color: C.red }]}>−{formatSEK(extraDiscountAmount)}</Text>
              </View>
            )}
            <View style={styles.momsRow}>
              <Text style={styles.totalsLabel}>Moms {invoice.tax_rate ?? 25}%</Text>
              <Text style={styles.totalsValue}>{formatSEK(invoice.tax_amount)}</Text>
            </View>
            <View style={styles.grandTotalBox}>
              <Text style={styles.grandTotalLabel}>Att betala</Text>
              <Text style={styles.grandTotalValue}>{formatSEK(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Moms specification ── */}
        <View style={styles.momsTable}>
          <View style={styles.momsTableHeader}>
            <Text style={{ ...styles.momsTableLabel, ...styles.mColSats }}>Momssats</Text>
            <Text style={{ ...styles.momsTableLabel, ...styles.mColUnder }}>Underlag</Text>
            <Text style={{ ...styles.momsTableLabel, ...styles.mColMoms }}>Moms</Text>
            <Text style={{ ...styles.momsTableLabel, ...styles.mColTotal }}>Ink. moms</Text>
          </View>
          <View style={styles.momsTableRow}>
            <Text style={{ ...styles.momsTableValue, ...styles.mColSats }}>{invoice.tax_rate ?? 25}%</Text>
            <Text style={{ ...styles.momsTableValue, ...styles.mColUnder }}>{formatSEK(taxableSubtotal)}</Text>
            <Text style={{ ...styles.momsTableValue, ...styles.mColMoms }}>{formatSEK(invoice.tax_amount)}</Text>
            <Text style={{ ...styles.momsTableValue, ...styles.mColTotal }}>{formatSEK(invoice.total)}</Text>
          </View>
        </View>

        {/* ── Payment info ── */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Betalningsinformation</Text>
          <View style={styles.paymentRow}>
            {company.bankgiro ? (
              <View style={styles.paymentBlock}>
                <Text style={styles.paymentLabel}>Bankgiro</Text>
                <Text style={styles.paymentValue}>{company.bankgiro}</Text>
                <Text style={styles.paymentSub}>Bankgirocentralen BGC AB</Text>
              </View>
            ) : null}
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>OCR-nummer / Referens</Text>
              <Text style={styles.paymentValue}>{ocr}</Text>
              <Text style={styles.paymentSub}>Ange vid betalning</Text>
            </View>
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>Förfallodatum</Text>
              <Text style={styles.paymentValue}>{formatDate(invoice.due_date)}</Text>
              <Text style={styles.paymentSub}>Belopp att betala</Text>
            </View>
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>Att betala</Text>
              <Text style={[styles.paymentValue, { color: C.brand }]}>{formatSEK(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ── */}
        {invoice.notes ? (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Meddelande</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{company.name} · Org.nr {company.org_number} · Momsreg.nr {company.vat_number}</Text>
          <Text style={styles.footerText}>{company.email} · {company.phone}</Text>
          <Text style={styles.footerText}>Sida 1</Text>
        </View>

      </Page>
    </Document>
  )
}

export async function generateInvoicePDF(options: GenerateInvoicePDFOptions): Promise<Buffer> {
  return await renderToBuffer(<FakturaDocument {...options} />)
}
