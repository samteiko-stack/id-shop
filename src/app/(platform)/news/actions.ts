'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { newsPostSchema, type NewsPostInput } from '@/lib/validators'
import type { ApiResponse } from '@/types'
import { requireDeleteAccess, requireWriteAccess } from '@/lib/auth/permissions'
import { revalidateStorefrontNews } from '@/lib/storefront/revalidate-storefront'

function toPublishedAtIso(date: string): string {
  return `${date}T12:00:00.000Z`
}

function buildPayload(input: NewsPostInput) {
  const published_at =
    input.is_published && input.published_at ? toPublishedAtIso(input.published_at) : null

  return {
    title: input.title.trim(),
    slug: input.slug.trim(),
    excerpt: input.excerpt?.trim() || null,
    body: input.body.trim(),
    image_url: input.image_url?.trim() || null,
    is_published: input.is_published,
    published_at,
  }
}

export async function createNewsPost(input: NewsPostInput): Promise<ApiResponse> {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = newsPostSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createClient()
  const { error } = await supabase.from('news_posts').insert(buildPayload(parsed.data))

  if (error) return { error: error.message }

  revalidateStorefrontNews(parsed.data.slug)
  revalidatePath('/news')
  return {}
}

export async function updateNewsPost(id: string, input: NewsPostInput): Promise<ApiResponse> {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = newsPostSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createClient()
  const { error } = await supabase.from('news_posts').update(buildPayload(parsed.data)).eq('id', id)

  if (error) return { error: error.message }

  revalidateStorefrontNews(parsed.data.slug)
  revalidatePath('/news')
  return {}
}

export async function deleteNewsPost(id: string): Promise<ApiResponse> {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: post } = await supabase.from('news_posts').select('slug').eq('id', id).single()

  const { error } = await supabase
    .from('news_posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateStorefrontNews(post?.slug)
  revalidatePath('/news')
  revalidatePath('/archive')
  return {}
}

export async function restoreNewsPost(id: string): Promise<ApiResponse> {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: post } = await supabase
    .from('news_posts')
    .select('slug')
    .eq('id', id)
    .not('deleted_at', 'is', null)
    .single()

  if (!post) return { error: 'Archived news post not found' }

  const { error } = await supabase
    .from('news_posts')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateStorefrontNews(post.slug)
  revalidatePath('/news')
  revalidatePath('/archive')
  return {}
}

export async function unpublishNewsPost(id: string): Promise<ApiResponse> {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: post, error: fetchError } = await supabase
    .from('news_posts')
    .select('slug')
    .eq('id', id)
    .single()

  if (fetchError) return { error: fetchError.message }

  const { error } = await supabase
    .from('news_posts')
    .update({ is_published: false, published_at: null })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateStorefrontNews(post.slug)
  revalidatePath('/news')
  return {}
}
