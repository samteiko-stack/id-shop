import { notFound } from 'next/navigation'
import { NewsDetailClient } from './news-detail-client'
import { shopMeta } from '@/lib/metadata'
import { getCachedNewsPostBySlug } from '@/lib/storefront/cached-queries'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getCachedNewsPostBySlug(slug)

  if (!post) return shopMeta.news

  return shopMeta.newsDetail(post.title, post.excerpt)
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getCachedNewsPostBySlug(slug)

  if (!post) notFound()

  return <NewsDetailClient post={post} />
}
