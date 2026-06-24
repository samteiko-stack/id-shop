import { notFound } from 'next/navigation'
import { NewsDetailClient } from './news-detail-client'
import { getCachedNewsPostBySlug } from '@/lib/storefront/cached-queries'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getCachedNewsPostBySlug(slug)

  if (!post) return { title: 'Artikel hittades inte' }

  return {
    title: `${post.title} — Nyheter — ID Shop`,
    description: post.excerpt?.slice(0, 160) ?? undefined,
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getCachedNewsPostBySlug(slug)

  if (!post) notFound()

  return <NewsDetailClient post={post} />
}
