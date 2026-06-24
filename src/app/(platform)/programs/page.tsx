import { createClient } from '@/lib/supabase/server'
import { ProgramsManagementClient } from './programs-management-client'
import type { Course } from '@/types'

export const metadata = { title: 'Programs Management' }

export default async function ProgramsManagementPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .is('deleted_at', null)
    .order('start_date', { ascending: false })

  return <ProgramsManagementClient initialCourses={(courses as Course[]) ?? []} />
}
