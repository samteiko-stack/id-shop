import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop — ID Shop',
  description: 'Medical & Dental Supply Shop',
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
