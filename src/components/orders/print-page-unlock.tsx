'use client'

import { useEffect } from 'react'

/** Lets order print pages scroll outside the platform shell and print across multiple pages. */
export function PrintPageUnlock() {
  useEffect(() => {
    document.documentElement.classList.add('print-route')

    const sidebar = document.querySelector('.platform-shell aside') as HTMLElement | null
    const topbar = document.querySelector('.platform-shell header') as HTMLElement | null
    const shell = document.querySelector('.platform-shell') as HTMLElement | null
    const column = shell?.querySelector(':scope > div') as HTMLElement | null
    const main = document.querySelector('.platform-shell main') as HTMLElement | null

    if (sidebar) sidebar.style.display = 'none'
    if (topbar) topbar.style.display = 'none'
    if (column) {
      column.style.width = '100%'
      column.style.maxWidth = 'none'
    }

    return () => {
      document.documentElement.classList.remove('print-route')
      if (sidebar) sidebar.style.display = ''
      if (topbar) topbar.style.display = ''
      if (column) {
        column.style.width = ''
        column.style.maxWidth = ''
      }
    }
  }, [])

  return null
}
