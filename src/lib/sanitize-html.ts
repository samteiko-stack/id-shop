import DOMPurify from 'isomorphic-dompurify'
import { looksLikeHtml, plainTextToHtml } from '@/lib/rich-text'

const ARTICLE_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u',
  'h2', 'h3', 'h4',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'hr',
]

export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ARTICLE_ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

export function toArticleHtml(content: string, options?: { omitTitle?: string }): string {
  const source = looksLikeHtml(content) ? content : plainTextToHtml(content)
  let html = sanitizeArticleHtml(source)
  if (options?.omitTitle) {
    html = stripDuplicateTitleHeading(html, options.omitTitle)
  }
  return html
}

/** Drop leading H2 when it repeats the page title already shown in the hero */
function stripDuplicateTitleHeading(html: string, title: string): string {
  const normalizedTitle = title.trim().toLowerCase()
  if (!normalizedTitle) return html

  return html.replace(/^(\s*<h2[^>]*>)([\s\S]*?)(<\/h2>\s*)/i, (match, _open, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim().toLowerCase()
    return text === normalizedTitle ? '' : match
  })
}
