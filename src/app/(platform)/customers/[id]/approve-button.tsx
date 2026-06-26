'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from '@/components/icons'
import { approveCustomer } from '@/app/(store)/shop/actions'
import { useRole } from '@/hooks/use-role'

export function ApproveButton({ customerId }: { customerId: string }) {
  const router = useRouter()
  const { isAdmin } = useRole()
  const [loading, setLoading] = useState(false)

  if (!isAdmin) return null

  async function handleApprove() {
    setLoading(true)
    await approveCustomer(customerId)
    router.refresh()
  }

  return (
    <Button onClick={handleApprove} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
      Approve Account
    </Button>
  )
}
