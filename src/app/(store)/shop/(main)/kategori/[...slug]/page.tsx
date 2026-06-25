import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb'
import { ProductsDisplay } from '../products-display'
import { CategoryCard } from '@/components/shop/category-card'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { StorefrontPageHero } from '@/components/storefront/storefront-page-hero'
import { getCustomerDiscountRate } from '@/lib/storefront/customer-discount'
import { getCachedCategoryPageData } from '@/lib/storefront/cached-queries'
import type { Metadata } from 'next'
import { shopMeta } from '@/lib/metadata'

interface PageProps {
  params: Promise<{ slug: string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getCachedCategoryPageData(slug)
  if (!data) return shopMeta.categories
  const last = data.chain[data.chain.length - 1]
  return shopMeta.category(last.name)
}

async function getCustomerContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.user_metadata?.role !== 'customer') {
    return { isLoggedIn: !!user, isApproved: false, discountRate: 0 }
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('is_approved')
    .eq('auth_user_id', user.id)
    .single()

  const isApproved = customer?.is_approved ?? false
  const discountRate = await getCustomerDiscountRate(supabase, user.id)

  return { isLoggedIn: true, isApproved, discountRate }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const [data, { isLoggedIn, isApproved, discountRate }] = await Promise.all([
    getCachedCategoryPageData(slug),
    getCustomerContext(),
  ])

  if (!data) notFound()

  const { chain, subCategories, products, displayStyle } = data
  const currentCategory = chain[chain.length - 1]
  const hasSubCategories = subCategories.length > 0

  const basePath = '/shop/kategori/' + slug.join('/')
  const breadcrumbs: BreadcrumbItem[] = chain.map((cat, i) => ({
    label: cat.name,
    href: i < chain.length - 1
      ? '/shop/kategori/' + slug.slice(0, i + 1).join('/')
      : undefined,
  }))

  if (hasSubCategories) {
    return (
      <>
        <StorefrontPageHero
          eyebrow="Sortiment"
          title={currentCategory.name}
          description="Bläddra vidare i sortimentet och hitta rätt produkter för din klinik."
        />
        <StorefrontContainer pageSpacing className="space-y-8">
          <Breadcrumb items={breadcrumbs} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {subCategories.map(cat => (
              <CategoryCard
                key={cat.id}
                name={cat.name}
                href={`${basePath}/${cat.slug}`}
                imageUrl={cat.image_url}
              />
            ))}
          </div>
        </StorefrontContainer>
      </>
    )
  }

  return (
    <>
      <StorefrontPageHero
        eyebrow="Sortiment"
        title={currentCategory.name}
        description="Certifierade produkter inom kategorin — sök, filtrera och beställ online."
      />
      <StorefrontContainer pageSpacing>
        <ProductsDisplay
          products={products as any}
          displayStyle={displayStyle}
          breadcrumbs={breadcrumbs}
          isApproved={isApproved}
          isLoggedIn={isLoggedIn}
          discountRate={discountRate}
        />
      </StorefrontContainer>
    </>
  )
}
