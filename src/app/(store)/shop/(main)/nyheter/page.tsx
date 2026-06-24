import { getCachedPublishedNewsPosts } from '@/lib/storefront/cached-queries'
import { NyheterClient } from './nyheter-client'

export const metadata = {
  title: 'Nyheter — ID Shop',
  description: 'Senaste nytt från ID Shop – produktnyheter, branschuppdateringar och tips för kliniker.',
}

export default async function NyheterPage() {
  const posts = await getCachedPublishedNewsPosts()
  return <NyheterClient posts={posts} />
}
