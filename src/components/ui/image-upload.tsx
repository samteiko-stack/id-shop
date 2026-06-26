'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageIcon, UploadCloud, X, Loader2 } from '@/components/icons'
import { cn } from '@/lib/utils'

const BUCKET = 'images'
const MAX_SIZE_MB = 5
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface Props {
  value: string | null | undefined
  onChange: (url: string | null) => void
  folder?: string
  className?: string
}

export function ImageUpload({ value, onChange, folder = 'misc', className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    setError(null)
    if (!ACCEPTED.includes(file.type)) { setError('Only JPEG, PNG, WebP or GIF allowed.'); return }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`Max ${MAX_SIZE_MB} MB.`); return }
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) { setError(uploadError.message); return }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      onChange(data.publicUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        className={cn(
          'relative overflow-hidden rounded-xl border border-border bg-muted/40 transition-all cursor-pointer select-none',
          'hover:bg-muted/70 hover:border-ring/40',
          dragging && 'border-ring bg-muted/70',
          value ? 'h-36' : 'h-28',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Preview" className="h-full w-full object-contain p-2" />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(null) }}
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : uploading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-foreground">Click to upload</p>
              <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WebP · max {MAX_SIZE_MB} MB</p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
