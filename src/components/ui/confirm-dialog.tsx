'use client'

import { useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, Trash2 } from '@/components/icons'

export type ConfirmVariant = 'destructive' | 'warning' | 'default'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

const ICON: Record<ConfirmVariant, React.ReactNode> = {
  destructive: <Trash2 className="h-5 w-5 text-destructive" />,
  warning:     <AlertTriangle className="h-5 w-5 text-warning" />,
  default:     null,
}

const CONFIRM_CLASS: Record<ConfirmVariant, string> = {
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  warning:     'bg-warning text-warning-foreground hover:bg-warning/90',
  default:     '',
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition()
  const busy = loading || isPending

  function handleConfirm() {
    startTransition(async () => {
      await onConfirm()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={busy ? undefined : onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            {ICON[variant]}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
          <Button
            className={CONFIRM_CLASS[variant]}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
