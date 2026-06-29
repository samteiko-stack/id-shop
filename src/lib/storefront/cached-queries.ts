import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { getFooterCategoryGroups } from '@/lib/storefront/footer-categories'
import { STOREFRONT_CACHE_REVALIDATE, STOREFRONT_CACHE_TAGS } from '@/lib/storefront/cache-tags'
import type { Course, CourseTestimonial, NewsPost, Category } from '@/types'

function todayIsoDate() {
  return new Date().toISOString().split('T')[0]
}

export function getCachedFooterCategories() {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient()
      return getFooterCategoryGroups(supabase)
    },
    ['storefront-footer-categories'],
    { revalidate: STOREFRONT_CACHE_REVALIDATE, tags: [STOREFRONT_CACHE_TAGS.categories] },
  )()
}

export function getCachedPublishedCourses() {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient()
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .is('deleted_at', null)
        .gte('start_date', todayIsoDate())
        .order('start_date', { ascending: true })
      return (data as Course[]) ?? []
    },
    ['storefront-published-courses'],
    { revalidate: STOREFRONT_CACHE_REVALIDATE, tags: [STOREFRONT_CACHE_TAGS.courses] },
  )()
}

export function getCachedCourseBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient()
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .is('deleted_at', null)
        .maybeSingle()
      return (data as Course | null) ?? null
    },
    ['storefront-course', slug],
    { revalidate: STOREFRONT_CACHE_REVALIDATE, tags: [STOREFRONT_CACHE_TAGS.courses, `course:${slug}`] },
  )()
}

export function getCachedCourseTestimonials(courseId: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient()
      const { data } = await supabase
        .from('course_testimonials')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
      return (data as CourseTestimonial[]) ?? []
    },
    ['storefront-course-testimonials', courseId],
    { revalidate: STOREFRONT_CACHE_REVALIDATE, tags: [STOREFRONT_CACHE_TAGS.courses, `course-testimonials:${courseId}`] },
  )()
}

export function getCachedPublishedNewsPosts() {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient()
      const { data } = await supabase
        .from('news_posts')
        .select('*')
        .eq('is_published', true)
        .is('deleted_at', null)
        .order('published_at', { ascending: false })
      return (data as NewsPost[]) ?? []
    },
    ['storefront-published-news'],
    { revalidate: STOREFRONT_CACHE_REVALIDATE, tags: [STOREFRONT_CACHE_TAGS.news] },
  )()
}

export function getCachedNewsPostBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient()
      const { data } = await supabase
        .from('news_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .is('deleted_at', null)
        .maybeSingle()
      return (data as NewsPost | null) ?? null
    },
    ['storefront-news-post', slug],
    { revalidate: STOREFRONT_CACHE_REVALIDATE, tags: [STOREFRONT_CACHE_TAGS.news, `news:${slug}`] },
  )()
}

export function getCachedShopCatalog() {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient()
      const [productsResult, mainCategoriesResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, ref, description, unit_price, currency, image_url, category_id, categories(id, name)')
          .is('deleted_at', null)
          .eq('is_active', true)
          .order('name')
          .limit(500),
        supabase
          .from('categories')
          .select('id, name, slug, image_url')
          .is('parent_id', null)
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('categories')
          .select('id, name')
          .is('deleted_at', null)
          .order('name'),
      ])

      type ShopProduct = {
        id: string
        name: string
        ref: string
        description: string | null
        unit_price: number
        currency: string
        image_url: string | null
        category_id: string | null
        categories: { id: string; name: string } | null
      }

      const products = (productsResult.data ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        categories: Array.isArray(p.categories) ? p.categories[0] ?? null : p.categories,
      })) as ShopProduct[]

      return {
        products,
        mainCategories: mainCategoriesResult.data ?? [],
        categories: (categoriesResult.data ?? []) as Category[],
      }
    },
    ['storefront-shop-catalog'],
    {
      revalidate: STOREFRONT_CACHE_REVALIDATE,
      tags: [STOREFRONT_CACHE_TAGS.products, STOREFRONT_CACHE_TAGS.categories],
    },
  )()
}

