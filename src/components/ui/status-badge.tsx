'use client'

import { cn } from '@/lib/utils'
import { getStatusLabel, getStatusStyles } from '@/lib/status-config'

interface StatusBadgeProps {
  status: string
  type?: 'order' | 'invoice' | 'payment' | 'customer' | 'product'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
      getStatusStyles(status),
      className
    )}>
      {getStatusLabel(status)}
    </span>
  )
}
