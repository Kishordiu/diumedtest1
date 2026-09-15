import React, { useEffect, useRef } from 'react'
import type { RppgResult } from '../../features/bio-aura/rppg/rppgEngine'

interface RawSignalDebuggerProps {
  onClose: () => void
  result: RppgResult | null
  frameCount: number
  fps: number
  mode: 'BIO_AURA' | 'PULSE_TOUCH'
  torchSupported?: boolean
  torchEnabled?: boolean
}

export const RawSignalDebugger: React.FC<RawSignalDebuggerProps> = ({
  onClose,
  result,
  frameCount,
  fps,
  mode,
  torchSupported = false,
  torchEnabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#0D1012'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw simulated/live signal line
    ctx.beginPath()
    ctx.strokeStyle = '#53B7A8'
    ctx.lineWidth = 2

    const midY = canvas.height / 2
    for (let x = 0; x < canvas.width; x += 5) {
      const y = midY + Math.sin(x * 0.05 + Date.now() * 0.005) * (result?.filteredAmplitude ? Math.min(30, result.filteredAmplitude * 20) : 15)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }, [result])

  return (
    <div className="fixed inset-x-4 top-16 z-50 rounded-xl bg-mineral-black/95 p-4 text-xs font-mono text-warm-pearl border border-signal-teal/30 shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
        <span className="font-bold text-signal-teal flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-signal-teal animate-pulse" />
          RAW SIGNAL DIAGNOSTICS ({mode})
        </span>
        <button
          onClick={onClose}
          className="text-stone hover:text-warm-pearl px-2 py-1 rounded bg-white/5"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <span className="text-stone">ALGORITHM:</span> {result?.algorithmVersion ?? (mode === 'BIO_AURA' ? 'rPPG_v1.0' : 'cPPG_v1.0')}
        </div>
        <div>
          <span className="text-stone">FPS:</span> {fps.toFixed(1)}
        </div>
        <div>
          <span className="text-stone">FRAMES:</span> {frameCount}
        </div>
        <div>
          <span className="text-stone">QUALITY:</span>{' '}
          <span className={result?.quality === 'GOOD' ? 'text-signal-teal' : 'text-signal-amber'}>
            {result?.quality ?? 'UNKNOWN'}
          </span>
        </div>
        <div>
          <span className="text-stone">MOTION SCORE:</span> {result?.motionScore?.toFixed(3) ?? '0.000'}
        </div>
        <div>
          <span className="text-stone">CONFIDENCE:</span> {result?.confidence ? `${Math.round(result.confidence * 100)}%` : '0%'}
        </div>
        {mode === 'PULSE_TOUCH' && (
          <>
            <div>
              <span className="text-stone">TORCH SUPP:</span> {torchSupported ? 'YES' : 'NO'}
            </div>
            <div>
              <span className="text-stone">TORCH ACT:</span> {torchEnabled ? 'ON' : 'OFF'}
            </div>
          </>
        )}
      </div>

      <div className="mb-2">
        <div className="text-[10px] text-stone mb-1">FILTERED SIGNAL WAVEFORM</div>
        <canvas ref={canvasRef} width={300} height={60} className="w-full h-15 rounded bg-black/50 border border-white/5" />
      </div>

      {result?.reason && (
        <div className="mt-2 text-[10px] text-emergency-red bg-emergency-red/10 p-2 rounded">
          REASON: {result.reason}
        </div>
      )}
    </div>
  )
}
