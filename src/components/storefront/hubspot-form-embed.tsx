'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  html: string
  className?: string
}

/** HubSpot embeds include `<script>` tags — innerHTML alone won't run them. */
export function HubSpotFormEmbed({ html, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !html.trim()) return

    container.innerHTML = ''
    const template = document.createElement('div')
    template.innerHTML = html

    template.childNodes.forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        const script = document.createElement('script')
        const oldScript = node as HTMLScriptElement
        Array.from(oldScript.attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value)
        })
        script.textContent = oldScript.textContent
        container.appendChild(script)
      } else {
        container.appendChild(node.cloneNode(true))
      }
    })
  }, [html])

  return (
    <div
      ref={containerRef}
      className={cn(
        'hubspot-form-embed [&_.hs-form-frame]:w-full [&_iframe]:w-full [&_iframe]:border-0',
        className,
      )}
    />
  )
}
