import { AboutClient } from './about-client'

import { shopMeta } from '@/lib/metadata'

export const metadata = shopMeta.about

export default function AboutPage() {
  return <AboutClient />
}
