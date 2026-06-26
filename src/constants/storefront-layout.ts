/** Shared storefront layout — one container width for all shop pages (Client-First container-large). */

export const STOREFRONT_GUTTER = 'px-6 lg:px-10' as const

export const STOREFRONT_PAGE_SPACING =
  'pt-[var(--storefront-page-pt)] pb-[var(--storefront-page-pb)]' as const

/** Hero inner padding — same on every StorefrontPageHero */
export const STOREFRONT_HERO_SPACING = 'py-14 md:py-20' as const

export const STOREFRONT_CONTAINER_CLASS =
  'mx-auto w-full max-w-[var(--storefront-width)] ' + STOREFRONT_GUTTER

/** Readable line length for body copy, descriptions, CTA text (~48rem) */
export const STOREFRONT_MAX_WIDTH_LARGE =
  'max-w-[var(--storefront-max-width-large)]' as const

/** Wider cap for multi-line headings (~64rem) */
export const STOREFRONT_MAX_WIDTH_XLARGE =
  'max-w-[var(--storefront-max-width-xlarge)]' as const

/** Narrow article column for news / education detail pages */
export const STOREFRONT_EDITORIAL_WIDTH =
  'max-w-[var(--storefront-editorial-width)]' as const

/** Featured image on editorial pages — landscape 16:9 */
export const STOREFRONT_EDITORIAL_IMAGE_ASPECT = 'aspect-video' as const

/** Slightly wider editorial layout (e.g. course page with sidebar) */
export const STOREFRONT_EDITORIAL_WIDTH_WIDE =
  'max-w-[var(--storefront-editorial-width-wide)]' as const

/** Hero / page subtitle — Client-First text-size-medium */
export const STOREFRONT_TEXT_SIZE_MEDIUM = 'text-size-medium' as const

/** @deprecated Use StorefrontContainer instead */
export function getStorefrontContainerClass() {
  return STOREFRONT_CONTAINER_CLASS
}
