import { shopMeta, withNoIndex } from '@/lib/metadata'

export const metadata = withNoIndex(shopMeta.register)

export default function ShopRegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
