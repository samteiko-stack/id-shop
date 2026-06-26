import { notFound } from 'next/navigation'
import { CourseDetailClient } from './course-detail-client'
import { shopMeta } from '@/lib/metadata'
import {
  getCachedCourseBySlug,
  getCachedCourseTestimonials,
} from '@/lib/storefront/cached-queries'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCachedCourseBySlug(slug)

  if (!course) return shopMeta.programs

  return shopMeta.programDetail(course.title, course.description)
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCachedCourseBySlug(slug)

  if (!course) notFound()

  const testimonials = await getCachedCourseTestimonials(course.id)

  return <CourseDetailClient course={course} testimonials={testimonials} />
}
