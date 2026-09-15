import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, CheckCircle, Droplet, AlertTriangle } from 'lucide-react'
import Button from '../../shared/components/Button'
import { analyzeROI, validateImageQuality, type ColorimetryResult, type ImageQualityReport } from './ColorimetryEngine'
import { estimateHemoglobin, extractConjunctivaFeatures, type HemoglobinEstimate } from './HemoglobinEstimator'
import { supabase } from '../../core/supabase'
import { useAuth } from '../../core/auth/AuthContext'
import { motion } from 'framer-motion'
import { log } from '../../core/logger'
import { useVisionInput } from './hooks/useVisionInput'
import { VisionInputStage } from './components/VisionInputStage'

export default function AnemiaScreeningPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  
  const { state: visionState, setMode, startLiveScan, captureLiveFrame, handleFileUpload, triggerFilePicker, videoRef, fileInputRef, cleanup } = useVisionInput('LIVE')

  const [result, setResult] = useState<ColorimetryResult | null>(null)
  const [hbEstimate, setHbEstimate] = useState<HemoglobinEstimate | null>(null)
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

        // We assume center ROI for both Live and Upload for now.
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2 + (canvas.height * 0.1)
        const radius = Math.min(canvas.width, canvas.height) * 0.05

        const colorData = analyzeROI(imageData, centerX, centerY, radius)
        const conjFeatures = extractConjunctivaFeatures(imageData, centerX, centerY, radius)
        const hbData = estimateHemoglobin(colorData, conjFeatures)
        
        setResult(colorData)
        setHbEstimate(hbData)
      } catch (e) {
        log.error('Anemia Processing', 'Failed', e)
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
    if (!session || !result || !qualityReport?.isSufficient || !hbEstimate) return
    setSaving(true)
    try {
      const { error: dbError } = await supabase.from('health_measurements').insert([{
        user_id: session.user.id,
        measurement_type: 'estimated_hemoglobin',
        value_numeric: hbEstimate.estimatedHb,
        unit: hbEstimate.unit,
        quality: qualityReport.isSufficient ? 'GOOD' : 'POOR',
        status: 'SAVED',
        metadata: {
          colorimetry: result,
          quality: qualityReport,
          model_info: hbEstimate.modelInfo,
          uncertainty: hbEstimate.uncertainty,
          screening_signal: hbEstimate.screeningSignal
        }
      }] as any)
      
      if (dbError) throw dbError
      setSaved(true)
    } catch (e) {
      log.error('DB', 'Failed to save hemoglobin measurement', e)
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setResult(null)
    setHbEstimate(null)
    setQualityReport(null)
    setSaved(false)
    if (visionState.mode === 'LIVE') {
      startLiveScan('user')
    } else {
      setMode('UPLOAD') // reset upload state
    }
  }

  const isResultReady = result && hbEstimate

  return (
    <div className="min-h-full bg-mineral-black text-stone flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-4 border-b border-white/5 bg-mineral-black z-10 relative flex-shrink-0">
        <button onClick={() => { cleanup(); navigate(-1); }} className="text-muted-slate hover:text-stone transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-warm-pearl font-semibold text-lg leading-tight">Anemia Screening</h1>
          <p className="text-stone text-[10px] font-mono tracking-wide text-signal-amber">EXPERIMENTAL MODULE</p>
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
             guidanceText="Gently expose your lower eyelid and align it within the frame."
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
            <div className="w-full bg-raised-graphite rounded-xl p-4 mb-6 text-left border border-white/5 text-sm">
                <p className="text-muted-slate mb-2">Quality Gate Report:</p>
                <div className="space-y-1 font-mono">
                  <div className="flex justify-between"><span>Brightness:</span> <span className={qualityReport.brightness >= 60 ? 'text-signal-teal' : 'text-emergency-red'}>{Math.round(qualityReport.brightness)}</span></div>
                  <div className="flex justify-between"><span>Contrast:</span> <span className={qualityReport.contrast >= 20 ? 'text-signal-teal' : 'text-emergency-red'}>{Math.round(qualityReport.contrast)}</span></div>
                </div>
            </div>
          </div>
        )}

        {isResultReady && qualityReport && qualityReport.isSufficient && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col pb-6">
            <div className="bg-material-glass rounded-2xl p-6 mb-4 shadow-xl border border-white/5 flex-1 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-2xl" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-warm-pearl font-medium tracking-wide text-sm">ANEMIA SCREENING</h2>
                  <p className="text-[10px] text-signal-amber font-mono tracking-widest mt-1">EXPERIMENTAL</p>
                </div>
                <div className="bg-signal-teal/20 text-signal-teal px-2 py-1 rounded text-[10px] font-mono border border-signal-teal/30">GOOD IMAGE</div>
              </div>

              {/* ESTIMATED HEMOGLOBIN */}
              <motion.div 
                initial="hidden" 
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
                }}
                className="mb-8 border-b border-white/5 pb-8"
              >
                <motion.p variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="text-muted-slate text-xs uppercase tracking-widest mb-2">Estimated Hemoglobin</motion.p>
                
                {hbEstimate.estimatedHb !== null ? (
                  <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }} className="mb-6">
                    <div className="flex items-end gap-2 mb-4">
                      <p className={`text-6xl font-light tracking-tight ${hbEstimate.screeningSignal === 'POSSIBLE_LOW_HB' ? 'text-emergency-red drop-shadow-[0_0_15px_rgba(216,90,82,0.4)]' : 'text-warm-pearl drop-shadow-[0_0_15px_rgba(245,242,234,0.3)]'}`}>
                        {hbEstimate.estimatedHb.toFixed(1)}
                      </p>
                      <p className="text-muted-slate text-sm mb-3 font-mono">{hbEstimate.unit}</p>
                    </div>

                    {/* Visual Gauge */}
                    <div className="w-full h-1.5 bg-mineral-black/50 rounded-full overflow-hidden relative border border-white/5">
                       {/* Gradient scale background */}
                       <div className="absolute inset-0 bg-gradient-to-r from-emergency-red via-signal-amber to-signal-teal opacity-30" />
                       {/* Indicator dot */}
                       <motion.div 
                         initial={{ left: '0%' }}
                         animate={{ left: `${Math.min(Math.max((hbEstimate.estimatedHb - 8) / (16 - 8) * 100, 0), 100)}%` }}
                         transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                         className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] -ml-1.5"
                       />
                    </div>
                    <div className="flex justify-between text-[8px] text-muted-slate font-mono uppercase mt-1">
                      <span>Low (8.0)</span>
                      <span>High (16.0)</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-stone">Hemoglobin estimation model could not produce a result for this image.</p>
                  </div>
                )}

                {hbEstimate.estimatedHb !== null && (
                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium ${
                    hbEstimate.screeningSignal === 'POSSIBLE_LOW_HB' ? 'bg-emergency-red/20 text-emergency-red border border-emergency-red/30' :
                    hbEstimate.screeningSignal === 'LOWER_ESTIMATE' ? 'bg-signal-amber/20 text-signal-amber border border-signal-amber/30' :
                    'bg-signal-teal/20 text-signal-teal border border-signal-teal/30'
                  }`}>
                    {hbEstimate.screeningSignal === 'POSSIBLE_LOW_HB' ? 'Camera estimate suggests possible low hemoglobin.' :
                     hbEstimate.screeningSignal === 'LOWER_ESTIMATE' ? 'Camera estimate is in the lower range. Consider laboratory confirmation.' :
                     'Camera estimate is within expected range.'}
                  </motion.div>
                )}
              </motion.div>

              {/* MODEL PROVENANCE PANEL */}
              <div className="mb-8 border-b border-white/5 pb-8">
                <p className="text-muted-slate text-xs uppercase tracking-widest mb-3">Model Provenance</p>
                <div className="bg-mineral-black/30 rounded-xl p-3 border border-white/5 space-y-2 text-[10px] font-mono text-muted-slate">
                  <div className="flex justify-between">
                    <span className="text-stone">Model</span>
                    <span>{hbEstimate.modelInfo.name} v{hbEstimate.modelInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone">Method</span>
                    <span>{hbEstimate.provenance.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone">Training Data</span>
                    <span>DOI: {hbEstimate.provenance.datasetDoi} (n={hbEstimate.provenance.validation.n})</span>
                  </div>
                  {hbEstimate.provenance.features && Object.keys(hbEstimate.provenance.features).length > 0 && (
                    <div className="pt-2 mt-2 border-t border-white/5">
                      <span className="text-stone block mb-1">Extracted Features:</span>
                      {Object.entries(hbEstimate.provenance.features).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-mineral-black/50 rounded-xl p-4 border border-white/5 flex gap-3">
                 <AlertTriangle size={16} className="text-signal-amber flex-shrink-0" />
                 <p className="text-[11px] text-muted-slate leading-relaxed">
                   <strong>Awareness/screening only.</strong> Experimental camera-based estimate. Not a laboratory measurement.
                   Confirm with a CBC or laboratory hemoglobin test.
                 </p>
              </div>
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
                disabled={saving || saved || hbEstimate.estimatedHb === null}
              >
                {saved ? 'SAVED' : saving ? 'SAVING...' : 'SAVE'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
