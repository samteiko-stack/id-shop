'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, CourseCategory, CourseLevel } from '@/types'
import { requireDeleteAccess, requireWriteAccess } from '@/lib/auth/permissions'
import { revalidateStorefrontCourses } from '@/lib/storefront/revalidate-storefront'

interface CourseInput {
  title: string
  slug: string
  description: string
  start_date: string
  end_date: string | null
  duration_days: number
  location: string
  country: string
  category: CourseCategory
  level: CourseLevel
  instructor_name: string | null
  instructor_bio: string | null
  image_url: string | null
  hubspot_form_code: string | null
  is_published: boolean
}

export async function createCourse(input: CourseInput): Promise<ApiResponse> {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { error } = await supabase.from('courses').insert(input)

  if (error) return { error: error.message }

  revalidateStorefrontCourses(input.slug)
  revalidatePath('/programs')
  return {}
}

export async function updateCourse(id: string, input: CourseInput): Promise<ApiResponse> {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { error } = await supabase
    .from('courses')
    .update(input)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateStorefrontCourses(input.slug)
  revalidatePath('/programs')
  return {}
}

export async function deleteCourse(id: string): Promise<ApiResponse> {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { error } = await supabase
    .from('courses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateStorefrontCourses()
  revalidatePath('/programs')
  revalidatePath('/archive')
  return {}
}

export async function restoreCourse(id: string): Promise<ApiResponse> {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('slug')
    .eq('id', id)
    .not('deleted_at', 'is', null)
    .single()

  if (!course) return { error: 'Archived program not found' }

  const { error } = await supabase
    .from('courses')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateStorefrontCourses(course.slug)
  revalidatePath('/programs')
  revalidatePath('/archive')
  return {}
}
