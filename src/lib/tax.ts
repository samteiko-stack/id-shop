/** Standard Swedish VAT (moms) rate for B2B medical/dental supplies */
export const DEFAULT_VAT_RATE = 25

export function parseDefaultTaxRate(value: unknown): number {
  const parsed = parseFloat(String(value ?? '').replace(/"/g, ''))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_VAT_RATE
}
