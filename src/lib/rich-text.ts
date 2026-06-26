export function isRichTextEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0
}

export function looksLikeHtml(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content.trim())
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Converts legacy plain-text article bodies for the editor or storefront. */
export function plainTextToHtml(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return ''

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function toEditorHtml(content: string): string {
  if (!content.trim()) return ''
  return looksLikeHtml(content) ? content : plainTextToHtml(content)
}
