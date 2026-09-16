import React, { useEffect } from 'react'
import { ArrowLeft, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LiveSignalGraph } from '../../shared/components/LiveSignalGraph'
import { CameraLensInstrument } from '../../shared/components/CameraLensInstrument'
import { DiagnosticsPanel } from '../../shared/components/DiagnosticsPanel'
import { useMeasurementEngine } from './camera/useMeasurementEngine'
import { processRppgBuffer } from './rppg/rppgEngine'
import { FaceMeshExtractor } from './rppg/FaceMeshExtractor'
import type { FinalMeasurementResult, MeasurementPhase } from './camera/types'
import { useCallback, useRef, useState } from 'react'
import { OnboardingSheet } from '../../shared/components/OnboardingSheet'

import { AdvancedBadge } from '../../shared/components/AdvancedBadge'

export function BioAuraPage() {
  const navigate = useNavigate()
  const extractorRef = useRef<FaceMeshExtractor | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(true)
  
  const handleResultReady = (result: FinalMeasurementResult) => {
    navigate('/measurement-result/new', { state: { result }, replace: true })
  }

  const extractFrame = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement, timestamp: number) => {
    if (!extractorRef.current || !extractorRef.current.isReady()) return null;
    const result = extractorRef.current.extractROIs(video, canvas, timestamp);
    if (!result || !result.faceDetected) return null;
    return {
      timestamp,
      motionScore: result.motion,
      faceDetected: result.faceDetected,
      patches: result.patches
    };
  }, [])

  const { start, stop, progress, videoRef, canvasRef } = useMeasurementEngine({
    source: 'camera_rppg',
    facingMode: 'user',
    torch: false,
    extractFrame,
    processBuffer: processRppgBuffer,
    onResultReady: handleResultReady,
    targetWindowSeconds: 10,
    maxTimeoutSeconds: 30,
  })

  useEffect(() => {
    let active = true;
    const initExtractor = async () => {
      const ext = new FaceMeshExtractor();
      await ext.initialize();
      if (active) {
        extractorRef.current = ext;
      }
    };
    initExtractor();
    return () => { active = false; }
  }, [])

  useEffect(() => {
    if (!showOnboarding && extractorRef.current) {
      start();
    }
    return () => stop();
  }, [showOnboarding, start, stop])

  const renderGuidanceMessage = (phase: MeasurementPhase) => {
    switch (phase) {
      case 'IDLE':
      case 'PREPARING': return { title: 'Preparing Sensor', text: 'Warming up the camera' }
      case 'PERMISSION': return { title: 'Camera Access', text: 'Allow camera to begin' }
      case 'CAMERA_READY':
      case 'GUIDANCE': return { title: 'Face the Camera', text: 'Keep your face in the center frame' }
      case 'READY': return { title: 'Face Detected', text: 'Hold still...' }
      case 'CAPTURING': return { title: 'Finding Your Signal', text: 'Acquiring optical pulse' }
      case 'SIGNAL_DETECTED': return { title: 'Signal Found', text: 'Hold very still' }
      case 'POOR_QUALITY': return { title: 'Adjust Position', text: 'Ensure you are in steady light' }
      case 'ANALYZING': return { title: 'Almost There', text: 'Analyzing pulse stability' }
      case 'RESULT_READY': return { title: 'Complete', text: 'Measurement finished' }
      case 'PERMISSION_DENIED': return { title: 'Permission Denied', text: 'Camera access is required.' }
      case 'CAMERA_UNAVAILABLE': return { title: 'Camera Error', text: 'Could not access the camera.' }
      case 'TIMEOUT': return { title: 'Timeout', text: 'Measurement took too long.' }
      default: return { title: 'Wait', text: 'Processing...' }
    }
  }

  const msg = renderGuidanceMessage(progress.phase)
  const isError = progress.phase === 'PERMISSION_DENIED' || progress.phase === 'CAMERA_UNAVAILABLE' || progress.phase === 'TIMEOUT' || progress.phase === 'TORCH_UNAVAILABLE'

  return (
    <div className="min-h-[100dvh] bg-base flex flex-col" style={{ paddingTop: 'var(--safe-top)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-4 relative z-10 bg-base">
        <div className="flex items-center gap-3">
          <button onClick={() => { stop(); navigate(-1); }} className="text-muted hover:text-primary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-primary font-semibold text-lg leading-tight">Bio-Aura</h1>
            <p className="text-technical text-[10px] font-mono tracking-wide text-signal-teal">FACIAL OPTICAL ESTIMATE</p>
          </div>
        </div>
        <AdvancedBadge />
      </div>

      <div className="flex-1 flex flex-col px-5 py-2 overflow-y-auto app-content-safe no-scrollbar">
        
        {/* Face Sensor UI */}
        <CameraLensInstrument 
          phase={progress.phase}
          shape="rect"
          overlay={
            <>
              {isError && (
                <div className="absolute inset-0 bg-base/90 rounded-3xl flex flex-col items-center justify-center p-4 text-center z-20 backdrop-blur-md">
                  <Info size={28} className="text-emergency-red mb-3" />
                  <p className="text-primary font-medium text-sm mb-2">{msg.title}</p>
                  <p className="text-muted text-xs mb-4">{msg.text}</p>
                  <button onClick={start} className="text-[10px] font-semibold text-primary uppercase tracking-wider bg-[var(--glass-surface)] px-4 py-2 rounded-full hover:bg-[var(--glass-surface)] pointer-events-auto">
                    Retry
                  </button>
                </div>
              )}
              {progress.phase === 'GUIDANCE' && (
                <div className="w-24 h-32 border-2 border-[var(--glass-border)] rounded-full animate-pulse flex items-center justify-center">
                  <div className="text-[10px] text-muted tracking-wider">FACE</div>
                </div>
              )}
            </>
          }
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover -scale-x-100" // mirror front camera
            playsInline
            muted
            disablePictureInPicture
          />
          <canvas ref={canvasRef} className="hidden" />
        </CameraLensInstrument>

        <div className="flex flex-col items-center mb-8 mt-2">
           <h2 className="text-lg text-primary font-medium mb-1">{msg.title}</h2>
           <p className="text-sm text-muted">{msg.text}</p>
           {progress.elapsedSeconds > 0 && !isError && (
             <div className="mt-4 bg-[var(--glass-surface)] border border-[var(--glass-border)] backdrop-blur-sm rounded-full px-4 py-1.5 text-xs text-primary font-mono">
               {progress.elapsedSeconds.toFixed(1)}s / {progress.targetWindowSeconds}s
             </div>
           )}
        </div>

        {/* Live Data Instrument */}
        <div className="bg-instrument rounded-3xl p-5 w-full border border-[var(--glass-border)] shadow-[var(--shadow-subtle)] mt-auto">
           <div className="flex justify-between items-end mb-5">
             <div>
               <p className="text-[10px] text-technical uppercase tracking-wider mb-1.5">Optical Signal</p>
               <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${(progress.signalQuality === 'GOOD' || progress.signalQuality === 'EXCELLENT') ? 'bg-signal-teal shadow-[0_0_8px_rgba(87,185,167,0.8)]' : progress.signalQuality === 'FAIR' ? 'bg-signal-amber' : 'bg-emergency-red'}`} />
                 <p className="text-xs text-primary font-medium">
                   {progress.signalQuality}
                 </p>
               </div>
             </div>
             
             <div className="text-right">
                <p className="text-[10px] text-technical uppercase tracking-wider mb-1">Estimate</p>
                {progress.candidateBPM ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl text-primary font-light">{Math.round(progress.candidateBPM)}</span>
                    <span className="text-xs text-muted">BPM</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted">--</span>
                )}
             </div>
           </div>

           <div className="h-16 bg-base rounded-xl overflow-hidden relative border border-[var(--glass-border)] shadow-inner">
             <LiveSignalGraph waveform={progress.waveformBuffer} color="var(--color-signal-teal)" height={64} />
             {(progress.phase === 'CAPTURING' || progress.phase === 'SIGNAL_DETECTED' || progress.phase === 'ANALYZING') && (
                <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-r from-transparent to-base pointer-events-none" />
             )}
           </div>
        </div>
      </div>

      <DiagnosticsPanel
        title="Bio Aura"
        metrics={[
          { label: 'Phase', value: progress.phase },
          { label: 'FPS', value: progress.samplingRate.toFixed(1) },
          { label: 'Frames', value: progress.framesCaptured },
          { label: 'Signal Quality', value: progress.signalQuality, status: progress.signalQuality === 'GOOD' ? 'good' : 'warn' },
          { label: 'Amplitude', value: progress.signalAmplitude.toFixed(2) },
          { label: 'Candidate BPM', value: progress.candidateBPM ? progress.candidateBPM.toFixed(1) : '--' },
          { label: 'Stable BPM', value: progress.stableCandidateBPM ? progress.stableCandidateBPM.toFixed(1) : '--', status: progress.stableCandidateBPM ? 'good' : 'neutral' },
          { label: 'Reason', value: progress.reason || 'N/A', status: progress.reason ? 'error' : 'neutral' },
        ]}
        rawSignal={progress.rawSignal}
        filteredSignal={progress.waveformBuffer}
      />
      
      <OnboardingSheet
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        title="Bio-Aura"
        subtitle="See how it works"
        ctaText="Got it"
        steps={[
          { number: 1, text: "Your camera observes tiny changes in facial color." },
          { number: 2, text: "We isolate your skin region." },
          { number: 3, text: "We analyze the optical signal over several seconds." },
          { number: 4, text: "A stable estimate is shown only when the signal is good enough." }
        ]}
      />
    </div>
  )
}

function CameraFrame({ phase }: { phase: MeasurementPhase }) {
  const isTracking = phase === 'CAPTURING' || phase === 'SIGNAL_DETECTED' || phase === 'ANALYZING'
  
  return (
    <div className="relative w-32 h-40 flex items-center justify-center">
      {/* Target Bracket */}
      <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 transition-colors duration-500 ${isTracking ? 'border-signal-teal' : 'border-white/30'}`} />
      <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 transition-colors duration-500 ${isTracking ? 'border-signal-teal' : 'border-white/30'}`} />
      <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 transition-colors duration-500 ${isTracking ? 'border-signal-teal' : 'border-white/30'}`} />
      <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 transition-colors duration-500 ${isTracking ? 'border-signal-teal' : 'border-white/30'}`} />
    </div>
  )
}
