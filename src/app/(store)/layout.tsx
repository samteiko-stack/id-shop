import type { Metadata } from 'next'
import { shopMeta } from '@/lib/metadata'

export const metadata: Metadata = shopMeta.catalog

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
