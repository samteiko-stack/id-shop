import { shopMeta, withNoIndex } from '@/lib/metadata'

export const metadata = withNoIndex(shopMeta.authCallback)

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children
}
