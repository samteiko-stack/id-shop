'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { QrCode, CheckCircle2, AlertCircle, X } from '@/components/icons'

/* ─────────────────────────────────────────
   QR PAYLOAD PARSER
   Supports multiple formats:
   1. GS1 DataMatrix / GS1-128 (Application Identifiers)
   2. Key:value|delimited text
   3. Plain JSON
   4. Plain text with spaces / semicolons
   ───────────────────────────────────────── */

export interface ParsedQRPayload {
  ref?: string
  lot_number?: string
  expiry_date?: string // ISO date YYYY-MM-DD
  raw: string
  parseFormat: 'gs1' | 'delimited' | 'json' | 'plain_ref' | 'unknown'
}

const GS1_AI_MAP: Record<string, keyof ParsedQRPayload> = {
  '01': 'ref',       // GTIN (used as REF here)
  '240': 'ref',      // Additional product identification
  '10': 'lot_number',
  '17': 'expiry_date',
  '21': 'lot_number', // Serial number (fallback)
}

/** GS1 YYMMDD → ISO date (00–49 → 2000–2049, 50–99 → 1950–1999). */
function parseGs1Date(value: string): string | null {
  if (!/^\d{6}$/.test(value)) return null
  const yy = parseInt(value.slice(0, 2), 10)
  const mm = value.slice(2, 4)
  const dd = value.slice(4, 6)
  const year = yy <= 49 ? 2000 + yy : 1900 + yy
  return `${year}-${mm}-${dd}`
}

function applyGs1Field(result: ParsedQRPayload, ai: string, value: string): boolean {
  const field = GS1_AI_MAP[ai]
  if (!field) return false

  let normalized = value.trim()
  if (ai === '17') {
    normalized = parseGs1Date(normalized) ?? normalized
  }

  ;(result as Record<string, string>)[field] = normalized
  return true
}

function parseGS1(raw: string): ParsedQRPayload | null {
  const result: ParsedQRPayload = { raw, parseFormat: 'gs1' }
  let matched = false

  const bracketRegex = /\((\d{2,4})\)([^()]*)/g
  let match
  while ((match = bracketRegex.exec(raw)) !== null) {
    if (applyGs1Field(result, match[1], match[2])) matched = true
  }

  return matched ? result : null
}

/** UDI DataMatrix output without brackets, e.g. 01{GTIN}10{LOT}11{YYMMDD}17{YYMMDD} */
function parseGS1ElementString(raw: string): ParsedQRPayload | null {
  const compact = raw.replace(/\x1d/g, '').trim()
  if (!/^01\d{14}/.test(compact)) return null

  const patterns = [
    /^01(\d{14})10(.+?)11(\d{6})17(\d{6})$/,
    /^01(\d{14})17(\d{6})10(.+?)11(\d{6})$/,
    /^01(\d{14})10(.+?)17(\d{6})$/,
    /^01(\d{14})17(\d{6})10(.+?)$/,
  ]

  for (const pattern of patterns) {
    const m = compact.match(pattern)
    if (!m) continue

    const result: ParsedQRPayload = { raw, parseFormat: 'gs1' }
    if (pattern.source.includes('10(.+?)11')) {
      applyGs1Field(result, '01', m[1])
      applyGs1Field(result, '10', m[2])
      if (m[3]?.length === 6 && m[4]?.length === 6) {
        applyGs1Field(result, '11', m[3])
        applyGs1Field(result, '17', m[4])
      } else if (m[3]?.length === 6) {
        applyGs1Field(result, '17', m[3])
      }
    } else if (pattern.source.startsWith('^01(\\d{14})17')) {
      applyGs1Field(result, '01', m[1])
      applyGs1Field(result, '17', m[2])
      applyGs1Field(result, '10', m[3])
    }

    if (result.ref || result.lot_number) return result
  }

  return null
}