async function resolveCategoryChainPublic(slugs: string[]): Promise<Category[] | null> {
  const supabase = createPublicClient()
  const chain: Category[] = []
  let parentId: string | null = null

  for (const slug of slugs) {
    let query = supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url, display_style')

    if (parentId === null) {
      query = query.is('parent_id', null).eq('slug', slug)
    } else {
      query = query.eq('parent_id', parentId).eq('slug', slug)
    }

    const { data } = await query.single()
    if (!data) return null

    chain.push(data as Category)
    parentId = data.id
  }

  return chain
}

export function getCachedTopCategories() {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient()
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, image_url')
        .is('parent_id', null)
        .is('deleted_at', null)
        .order('name')
      return data ?? []
    },
    ['storefront-top-categories'],
    { revalidate: STOREFRONT_CACHE_REVALIDATE, tags: [STOREFRONT_CACHE_TAGS.categories] },
  )()
}

export function getCachedCategoryPageData(slugPath: string[]) {
  const slugKey = slugPath.join('/')

  return unstable_cache(
    async () => {
      const chain = await resolveCategoryChainPublic(slugPath)
      if (!chain) return null

      const currentCategory = chain[chain.length - 1]
      const supabase = createPublicClient()

      const { data: subCategories } = await supabase
        .from('categories')
        .select('id, name, slug, image_url, display_style')
        .eq('parent_id', currentCategory.id)
        .is('deleted_at', null)
        .order('name')

      const hasSubCategories = (subCategories?.length ?? 0) > 0

      if (hasSubCategories) {
        return {
          chain,
          subCategories: subCategories ?? [],
          products: [] as Record<string, unknown>[],
          displayStyle: 'list' as const,
        }
      }

      const { data: products } = await supabase
        .from('products')
        .select(
          'id, name, secondary_name, ref, slug, unit_price, currency, unit, image_url, product_family, display_order, is_featured, hide_in_shop, family:product_families(id, name, image_url)',
        )
        .eq('category_id', currentCategory.id)
        .eq('hide_in_shop', false)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('display_order', { ascending: true })
        .order('name')

      const displayStyle = (currentCategory.display_style as 'list' | 'grouped') ?? 'list'

      return {
        chain,
        subCategories: subCategories ?? [],
        products: products ?? [],
        displayStyle,
      }
    },
    ['storefront-category-page', slugKey],
    {
      revalidate: STOREFRONT_CACHE_REVALIDATE,
      tags: [STOREFRONT_CACHE_TAGS.categories, `category:${slugKey}`],
    },
  )()
}

export function getCachedShopProduct(id: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient()

      const { data: rawProduct } = await supabase
        .from('products')
        .select('id, name, ref, description, unit_price, currency, image_url, category_id, categories(id, name)')
        .eq('id', id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (!rawProduct) return null

      const product = {
        ...rawProduct,
        categories: Array.isArray(rawProduct.categories)
          ? (rawProduct.categories[0] ?? null)
          : rawProduct.categories,
      }

      const { data: rawRelated } = product.category_id
        ? await supabase
            .from('products')
            .select('id, name, ref, unit_price, currency, image_url, category_id, categories(id, name)')
            .eq('category_id', product.category_id)
            .eq('is_active', true)
            .is('deleted_at', null)
            .neq('id', id)
            .limit(4)
        : { data: [] }

      const related = (rawRelated ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        categories: Array.isArray(p.categories) ? (p.categories as unknown[])[0] ?? null : p.categories,
      }))

      return { product, related }
    },
    ['storefront-product', id],
    {
      revalidate: STOREFRONT_CACHE_REVALIDATE,
      tags: [STOREFRONT_CACHE_TAGS.products, `product:${id}`],
    },
  )()
}
