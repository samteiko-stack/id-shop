'use client'

import { Printer } from '@/components/icons'
import { Button } from '@/components/ui/button'

interface PrintButtonProps {
  documentTitle?: string
}

export function PrintButton({ documentTitle }: PrintButtonProps) {
  function handlePrint() {
    if (documentTitle) document.title = documentTitle
    window.print()
  }

  return (
    <Button onClick={handlePrint} size="sm">
      <Printer className="h-4 w-4" />
      Print Sale
    </Button>
  )
}