function parseDelimited(raw: string): ParsedQRPayload | null {
  // Common formats:
  // REF:123|LOT:ABC|EXP:2027-06-01
  // ref=123;lot=ABC;exp=2027-06
  // REF=123,LOT=ABC,EXP=2027-06
  const result: ParsedQRPayload = { raw, parseFormat: 'delimited' }
  let matched = false

  const pairs = raw.split(/[|;,\n]/)
  for (const pair of pairs) {
    const kv = pair.split(/[:=]/, 2)
    if (kv.length !== 2) continue
    const key = kv[0].trim().toLowerCase()
    const value = kv[1].trim()

    if (['ref', 'reference', 'item', 'gtin'].includes(key)) {
      result.ref = value; matched = true
    } else if (['lot', 'lot_number', 'batch', 'batch_number', 'lote'].includes(key)) {
      result.lot_number = value; matched = true
    } else if (['exp', 'expiry', 'expiry_date', 'expiration', 'use_by', 'best_before', 'fecha'].includes(key)) {
      result.expiry_date = normalizeDate(value); matched = true
    }
  }
  return matched ? result : null
}

function parseJSON(raw: string): ParsedQRPayload | null {
  try {
    const obj = JSON.parse(raw)
    const result: ParsedQRPayload = { raw, parseFormat: 'json' }
    let matched = false

    const refKeys = ['ref', 'reference', 'item_ref', 'gtin', 'itemRef']
    const lotKeys = ['lot', 'lot_number', 'batch', 'lotNumber', 'batchNumber']
    const expKeys = ['exp', 'expiry', 'expiry_date', 'expiryDate', 'expiration']

    for (const k of refKeys) {
      if (obj[k]) { result.ref = String(obj[k]); matched = true; break }
    }
    for (const k of lotKeys) {
      if (obj[k]) { result.lot_number = String(obj[k]); matched = true; break }
    }
    for (const k of expKeys) {
      if (obj[k]) { result.expiry_date = normalizeDate(String(obj[k])); matched = true; break }
    }

    return matched ? result : null
  } catch {
    return null
  }
}

function normalizeDate(dateStr: string): string {
  // Handle YYYY-MM, YYYY-MM-DD, MM/YYYY, MM-YYYY, YYYYMM
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  if (/^\d{2}\/\d{4}$/.test(dateStr)) {
    const [mm, yyyy] = dateStr.split('/')
    return `${yyyy}-${mm}-01`
  }
  if (/^\d{6}$/.test(dateStr)) {
    return parseGs1Date(dateStr) ?? dateStr
  }
  return dateStr
}

/** Single product REF barcode (e.g. AB-53AN, B31040, 3M-RX-U200) */
function parsePlainRef(raw: string): ParsedQRPayload | null {
  const value = raw.trim().replace(/:$/, '')
  if (!value || value.length > 64) return null
  if (/[:=|{}]/.test(value) || value.includes('(')) return null
  if (!/^[A-Za-z0-9][A-Za-z0-9.-]*$/.test(value)) return null

  return {
    raw: value,
    ref: value,
    parseFormat: 'plain_ref',
  }
}

export function parseQRPayload(raw: string): ParsedQRPayload {
  const trimmed = raw.trim()

  // GS1 with human-readable brackets: (01)... (10)... (17)...
  if (trimmed.includes('(') && trimmed.includes(')')) {
    const gs1Result = parseGS1(trimmed)
    if (gs1Result) return gs1Result
  }

  // GS1 UDI DataMatrix (no brackets) — common on medical device labels
  if (/^01\d/.test(trimmed)) {
    const elementResult = parseGS1ElementString(trimmed)
    if (elementResult) return elementResult
  }

  // Try JSON
  if (trimmed.startsWith('{')) {
    const jsonResult = parseJSON(trimmed)
    if (jsonResult) return jsonResult
  }

  // Try delimited key:value
  if (/[:=]/.test(trimmed)) {
    const delimResult = parseDelimited(trimmed)
    if (delimResult) return delimResult
  }

  // Plain product REF barcode (no LOT/expiry in label)
  const plainRef = parsePlainRef(trimmed)
  if (plainRef) return plainRef

  // Unknown format — return raw
  return { raw: trimmed, parseFormat: 'unknown' }
}

