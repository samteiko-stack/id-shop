'use client'

import { useState, useTransition } from 'react'
import type { Category, ProductFamily } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from '@/lib/toast'
import { Plus, Loader2, ChevronDown, Info } from '@/components/icons'
import { createProductFamily } from './actions'
import type { ProductInput } from '@/lib/validators'

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/40">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      </div>
      <div className="p-4 space-y-4">
        {children}
      </div>
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, hint, error, children }: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ─── Family Picker ────────────────────────────────────────────────────────────
export function FamilyPicker({
  families,
  categories,
  value,
  onChange,
  onFamilyCreated,
}: {
  families: ProductFamily[]
  categories: Category[]
  value: string | null
  onChange: (familyId: string | null, categoryId: string | null) => void
  onFamilyCreated: (family: ProductFamily) => void
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedFamily = families.find(f => f.id === value)

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value || null
    const family = families.find(f => f.id === id)
    onChange(id, family?.category_id ?? null)
  }

  function handleCreate() {
    if (!newName.trim()) return
    startTransition(async () => {
      const res = await createProductFamily({ name: newName.trim(), category_id: newCategoryId, image_url: null, display_order: 0 })
      if (res.error) { toast.error(res.error); return }
      const family = res.data as unknown as ProductFamily
      onFamilyCreated(family)
      onChange(family.id, family.category_id ?? null)
      setCreating(false); setNewName(''); setNewCategoryId(null)
      toast.success(`Family "${family.name}" created`)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={value ?? ''}
            onChange={handleSelect}
            className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors"
          >
            <option value="">No family</option>
            {families.map(f => (
              <option key={f.id} value={f.id}>
                {f.name}{f.category ? ` · ${(f.category as any).name}` : ''}
              </option>
            ))}

          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(v => !v)} className="shrink-0 gap-1.5">
          <Plus className="h-3.5 w-3.5" />New Family
        </Button>
      </div>

      {creating && (
        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
          <p className="text-xs font-semibold text-foreground">Create new family</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="t.ex. Bio-Gide" className="h-9 text-sm" />
            </Field>
            <Field label="Category">
              <div className="relative">
                <select
                  value={newCategoryId ?? ''}
                  onChange={e => setNewCategoryId(e.target.value || null)}
                  className="h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors"
                >
                  <option value="">Select sub-category…</option>
                  {(() => {
                    const tops = categories.filter(c => !c.parent_id)
                    const subs = categories.filter(c => !!c.parent_id)
                    return tops.map(parent => {
                      const children = subs.filter(c => c.parent_id === parent.id)
                      if (!children.length) return null
                      return (
                        <optgroup key={parent.id} label={parent.name}>
                          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </optgroup>
                      )
                    })
                  })()}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </Field>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleCreate} disabled={!newName.trim() || isPending} className="gap-1.5">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Create
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setCreating(false); setNewName(''); setNewCategoryId(null) }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {selectedFamily && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground">Category set automatically:</span>
          <span className="font-semibold text-foreground">{(selectedFamily.category as any)?.name ?? 'Unknown category'}</span>
        </div>
      )}
    </div>
  )
}

// ─── Select wrapper ───────────────────────────────────────────────────────────
function SelectField({ id, value, onChange, disabled, children }: {
  id?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  )
}

