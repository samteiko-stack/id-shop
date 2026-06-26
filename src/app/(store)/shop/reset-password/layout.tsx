import { shopMeta, withNoIndex } from '@/lib/metadata'

export const metadata = withNoIndex(shopMeta.resetPassword)

export default function ShopResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
