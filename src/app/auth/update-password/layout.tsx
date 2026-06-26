import { shopMeta, withNoIndex } from '@/lib/metadata'

export const metadata = withNoIndex(shopMeta.updatePassword)

export default function UpdatePasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