// ─── Product Form ─────────────────────────────────────────────────────────────
export function ProductForm({
  form,
  setForm,
  categories,
  families: initialFamilies,
  errors = {},
  isPending,
}: {
  form: ProductInput
  setForm: (v: ProductInput) => void
  categories: Category[]
  families: ProductFamily[]
  errors?: Record<string, string>
  isPending: boolean
}) {
  const [families, setFamilies] = useState(initialFamilies)
  const familyLocked = !!form.family_id

  return (
    <div className="space-y-5">
      {/* Image */}
      <ImageUpload value={form.image_url ?? null} onChange={url => setForm({ ...form, image_url: url })} folder="products" />

      {/* Family */}
      <Section title="Product Family">
        <FamilyPicker
          families={families}
          categories={categories}
          value={form.family_id ?? null}
          onChange={(familyId, categoryId) => setForm({ ...form, family_id: familyId, category_id: categoryId })}
          onFamilyCreated={family => setFamilies(f => [...f, family])}
        />
      </Section>

      {/* Basic info */}
      <Section title="Basic Information">
        <Field label="Product name" required error={errors.name}>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={isPending} />
        </Field>
        <Field label="Secondary name" hint="Alternative name or variant description">
            <Input value={form.secondary_name ?? ''} onChange={e => setForm({ ...form, secondary_name: e.target.value || null })} disabled={isPending} placeholder="e.g. Bio-Gide 25×25 mm" />
        </Field>
        <Field label="Product code (REF)" required error={errors.ref}>
          <Input value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })} disabled={isPending} className="font-mono" />
        </Field>
        <Field label="Category">
          {familyLocked ? (
            <div className="h-10 flex items-center px-3 rounded-lg border border-input bg-muted/50 text-sm text-muted-foreground cursor-not-allowed">
              Auto from family
            </div>
          ) : (
            <SelectField
              value={form.category_id ?? ''}
              onChange={e => setForm({ ...form, category_id: e.target.value || null })}
              disabled={isPending}
            >
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
          )}
        </Field>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Sales price (kr)" required error={errors.unit_price}>
            <Input type="number" min="0" step="0.01" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} disabled={isPending} />
          </Field>
          <Field label="Purchase price (kr)" hint="Not visible to customers">
            <Input type="number" min="0" step="0.01" value={form.cost_price ?? ''} onChange={e => setForm({ ...form, cost_price: e.target.value ? parseFloat(e.target.value) : null })} disabled={isPending} placeholder="0.00" />
          </Field>
          <Field label="Unit">
            <Input value={form.unit ?? ''} onChange={e => setForm({ ...form, unit: e.target.value || null })} disabled={isPending} placeholder="st, box, kit" />
          </Field>
        </div>
      </Section>

      {/* Stock */}
      <Section title="Stock & Weight">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Weight (kg)">
            <Input type="number" min="0" step="0.001" value={form.weight_kg ?? ''} onChange={e => setForm({ ...form, weight_kg: e.target.value ? parseFloat(e.target.value) : null })} disabled={isPending} placeholder="0.000" />
          </Field>
          <Field label="Stock warning" hint="Warn when stock falls below this quantity">
            <Input type="number" min="0" value={form.alert_quantity ?? 0} onChange={e => setForm({ ...form, alert_quantity: parseInt(e.target.value) || 0 })} disabled={isPending} />
          </Field>
        </div>
      </Section>

      {/* Visibility */}
      <Section title="Visibility & Status">
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'is_active',      label: 'Active',        sub: 'Available for sale' },
            { key: 'is_featured',    label: 'Featured',      sub: 'Shown on shop homepage' },
            { key: 'is_promotional', label: 'Promotional',   sub: 'Marked as promotional product' },
            { key: 'hide_in_shop',   label: 'Hide in shop',  sub: 'Order via admin only' },
          ].map(({ key, label, sub }) => (
            <label key={key} className="flex items-start gap-3 rounded-lg border border-input p-3.5 cursor-pointer hover:bg-muted/40 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
              <Checkbox
                id={`product-${key}`}
                checked={!!(form as any)[key]}
                onCheckedChange={(checked) => setForm({ ...form, [key]: !!checked })}
                disabled={isPending}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-foreground leading-none mb-1">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Descriptions */}
      <Section title="Descriptions">
        <Field label="Product description" hint="Shown on the product page in the shop">
          <Textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} disabled={isPending} rows={3} placeholder="Describe the product…" />
        </Field>
        <Field label="Invoice note" hint="Printed on invoices for this product">
          <Textarea value={form.invoice_notes ?? ''} onChange={e => setForm({ ...form, invoice_notes: e.target.value || null })} disabled={isPending} rows={2} placeholder="e.g. incl. sterilization" />
        </Field>
      </Section>
    </div>
  )
}
