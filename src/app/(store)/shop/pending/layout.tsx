import { shopMeta, withNoIndex } from '@/lib/metadata'

export const metadata = withNoIndex(shopMeta.pendingApproval)

export default function PendingApprovalLayout({ children }: { children: React.ReactNode }) {
  return children
}
