'use client'

import { useEffect, useRef } from 'react'
import { ElementLayer } from '@/lib/rhythmTypes'
import { synthProfiles } from '@/lib/synthProfiles'

interface VisualizerProps {
  analyser: AnalyserNode | null
  layers: ElementLayer[]
  isActive: boolean
}

export default function Visualizer({ analyser, layers, isActive }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        canvas.width = entry.contentRect.width * window.devicePixelRatio
        canvas.height = 160 * window.devicePixelRatio
        canvas.style.width = `${entry.contentRect.width}px`
        canvas.style.height = '160px'
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dataArray = new Uint8Array(analyser?.fftSize ?? 2048)

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      const W = canvas!.width
      const H = canvas!.height
      const dpr = window.devicePixelRatio || 1

      ctx!.clearRect(0, 0, W, H)
      ctx!.fillStyle = '#070707'
      ctx!.fillRect(0, 0, W, H)

      // center guide line
      ctx!.beginPath()
      ctx!.strokeStyle = '#1c1c1c'
      ctx!.lineWidth = 1
      ctx!.moveTo(0, H / 2)
      ctx!.lineTo(W, H / 2)
      ctx!.stroke()

      if (!isActive || !analyser) {
        // idle flat line
        ctx!.beginPath()
        ctx!.strokeStyle = 'rgba(212,169,106,0.25)'
        ctx!.lineWidth = 1.5
        ctx!.moveTo(0, H / 2)
        ctx!.lineTo(W, H / 2)
        ctx!.stroke()
      } else {
        analyser!.getByteTimeDomainData(dataArray)
        const sliceWidth = W / dataArray.length

        // glow pass
        ctx!.beginPath()
        ctx!.strokeStyle = 'rgba(212,169,106,0.15)'
        ctx!.lineWidth = 5 * dpr
        ctx!.lineJoin = 'round'
        let x = 0
        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * H) / 2
          if (i === 0) ctx!.moveTo(x, y)
          else ctx!.lineTo(x, y)
          x += sliceWidth
        }
        ctx!.stroke()

        // main line pass
        ctx!.beginPath()
        ctx!.strokeStyle = 'rgba(212,169,106,0.85)'
        ctx!.lineWidth = 1.5 * dpr
        ctx!.lineJoin = 'round'
        x = 0
        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * H) / 2
          if (i === 0) ctx!.moveTo(x, y)
          else ctx!.lineTo(x, y)
          x += sliceWidth
        }
        ctx!.stroke()
      }

      // breathing layer circles
      const circleY = H - 18 * dpr
      const spacing = 24 * dpr
      const startX = W / 2 - ((layers.length - 1) * spacing) / 2
      const now = Date.now()

      layers.forEach((layer, i) => {
        const profile = synthProfiles[layer.elementId]
        const pulse = 0.5 + 0.5 * Math.sin(now / 800 + i * 1.3)
        const r = (4 + pulse * 3) * dpr
        const cx = startX + i * spacing

        ctx!.beginPath()
        ctx!.arc(cx, circleY, r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(212,169,106,${0.3 + pulse * 0.4})`
        ctx!.fill()

        // element emoji label — tiny, above circle
        ctx!.font = `${9 * dpr}px sans-serif`
        ctx!.fillStyle = `rgba(212,169,106,0.5)`
        ctx!.textAlign = 'center'
        ctx!.fillText(profile.emoji, cx, circleY - r - 4 * dpr)
      })
    }

    draw()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [analyser, layers, isActive])

  return (
    <div ref={containerRef} className="w-full" style={{ height: 160 }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
