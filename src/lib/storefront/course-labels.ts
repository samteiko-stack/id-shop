import type { CourseCategory, CourseLevel } from '@/types'

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  full_arch: 'Fullständig rekonstruktion',
  maxilla_for_all: 'Maxilla-For-All',
  implantology: 'Implantologi',
  surgery: 'Kirurgi',
  prosthetics: 'Protetik',
  other: 'Övrigt',
}

export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: 'Nybörjare',
  intermediate: 'Medel',
  advanced: 'Avancerad',
}

export function formatCourseDuration(days: number): string {
  return days === 1 ? '1 dag' : `${days} dagar`
}

export function formatCourseDurationBadge(days: number): string {
  return days === 1 ? '1-dagskurs' : `${days}-dagarskurs`
}