/* ─────────────────────────────────────────
   QR SCANNER COMPONENT
   ───────────────────────────────────────── */

export interface QRScanResult {
  payload: ParsedQRPayload
  isValid: boolean
  validationError?: string
}

interface QRScannerProps {
  onScan: (result: QRScanResult) => void
  disabled?: boolean
  placeholder?: string
  label?: string
}

const SCAN_DEBOUNCE_MS = 150 // HID scanners fire input rapidly then stop

export function QRScanner({
  onScan,
  disabled = false,
  placeholder = 'Focus here, then scan with your USB/BT scanner…',
  label = 'Scan QR Code',
}: QRScannerProps) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [lastResult, setLastResult] = useState<QRScanResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function focusInput() {
    inputRef.current?.focus()
  }

  function clearScanner() {
    setValue('')
    setStatus('idle')
    setLastResult(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const processInput = useCallback(
    (rawValue: string) => {
      if (!rawValue.trim()) return

      const payload = parseQRPayload(rawValue.trim())

      const isValid = !!(payload.ref || payload.lot_number)
      const validationError = !isValid
        ? 'Could not extract REF or LOT. Scan a product code (e.g. AB-53AN) or a full QR with LOT/expiry.'
        : undefined

      const result: QRScanResult = { payload, isValid, validationError }
      setLastResult(result)
      setStatus(isValid ? 'success' : 'error')
      onScan(result)
    },
    [onScan]
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
    setStatus('scanning')

    // Debounce: HID scanners type fast then stop
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (e.target.value.trim()) {
        processInput(e.target.value)
      }
    }, SCAN_DEBOUNCE_MS)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && value.trim()) {
      if (timerRef.current) clearTimeout(timerRef.current)
      processInput(value)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const statusConfig = {
    idle: {
      border: 'border-border',
      bg: '',
      icon: <QrCode className="h-5 w-5 text-muted-foreground" />,
    },
    scanning: {
      border: 'border-primary',
      bg: 'bg-[var(--scan-active-bg)]',
      icon: <QrCode className="h-5 w-5 text-primary animate-pulse" />,
    },
    success: {
      border: 'border-success',
      bg: 'bg-[var(--scan-success-bg)]',
      icon: <CheckCircle2 className="h-5 w-5 text-success" />,
    },
    error: {
      border: 'border-destructive',
      bg: 'bg-[var(--scan-error-bg)]',
      icon: <AlertCircle className="h-5 w-5 text-destructive" />,
    },
  }

  const current = statusConfig[status]

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'relative rounded-lg border-2 p-4 transition-all duration-200 cursor-text',
          current.border,
          current.bg
        )}
        onClick={focusInput}
      >
        <div className="flex items-center gap-3">
          {current.icon}
          <Input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            aria-label={label}
            className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); clearScanner() }}
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Parsed result display */}
      {lastResult && (
        <div className={cn(
          'rounded-lg border p-4 space-y-3',
          lastResult.isValid ? 'border-success/40 bg-[var(--scan-success-bg)]' : 'border-destructive/40 bg-[var(--scan-error-bg)]'
        )}>
          {lastResult.isValid ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm font-semibold text-foreground">QR parsed successfully</span>
                <Badge className="ml-auto bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] border-0 text-xs">
                  {lastResult.payload.parseFormat.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">REF</p>
                  <p className="text-sm font-mono font-semibold text-foreground">
                    {lastResult.payload.ref ?? <span className="text-muted-foreground italic">not found</span>}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">LOT</p>
                  <p className="text-sm font-mono font-semibold text-foreground">
                    {lastResult.payload.lot_number ?? <span className="text-muted-foreground italic">not found</span>}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expiry</p>
                  <p className="text-sm font-mono font-semibold text-foreground">
                    {lastResult.payload.expiry_date ?? <span className="text-muted-foreground italic">not found</span>}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Parse error</p>
                <p className="text-xs text-muted-foreground mt-0.5">{lastResult.validationError}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1 truncate max-w-sm">Raw: {lastResult.payload.raw}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
