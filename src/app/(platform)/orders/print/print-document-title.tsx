'use client'

import { useEffect } from 'react'

/** Sets document.title so Print / Save as PDF uses a meaningful default filename. */
export function PrintDocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])

  return null
}
