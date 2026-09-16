import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, CheckCircle, Eye, AlertTriangle } from 'lucide-react'
import Button from '../../shared/components/Button'
import { analyzeROI, validateImageQuality, type ColorimetryResult, type ImageQualityReport } from './ColorimetryEngine'
import { estimateJaundice, type JaundiceEstimate } from './JaundiceEstimator'
import { supabase } from '../../core/supabase'
import { useAuth } from '../../core/auth/AuthContext'
import { motion } from 'framer-motion'
import { log } from '../../core/logger'
import { useVisionInput } from './hooks/useVisionInput'
import { VisionInputStage } from './components/VisionInputStage'

export default function ScleraScreeningPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  
  const { state: visionState, setMode, startLiveScan, captureLiveFrame, handleFileUpload, triggerFilePicker, videoRef, fileInputRef, cleanup } = useVisionInput('LIVE')

  const [result, setResult] = useState<ColorimetryResult | null>(null)
  const [jaundiceEstimate, setJaundiceEstimate] = useState<JaundiceEstimate | null>(null)
  const [qualityReport, setQualityReport] = useState<ImageQualityReport | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Start live scan on mount
  useEffect(() => {
    startLiveScan('user')
    return cleanup
  }, [startLiveScan, cleanup])

  const processImageElement = (element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, width: number, height: number) => {
    setIsProcessing(true)
    
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) throw new Error('Could not get canvas context')
        
        ctx.drawImage(element, 0, 0, width, height)
        const imageData = ctx.getImageData(0, 0, width, height)

        // Quality Gate
        const quality = validateImageQuality(imageData)
        setQualityReport(quality)
        
        if (!quality.isSufficient) {
          setIsProcessing(false)
          return
        }

        // We assume slightly left of center ROI for both Live and Upload for now.
        const centerX = canvas.width / 2 - (canvas.width * 0.1)
        const centerY = canvas.height / 2
        const radius = Math.min(canvas.width, canvas.height) * 0.05

        const colorData = analyzeROI(imageData, centerX, centerY, radius)
        
        setResult(colorData)
        setJaundiceEstimate(estimateJaundice(colorData))
      } catch (e) {
        log.error('Sclera Processing', 'Failed', e)
      } finally {
        setIsProcessing(false)
        cleanup() // Stop camera after processing
      }
    }, 1200)
  }

  const handleCaptureLive = () => {
    if (visionState.mode === 'LIVE') {
      const canvas = captureLiveFrame()
      if (canvas) {
        processImageElement(canvas, canvas.width, canvas.height)
      }
    } else if (visionState.mode === 'UPLOAD' && visionState.imageElement) {
      const img = visionState.imageElement as HTMLImageElement
      processImageElement(img, img.naturalWidth || img.width, img.naturalHeight || img.height)
    }
  }

  const handleSave = async () => {
    if (!session || !result || !qualityReport?.isSufficient) return
    setSaving(true)
    try {
      const { error: dbError } = await supabase.from('health_measurements').insert([{
        user_id: session.user.id,
        measurement_type: 'yellowness_index',
        value_numeric: result.yellownessIndex,
        quality: qualityReport.isSufficient ? 'GOOD' : 'POOR',
        status: 'SAVED',
        metadata: {
          colorimetry: result,
          quality: qualityReport
        }
      }] as any)
      
      if (dbError) throw dbError
      setSaved(true)
    } catch (e) {
      log.error('DB', 'Failed to save YI measurement', e)
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setResult(null)
    setQualityReport(null)
    setSaved(false)
    if (visionState.mode === 'LIVE') {
      startLiveScan('user')
    } else {
      setMode('UPLOAD') // reset upload state
    }
  }

  const isResultReady = !!result

  return (
    <div className="min-h-full bg-mineral-black text-muted flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-4 border-b border-[var(--glass-border)] bg-mineral-black z-10 relative flex-shrink-0">
        <button onClick={() => { cleanup(); navigate(-1); }} className="text-muted-slate hover:text-muted transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-warm-pearl font-semibold text-lg leading-tight">Sclera Screening</h1>
          <p className="text-muted text-[10px] font-mono tracking-wide text-signal-teal">EXPERIMENTAL MODULE</p>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col p-5 overflow-y-auto">
        {!isResultReady && (
           <VisionInputStage
             state={visionState}
             onModeChange={(m) => {
               if (m === 'LIVE') startLiveScan('user')
               else setMode('UPLOAD')
             }}
             onCaptureLive={handleCaptureLive}
             onFileUpload={handleFileUpload}
             triggerFilePicker={triggerFilePicker}
             videoRef={videoRef}
             fileInputRef={fileInputRef}
             guidanceText="Open your eye wide to expose the sclera."
             isProcessing={isProcessing}
           />
        )}
        
        {qualityReport && !qualityReport.isSufficient && !isProcessing && !isResultReady && (
          <div className="mt-6">
            <div className="bg-emergency-red/10 border border-emergency-red/20 rounded-2xl p-6 flex flex-col items-center gap-3 mb-6 w-full text-center">
              <AlertTriangle size={32} className="text-emergency-red" />
              <p className="text-warm-pearl font-medium">Image Quality Insufficient</p>
              <p className="text-emergency-red/80 text-sm">Please ensure neutral lighting and a clear, steady image.</p>
            </div>
            <div className="w-full bg-raised-graphite rounded-xl p-4 mb-6 text-left border border-[var(--glass-border)] text-sm">
                <p className="text-muted-slate mb-2">Quality Gate Report:</p>
                <div className="space-y-1 font-mono">
                  <div className="flex justify-between"><span>Brightness:</span> <span className={qualityReport.brightness >= 60 ? 'text-signal-teal' : 'text-emergency-red'}>{Math.round(qualityReport.brightness)}</span></div>
                  <div className="flex justify-between"><span>Contrast:</span> <span className={qualityReport.contrast >= 20 ? 'text-signal-teal' : 'text-emergency-red'}>{Math.round(qualityReport.contrast)}</span></div>
                </div>
            </div>
          </div>
        )}

        {isResultReady && qualityReport && qualityReport.isSufficient && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
            <div className="bg-raised-graphite rounded-2xl p-6 mb-4 shadow-xl border border-[var(--glass-border)] flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-warm-pearl font-medium tracking-wide text-sm">SCLERA SCREENING</h2>
                <div className="bg-signal-teal/20 text-signal-teal px-2 py-1 rounded text-[10px] font-mono border border-signal-teal/30">GOOD IMAGE</div>
              </div>

              <motion.div 
                initial="hidden" 
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
                }}
              >
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }} className="mb-8">
                  <p className="text-muted-slate text-xs uppercase tracking-widest mb-1">Elevated Bilirubin Probability</p>
                  <p className={`text-6xl font-light mb-4 ${jaundiceEstimate?.screeningSignal === 'POSSIBLE_ELEVATED_BILIRUBIN' ? 'text-emergency-red drop-shadow-[0_0_15px_rgba(216,90,82,0.4)]' : 'text-warm-pearl drop-shadow-[0_0_15px_rgba(245,242,234,0.3)]'}`}>
                    {jaundiceEstimate ? (jaundiceEstimate.estimatedProbability * 100).toFixed(1) + '%' : '--'}
                  </p>

                  {/* Visual Gauge */}
                  {jaundiceEstimate && (
                    <div className="w-full h-1.5 bg-mineral-black/50 rounded-full overflow-hidden relative border border-[var(--glass-border)] mb-1">
                       <div className="absolute inset-0 bg-gradient-to-r from-signal-teal via-signal-amber to-emergency-red opacity-30" />
                       <motion.div 
                         initial={{ left: '0%' }}
                         animate={{ left: `${jaundiceEstimate.estimatedProbability * 100}%` }}
                         transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                         className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] -ml-1.5"
                       />
                    </div>
                  )}
                  <div className="flex justify-between text-[8px] text-muted-slate font-mono uppercase mt-1">
                    <span>Low Risk</span>
                    <span>High Risk</span>
                  </div>
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <p className="text-muted-slate text-[10px] uppercase tracking-widest mb-1">b* Value</p>
                    <p className="text-xl text-warm-pearl">{result.averageLab.b.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-muted-slate text-[10px] uppercase tracking-widest mb-1">L* Value</p>
                    <p className="text-xl text-warm-pearl">{result.averageLab.L.toFixed(1)}</p>
                  </div>
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className={`rounded-xl p-4 border flex gap-3 ${jaundiceEstimate?.screeningSignal === 'POSSIBLE_ELEVATED_BILIRUBIN' ? 'bg-emergency-red/10 border-emergency-red/20' : 'bg-mineral-black/50 border-[var(--glass-border)]'}`}>
                   <AlertTriangle size={16} className={jaundiceEstimate?.screeningSignal === 'POSSIBLE_ELEVATED_BILIRUBIN' ? 'text-emergency-red' : 'text-signal-amber'} />
                   <p className="text-xs text-muted-slate leading-relaxed">
                     {jaundiceEstimate?.screeningSignal === 'POSSIBLE_ELEVATED_BILIRUBIN' ? 'Elevated bilirubin detected by ML model.' : 'Bilirubin levels appear normal.'} This is an experimental optical observation and not a medical diagnosis.
                   </p>
                </motion.div>
              </motion.div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                variant="secondary"
                onClick={reset}
                className="flex-1"
                disabled={saving}
              >
                RETAKE
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                icon={saved ? <CheckCircle size={18} /> : <Save size={18} />}
                className="flex-1"
                disabled={saving || saved}
              >
                {saved ? 'SAVED' : saving ? 'SAVING...' : 'SAVE RESULT'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
