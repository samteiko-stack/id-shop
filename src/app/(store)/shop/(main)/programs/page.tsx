import { createClient } from '@/lib/supabase/server'
import { ProgramsClient } from './programs-client'
import { getCachedPublishedCourses } from '@/lib/storefront/cached-queries'

export const metadata = { title: 'Program — ID Shop' }

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; country?: string }>
}) {
  const params = await searchParams
  const courses = await getCachedPublishedCourses()
  const countries = Array.from(new Set(courses.map((c) => c.country))).sort()

  return (
    <ProgramsClient
      courses={courses}
      countries={countries}
      initialLevel={params.level}
      initialCountry={params.country}
    />
  )
}
