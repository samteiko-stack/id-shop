import { createClient } from '@/lib/supabase/server'
import { NewsManagementClient } from './news-management-client'
import type { NewsPost } from '@/types'

export const metadata = { title: 'News' }

export default async function NewsManagementPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('news_posts')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return <NewsManagementClient initialPosts={(posts as NewsPost[]) ?? []} />
}
