'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface WavyLinesCanvasProps {
  className?: string
}

export function WavyLinesCanvas({ className }: WavyLinesCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    container.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let time = 0
    let frameId = 0
    let cssWidth = 0
    let cssHeight = 0

    function resize() {
      cssWidth = container!.offsetWidth
      cssHeight = container!.offsetHeight
      const dpr = window.devicePixelRatio || 1
      w = canvas.width = Math.max(1, Math.floor(cssWidth * dpr))
      h = canvas.height = Math.max(1, Math.floor(cssHeight * dpr))
      ctx!.setTransform(1, 0, 0, 1, 0, 0)
      ctx!.scale(dpr, dpr)
    }

    function draw() {
      time += 0.003
      ctx!.clearRect(0, 0, w, h)

      const lines = 80
      const spacing = 7
      ctx!.lineWidth = 0.6

      for (let i = 0; i < lines; i++) {
        const progress = i / lines
        ctx!.beginPath()

        for (let x = -100; x <= cssWidth + 100; x += 6) {
          const wave1 = Math.sin(x * 0.004 + time * 1.5 + progress * 8) * 70
          const wave2 = Math.cos(x * 0.002 + time + progress * 10) * 40
          const wave3 = Math.sin(x * 0.008 + time * 2 + progress * 3) * 15

          const y =
            cssHeight * 0.55 +
            (progress - 0.5) * spacing * lines +
            wave1 +
            wave2 +
            wave3

          if (x === -100) ctx!.moveTo(x, y)
          else ctx!.lineTo(x, y)
        }

        ctx!.strokeStyle = `rgba(255,255,255,${0.04 + progress * 0.12})`
        ctx!.stroke()
      }

      frameId = requestAnimationFrame(draw)
    }

    resize()
    draw()

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      canvas.remove()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    />
  )
}
