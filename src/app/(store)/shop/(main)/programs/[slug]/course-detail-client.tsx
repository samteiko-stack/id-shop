'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import type { Course, CourseTestimonial } from '@/types'
import { formatCourseDuration } from '@/lib/storefront/course-labels'
import { Calendar, MapPin, Clock, ArrowLeft, User, Star } from '@/components/icons'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { CourseRegistrationSection } from '@/components/storefront/course-registration-section'
import { STOREFRONT_EDITORIAL_IMAGE_ASPECT } from '@/constants/storefront-layout'
import { cn } from '@/lib/utils'

interface Props {
  course: Course
  testimonials: CourseTestimonial[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function CourseDetailClient({ course, testimonials }: Props) {
  const hasSignupForm = Boolean(course.hubspot_form_code?.trim())

  return (
    <div>
      <StorefrontContainer as="article" className="pt-[var(--storefront-page-pt)] pb-16">
        <div className="mx-auto w-full max-w-3xl">
          <Link
            href="/shop/programs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till program
          </Link>

          <header className="space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {course.title}
            </h1>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-8">
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                {formatDate(course.start_date)}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                {course.location}, {course.country}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                {formatCourseDuration(course.duration_days)}
              </li>
            </ul>
          </header>

          {course.image_url && (
            <div
              className={cn(
                'relative mt-10 w-full overflow-hidden rounded-xl border border-border bg-muted',
                STOREFRONT_EDITORIAL_IMAGE_ASPECT,
              )}
            >
              <NextImage
                src={course.image_url}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}

          <div className="mt-12 space-y-12">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Om kursen</h2>
              <div className="text-size-medium text-muted-foreground leading-relaxed whitespace-pre-line">
                {course.description}
              </div>
            </section>

            {course.instructor_name && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Om instruktören</h2>
                <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{course.instructor_name}</h3>
                    {course.instructor_bio && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {course.instructor_bio}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {testimonials.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Deltagarnas omdömen</h2>
                <ul className="space-y-4">
                  {testimonials.map((t) => (
                    <li key={t.id} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-start gap-4">
                        {t.image_url ? (
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-full">
                            <NextImage
                              src={t.image_url}
                              alt={t.participant_name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-semibold text-sm text-foreground">{t.participant_name}</span>
                            {t.participant_title && (
                              <span className="text-xs text-muted-foreground">{t.participant_title}</span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-3.5 w-3.5',
                                  i < t.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted',
                                )}
                              />
                            ))}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.feedback}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </StorefrontContainer>

      {hasSignupForm ? (
        <CourseRegistrationSection html={course.hubspot_form_code!} />
      ) : (
        <section className="border-t border-border bg-muted/40 py-16">
          <StorefrontContainer>
            <p className="mx-auto max-w-xl text-center text-sm text-muted-foreground">
              Anmälningsformuläret för den här kursen publiceras snart. Kontakta oss om du vill veta mer.
            </p>
          </StorefrontContainer>
        </section>
      )}
    </div>
  )
}
