import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, Play, Square, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FaceMeshExtractor } from '../bio-aura/rppg/FaceMeshExtractor'
import { processRppgBuffer, type RppgSample, type RppgResult, type PipelineDiagnostics } from '../bio-aura/rppg/rppgEngine'
import { extractPulseTouchRgb, processPulseTouchBuffer } from '../bio-aura/camera/PulseTouchEngine'
import { LiveSignalGraph } from '../../shared/components/LiveSignalGraph'

interface SessionRecord {
  timestamp: number
  result: RppgResult
}

type LabMode = 'rppg' | 'contact_ppg'

export default function SignalLabPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<LabMode>('rppg')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<RppgResult | null>(null)
  const [sessionLog, setSessionLog] = useState<SessionRecord[]>([])

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const bufferRef = useRef<RppgSample[]>([])
  const extractorRef = useRef<FaceMeshExtractor | null>(null)

  const cleanup = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0]
      if (track && mode === 'contact_ppg') {
        try { (track as any).applyConstraints({ advanced: [{ torch: false }] }).catch(() => {}) } catch {}
      }
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [mode])

  useEffect(() => { return cleanup }, [cleanup])

  const start = useCallback(async () => {
    cleanup()
    bufferRef.current = []
    setResult(null)

    const facingMode = mode === 'rppg' ? 'user' : 'environment'
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, min: 15 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }

      if (mode === 'contact_ppg') {
        const mainTrack = stream.getVideoTracks()[0]
        const caps = mainTrack.getCapabilities?.()
        if (caps && (caps as any).torch) {
          try { await (mainTrack as any).applyConstraints({ advanced: [{ torch: true }] }) } catch {}
        }
      }

      if (mode === 'rppg' && !extractorRef.current) {
        const ext = new FaceMeshExtractor()
        await ext.initialize()
        extractorRef.current = ext
      }

      setIsRunning(true)
      loop()
    } catch (err) {
      console.error('Signal Lab camera error:', err)
    }
  }, [cleanup, mode])

  const stop = useCallback(() => {
    cleanup()
    setIsRunning(false)
  }, [cleanup])

  const loop = () => {
    if (!videoRef.current || !canvasRef.current) return

    const now = Date.now()
    let sample: RppgSample | null = null

    if (mode === 'rppg' && extractorRef.current?.isReady()) {
      const res = extractorRef.current.extractROIs(videoRef.current, canvasRef.current, now)
      if (res && res.faceDetected) {
        sample = { timestamp: now, motionScore: res.motion, faceDetected: true, patches: res.patches }
      }
    } else if (mode === 'contact_ppg') {
      sample = extractPulseTouchRgb(videoRef.current, canvasRef.current, now)
    }

    if (sample) {
      bufferRef.current.push(sample)
      const cutoff = now - 15000
      bufferRef.current = bufferRef.current.filter(s => s.timestamp >= cutoff)
    }

    if (bufferRef.current.length > 30 && bufferRef.current.length % 5 === 0) {
      const r = mode === 'rppg' ? processRppgBuffer(bufferRef.current) : processPulseTouchBuffer(bufferRef.current)
      setResult(r)
      setSessionLog(prev => [...prev, { timestamp: now, result: r }])
    }

    rafRef.current = requestAnimationFrame(loop)
  }

  const exportSession = () => {
    const blob = new Blob([JSON.stringify(sessionLog, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `signal_lab_${mode}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const d = result?.diagnostics
  const fmt = (v: number | null | undefined, dp = 2) => v != null ? v.toFixed(dp) : '--'

  return (
    <div className="min-h-full bg-mineral-black text-stone flex flex-col pb-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-3 bg-mineral-black z-10 border-b border-white/5">
        <button onClick={() => { stop(); navigate(-1) }} className="text-muted-slate"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="text-warm-pearl font-semibold text-base">Signal Lab</h1>
          <p className="text-[9px] font-mono text-signal-teal tracking-widest">PIPELINE DIAGNOSTICS</p>
        </div>
        <button onClick={exportSession} disabled={sessionLog.length === 0} className="text-muted-slate hover:text-warm-pearl disabled:opacity-30">
          <Download size={16} />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 px-4 py-3">
        {(['rppg', 'contact_ppg'] as LabMode[]).map(m => (
          <button key={m} onClick={() => { stop(); setMode(m) }}
            className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${mode === m ? 'bg-signal-teal/20 text-signal-teal border border-signal-teal/30' : 'bg-white/5 text-muted-slate border border-white/5'}`}>
            {m === 'rppg' ? 'Bio-Aura (rPPG)' : 'Pulse Touch (cPPG)'}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2 px-4 mb-3">
        <button onClick={isRunning ? stop : start}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider ${isRunning ? 'bg-emergency-red/20 text-emergency-red border border-emergency-red/30' : 'bg-signal-teal/20 text-signal-teal border border-signal-teal/30'}`}>
          {isRunning ? <><Square size={12} /> Stop</> : <><Play size={12} /> Start</>}
        </button>
        {sessionLog.length > 0 && (
          <span className="text-[10px] text-muted-slate font-mono self-center">{sessionLog.length} samples</span>
        )}
      </div>

      {/* Video + Canvas */}
      <div className="px-4 mb-3">
        <div className="relative bg-black rounded-xl overflow-hidden h-40 border border-white/5">
          <video ref={videoRef} className={`w-full h-full object-cover ${mode === 'rppg' ? '-scale-x-100' : ''}`} playsInline muted disablePictureInPicture />
          <canvas ref={canvasRef} className="hidden" />
          {!isRunning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <p className="text-muted-slate text-xs font-mono">Camera inactive</p>
            </div>
          )}
        </div>
      </div>

      {/* Waveform */}
      {result && (
        <div className="px-4 mb-3">
          <p className="text-[9px] text-muted-slate font-mono mb-1 uppercase tracking-wider">Filtered PPG Waveform</p>
          <div className="h-14 bg-deep-graphite rounded-lg border border-white/5 overflow-hidden">
            <LiveSignalGraph waveform={result.waveform} color="#57B9A7" height={56} />
          </div>
        </div>
      )}

      {/* Diagnostics Grid */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {/* CAMERA */}
        <DiagSection title="CAMERA" color="teal">
          <DRow label="FPS" value={fmt(result?.samplingRate, 1)} />
          <DRow label="Frames" value={result?.frameCount ?? '--'} />
          <DRow label="Duration" value={`${fmt(result?.durationSeconds, 1)}s`} />
          <DRow label="Frame Jitter" value={d ? `${fmt(d.camera.jitter, 1)}ms` : '--'} />
          <DRow label="Algorithm" value={result?.algorithmVersion ?? '--'} />
        </DiagSection>

        {/* ROI */}
        <DiagSection title="ROI" color="teal">
          <DRow label="Patch Count" value={d?.roi.patchCount ?? '--'} />
          <DRow label="Patches" value={d?.roi.patchIds.join(', ') ?? '--'} />
          {d && Object.entries(d.roi.validPixelsPerPatch).map(([k, v]) => (
            <DRow key={k} label={`${k} pixels`} value={v} />
          ))}
        </DiagSection>

        {/* SIGNAL */}
        <DiagSection title="SIGNAL" color="amber">
          <DRow label="SNR" value={d ? `${fmt(d.signal.snr, 1)} dB` : '--'} status={d && d.signal.snr > 3 ? 'good' : 'warn'} />
          <DRow label="AC/DC Ratio" value={fmt(d?.signal.acDcRatio, 4)} />
          <DRow label="Illumination Mean" value={fmt(d?.signal.illuminationMean, 1)} />
          <DRow label="Illumination Std" value={fmt(d?.signal.illuminationStd, 2)} />
          <DRow label="R Mean" value={fmt(d?.signal.rgbMeans.r, 1)} />
          <DRow label="G Mean" value={fmt(d?.signal.rgbMeans.g, 1)} />
          <DRow label="B Mean" value={fmt(d?.signal.rgbMeans.b, 1)} />
          <DRow label="R Var" value={fmt(d?.signal.rgbVariances.r, 2)} />
          <DRow label="G Var" value={fmt(d?.signal.rgbVariances.g, 2)} />
          <DRow label="B Var" value={fmt(d?.signal.rgbVariances.b, 2)} />
          <DRow label="Motion" value={fmt(result?.motionScore, 3)} />
          <DRow label="Signal Amplitude" value={fmt(result?.signalAmplitude, 3)} />
        </DiagSection>

        {/* PROCESSING */}
        <DiagSection title="PROCESSING" color="teal">
          <DRow label="POS Quality" value={fmt(d?.processing.posQuality, 3)} />
          <DRow label="POS BPM" value={d?.processing.posBpm ? fmt(d.processing.posBpm, 1) : '--'} />
          <DRow label="CHROM Quality" value={fmt(d?.processing.chromQuality, 3)} />
          <DRow label="CHROM BPM" value={d?.processing.chromBpm ? fmt(d.processing.chromBpm, 1) : '--'} />
          <DRow label="Selected" value={d ? `${d.processing.selectedAlgorithm} / ${d.processing.selectedPatch}` : '--'} />
          <DRow label="PSD Peak" value={fmt(d?.processing.psdPeakProminence, 3)} />
          <DRow label="Spectral Concentration" value={fmt(d?.processing.spectralConcentration, 3)} />
          <DRow label="Window Length" value={d?.processing.windowLength ?? '--'} />
          <DRow label="Peak-to-Peak BPM" value={result?.peakToPeakBpm ? fmt(result.peakToPeakBpm, 0) : '--'} />
        </DiagSection>

        {/* QUALITY */}
        <DiagSection title="QUALITY" color={result?.quality === 'GOOD' || result?.quality === 'EXCELLENT' ? 'teal' : result?.quality === 'FAIR' ? 'amber' : 'red'}>
          <DRow label="Quality Score" value={fmt(d?.quality.score, 3)} status={d && d.quality.score > 0.3 ? 'good' : d && d.quality.score > 0.1 ? 'warn' : 'error'} />
          <DRow label="Quality Label" value={result?.quality ?? '--'} />
          <DRow label="Confidence" value={fmt(result?.confidence, 3)} />
          <DRow label="Candidate BPM" value={result?.bpm ? `${result.bpm}` : '--'} status={result?.bpm ? 'good' : 'error'} />
          <DRow label="Dominant Freq" value={result?.dominantFrequency ? `${fmt(result.dominantFrequency, 2)} Hz` : '--'} />
          <DRow label="Rejected Stage" value={d?.quality.firstRejectedStage ?? 'none'} status={d?.quality.firstRejectedStage ? 'error' : 'good'} />
          <DRow label="Rejection Reason" value={d?.quality.rejectionReason ?? 'none'} />
          <DRow label="Failure Reason" value={result?.reason ?? 'none'} status={result?.reason ? 'error' : 'good'} />
        </DiagSection>
      </div>
    </div>
  )
}

function DiagSection({ title, color, children }: { title: string; color: 'teal' | 'amber' | 'red'; children: React.ReactNode }) {
  const borderMap = { teal: 'border-signal-teal/20', amber: 'border-signal-amber/20', red: 'border-emergency-red/20' }
  const labelMap = { teal: 'text-signal-teal', amber: 'text-signal-amber', red: 'text-emergency-red' }
  return (
    <div className={`bg-deep-graphite rounded-xl border ${borderMap[color]} p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <Zap size={10} className={labelMap[color]} />
        <span className={`text-[9px] font-mono uppercase tracking-widest ${labelMap[color]}`}>{title}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function DRow({ label, value, status }: { label: string; value: string | number; status?: 'good' | 'warn' | 'error' }) {
  const statusColor = status === 'good' ? 'text-signal-teal' : status === 'warn' ? 'text-signal-amber' : status === 'error' ? 'text-emergency-red' : 'text-warm-pearl'
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-muted-slate font-mono">{label}</span>
      <span className={`text-[10px] font-mono ${statusColor}`}>{value}</span>
    </div>
  )
}
