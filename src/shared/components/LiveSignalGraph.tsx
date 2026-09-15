import { useEffect, useRef } from 'react'

interface LiveSignalGraphProps {
  waveform: number[]
  color?: string
  width?: number | string
  height?: number
  label?: string
}

export function LiveSignalGraph({ 
  waveform, 
  color = '#53B7A8', // signal-teal
  width = '100%', 
  height = 64,
  label
}: LiveSignalGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Setup High DPI canvas
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, rect.width, rect.height)

    if (!waveform || waveform.length === 0) {
      // Draw flatline
      ctx.beginPath()
      ctx.strokeStyle = '#475357' // muted-slate
      ctx.lineWidth = 1.5
      ctx.moveTo(0, rect.height / 2)
      ctx.lineTo(rect.width, rect.height / 2)
      ctx.stroke()
      return
    }

    // Auto-scale waveform
    let min = Math.min(...waveform)
    let max = Math.max(...waveform)
    
    // Prevent division by zero if flat
    if (max - min < 0.001) {
      min = -1
      max = 1
    }

    const range = max - min
    const padding = rect.height * 0.1
    const drawHeight = rect.height - padding * 2
    
    const stepX = rect.width / (waveform.length - 1)

    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    
    for (let i = 0; i < waveform.length; i++) {
      const normalizedY = (waveform[i] - min) / range // 0 to 1
      const y = padding + (1 - normalizedY) * drawHeight // Flip Y so max is top
      const x = i * stepX
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        // Simple smoothing curve
        const prevX = (i - 1) * stepX
        const prevY = padding + (1 - ((waveform[i - 1] - min) / range)) * drawHeight
        const cpX = prevX + (x - prevX) / 2
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)
      }
    }
    
    ctx.stroke()

  }, [waveform, color, height])

  return (
    <div className="relative w-full" style={{ height }}>
      {label && (
        <div className="absolute top-0 left-0 text-[10px] uppercase font-mono text-muted-slate z-10 bg-deep-graphite/50 px-1 rounded">
          {label}
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        style={{ width, height: `${height}px` }} 
        className="w-full"
      />
    </div>
  )
}
