import { shopMeta, withNoIndex } from '@/lib/metadata'

export const metadata = withNoIndex(shopMeta.login)

export default function ShopLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
