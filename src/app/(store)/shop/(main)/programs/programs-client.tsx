'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import type { Course, CourseLevel } from '@/types'
import {
  COURSE_LEVEL_LABELS,
  formatCourseDurationBadge,
} from '@/lib/storefront/course-labels'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Calendar, GraduationCap, X } from '@/components/icons'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { StorefrontPageHero } from '@/components/storefront/storefront-page-hero'

interface Props {
  courses: Course[]
  countries: string[]
  initialLevel?: string
  initialCountry?: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ProgramsClient({ courses, countries, initialLevel, initialCountry }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<string>(initialLevel ?? 'all')
  const [country, setCountry] = useState<string>(initialCountry ?? 'all')

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const q = search.toLowerCase()
      const matchesSearch = !search ||
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.instructor_name?.toLowerCase().includes(q)
      const matchesLevel = level === 'all' || c.level === level
      const matchesCountry = country === 'all' || c.country === country
      return matchesSearch && matchesLevel && matchesCountry
    })
  }, [courses, search, level, country])

  const hasFilters = level !== 'all' || country !== 'all' || search

  function clearFilters() {
    setSearch('')
    setLevel('all')
    setCountry('all')
    router.push('/shop/programs')
  }

  return (
    <div>
      <StorefrontPageHero
        eyebrow="Utbildning"
        title="Program"
        description="Praktiska kurser och workshops för tandläkare och medicinsk personal. Utveckla dina färdigheter med hands-on utbildning från branschexperter."
      />

      <StorefrontContainer pageSpacing>
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök kurser…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-11"
              />
            </div>

            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="all">Alla nivåer</option>
              {Object.entries(COURSE_LEVEL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="h-10 w-48 appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="all">Alla länder</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4" />
                Rensa filter
              </Button>
            )}

            <p className="text-sm text-muted-foreground ml-auto">
              <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'kurs' : 'kurser'}
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-base font-semibold text-foreground">Inga kurser hittades</p>
            <p className="text-sm text-muted-foreground mt-1">Prova att justera dina filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </StorefrontContainer>
    </div>
  )
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/shop/programs/${course.slug}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-ring/40"
    >
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {course.image_url ? (
          <NextImage
            src={course.image_url}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <GraduationCap className="h-12 w-12 text-primary/40" />
          </div>
        )}
        {course.duration_days > 1 && (
          <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1 text-xs font-semibold">
            {formatCourseDurationBadge(course.duration_days)}
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {COURSE_LEVEL_LABELS[course.level as CourseLevel]}
          </Badge>
        </div>

        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(course.start_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{course.location}, {course.country}</span>
          </div>
          {course.instructor_name && (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span>{course.instructor_name}</span>
            </div>
          )}
        </div>

        <Button variant="outline" className="w-full mt-4">
          Visa detaljer
        </Button>
      </div>
    </Link>
  )
}
