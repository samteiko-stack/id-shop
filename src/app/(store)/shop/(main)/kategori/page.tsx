import { Breadcrumb } from '@/components/ui/breadcrumb'
import { CategoryCard } from '@/components/shop/category-card'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { StorefrontPageHero } from '@/components/storefront/storefront-page-hero'
import { getCachedTopCategories } from '@/lib/storefront/cached-queries'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Alla kategorier | Sortiment' }

export default async function AllCategoriesPage() {
  const topCategories = await getCachedTopCategories()

  return (
    <>
      <StorefrontPageHero
        eyebrow="Sortiment"
        title="Alla kategorier"
        description="Bläddra i vårt sortiment efter produktkategori."
      />

      <StorefrontContainer pageSpacing className="space-y-8">
        <Breadcrumb items={[{ label: 'Alla kategorier' }]} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {topCategories.map(cat => (
            <CategoryCard
              key={cat.id}
              name={cat.name}
              href={`/shop/kategori/${cat.slug}`}
              imageUrl={cat.image_url}
            />
          ))}
        </div>
      </StorefrontContainer>
    </>
  )
}
