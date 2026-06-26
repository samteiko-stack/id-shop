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
  parseFormat: 'gs1' | 'delimited' | 'json' | 'unknown'
}

const GS1_AI_MAP: Record<string, keyof ParsedQRPayload> = {
  '01': 'ref',       // GTIN (used as REF here)
  '240': 'ref',      // Additional product identification
  '10': 'lot_number',
  '17': 'expiry_date',
  '21': 'lot_number', // Serial number (fallback)
}

function parseGS1(raw: string): ParsedQRPayload | null {
  // GS1 uses FNC1 character (ASCII 29, GS char) as AI separator
  // HID scanners often replace it with a group separator or just omit it
  // Pattern: (AI)value or \x1d + AI + value
  const gs1Pattern = /\((\d{2,4})\)([^(]+)/g
  const altPattern = /[\x1d\x1e]([\d]{2,4})/g

  const result: ParsedQRPayload = { raw, parseFormat: 'gs1' }
  let matched = false

  let match
  const bracketRegex = /\((\d{2,4})\)([^()]*)/g
  while ((match = bracketRegex.exec(raw)) !== null) {
    const ai = match[1]
    let value = match[2].trim()

    if (ai === '17') {
      // GS1 date format: YYMMDD → YYYY-MM-DD
      if (/^\d{6}$/.test(value)) {
        const yy = parseInt(value.slice(0, 2))
        const mm = value.slice(2, 4)
        const dd = value.slice(4, 6)
        const year = yy >= 0 && yy < 30 ? 2000 + yy : 1900 + yy
        value = `${year}-${mm}-${dd}`
      }
    }

    const field = GS1_AI_MAP[ai]
    if (field) {
      ;(result as any)[field] = value
      matched = true
    }
  }

  return matched ? result : null
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
    const yy = parseInt(dateStr.slice(0, 2))
    const mm = dateStr.slice(2, 4)
    const year = yy >= 0 && yy < 30 ? 2000 + yy : 1900 + yy
    return `${year}-${mm}-01`
  }
  return dateStr
}

export function parseQRPayload(raw: string): ParsedQRPayload {
  const trimmed = raw.trim()

  // Try GS1 format first (has brackets around AIs)
  if (trimmed.includes('(') && trimmed.includes(')')) {
    const gs1Result = parseGS1(trimmed)
    if (gs1Result) return gs1Result
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
        ? 'Could not extract REF or LOT from this QR code. Try manual entry.'
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
