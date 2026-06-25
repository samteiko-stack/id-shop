import { shopMeta } from '@/lib/metadata'
import { getCachedPublishedNewsPosts } from '@/lib/storefront/cached-queries'
import { NyheterClient } from './nyheter-client'

export const metadata = shopMeta.news

export default async function NyheterPage() {
  const posts = await getCachedPublishedNewsPosts()
  return <NyheterClient posts={posts} />
}
