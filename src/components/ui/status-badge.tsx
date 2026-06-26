'use client'

import { cn } from '@/lib/utils'
import { getStatusLabel, getStatusStyles } from '@/lib/status-config'

interface StatusBadgeProps {
  status: string
  type?: 'order' | 'invoice' | 'payment' | 'customer' | 'product'
  className?: string
  compact?: boolean
}

export function StatusBadge({ status, className, compact = false }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      compact ? 'px-2 py-0.5 text-[11px] leading-tight' : 'px-2.5 py-1 text-xs',
      getStatusStyles(status),
      className
    )}>
      {getStatusLabel(status)}
    </span>
  )
}
