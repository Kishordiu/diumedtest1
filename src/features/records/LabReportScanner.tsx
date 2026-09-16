import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { ArrowLeft, FileText, Camera, CheckCircle, RefreshCw, Save, AlertCircle, Edit2, Trash2, AlertTriangle, Loader2, Info } from 'lucide-react'
import Button from '../../shared/components/Button'
import { supabase } from '../../core/supabase'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../core/auth/AuthContext'
import { motion } from 'framer-motion'
import { useNetworkStatus } from '../../shared/hooks/useNetworkStatus'
import { log } from '../../core/logger'

type State = 'INTRO' | 'UPLOAD' | 'SCANNING' | 'REVIEW' | 'SAVED' | 'ERROR'

interface Biomarker {
  name: string
  value: number
  unit: string
  reference_range: string
  status: string
  sourceText: string
}

interface ParsedReport {
  biomarkers: Biomarker[]
  report_date: string
  confidence: number
  extractionWarnings?: string[]
}

export default function LabReportScanner() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { t, i18n } = useTranslation()
  const isOnline = useNetworkStatus()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [state, setState] = useState<State>('INTRO')
  const [error, setError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedReport | null>(null)
  const [saving, setSaving] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  // Edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const handleNativeCamera = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      
      if (image.base64String) {
        const dataUrl = `data:image/${image.format};base64,${image.base64String}`;
        setCapturedImage(dataUrl);
        setState('SCANNING');
        
        const { data, error } = await supabase.functions.invoke('parse_lab_report', {
          body: { base64Image: dataUrl, language: i18n.language }
        });

        if (error) {
          if (error.context?.status >= 500) {
            throw new Error('The analysis service is temporarily unavailable.');
          }
          throw error;
        }

        if (!data || !data.biomarkers || data.biomarkers.length === 0) {
          throw new Error('Could not detect valid biomarkers. Please ensure it is a clear photo.');
        }

        setParsedData(data);
        setState('REVIEW');
      }
    } catch (err: any) {
      if (err.message !== 'User cancelled photos app') {
        setError(err.message || 'Camera permission denied or unavailable.');
        setState('ERROR');
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setState('SCANNING')
    setError(null)

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string
          setCapturedImage(base64Image)
          
          const { data, error } = await supabase.functions.invoke('parse_lab_report', {
            body: { base64Image, language: i18n.language }
          })

          if (error) {
            // Check if it's an HTTP 500 or 502 from our edge function
            if (error.context?.status >= 500) {
              throw new Error('The analysis service is temporarily unavailable.')
            }
            throw error
          }

          if (!data || !data.biomarkers || data.biomarkers.length === 0) {
            throw new Error('Could not detect any valid biomarkers in this image. Please ensure it is a clear photo of a lab report.')
          }

          setParsedData(data)
          setState('REVIEW')
        } catch (innerErr: any) {
          log.error('LabScanner', 'Failed to parse report', innerErr)
          setError(innerErr.message || 'An error occurred while scanning the report.')
          setState('ERROR')
        }
      }
      reader.onerror = () => {
        setError('Failed to read file.')
        setState('ERROR')
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      log.error('LabScanner', 'Unexpected setup error', err)
      setError(err.message || 'An unexpected error occurred.')
      setState('ERROR')
    }
  }

  const handleSave = async () => {
    if (!session || !parsedData) return
    setSaving(true)
    
    try {
      const groupId = crypto.randomUUID()
      
      const insertData = parsedData.biomarkers.map(b => ({
        user_id: session.user.id,
        measurement_type: b.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        value_numeric: b.value,
        unit: b.unit,
        quality: parsedData.confidence > 0.8 ? 'GOOD' : 'FAIR',
        status: 'SAVED',
        captured_at: parsedData.report_date ? new Date(parsedData.report_date).toISOString() : new Date().toISOString(),
        metadata: {
          source: 'lab_report',
          reference_range: b.reference_range,
          report_group_id: groupId,
          original_name: b.name,
          ai_confidence: parsedData.confidence,
          clinical_status: b.status,
          source_text: b.sourceText
        }
      }))

      const { error: dbError } = await supabase.from('health_measurements').insert(insertData as any)
      if (dbError) throw dbError
      
      setState('SAVED')
    } catch (err: any) {
      log.error('LabScanner', 'Failed to save parsed results', err)
      setError('Failed to save the records to your database.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditSave = (index: number) => {
    if (!parsedData) return
    const num = parseFloat(editValue)
    if (isNaN(num)) return
    
    const updated = { ...parsedData }
    updated.biomarkers[index].value = num
    setParsedData(updated)
    setEditingIndex(null)
  }

  const handleRemove = (index: number) => {
    if (!parsedData) return
    const updated = { ...parsedData }
    updated.biomarkers.splice(index, 1)
    setParsedData(updated)
  }

  return (
    <div className="min-h-full bg-mineral-black text-muted flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-4 border-b border-[var(--glass-border)] relative z-10 bg-mineral-black">
        <button onClick={() => navigate(-1)} className="text-muted-slate hover:text-muted transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-warm-pearl font-semibold text-lg">Document Scanner</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        
        {state === 'INTRO' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center pt-8">
            <div className="w-20 h-20 bg-signal-teal/10 rounded-full flex items-center justify-center text-signal-teal mb-6">
              <FileText size={32} />
            </div>
            <h2 className="text-warm-pearl text-xl mb-3">Lab Report Extraction</h2>
            <div className="bg-[var(--glass-surface)] rounded-2xl p-4 mb-8 text-left max-w-sm">
              <p className="text-muted-slate text-sm mb-3">
                Your lab report contains sensitive health information.
              </p>
              <ul className="text-xs text-muted-slate space-y-2 list-disc list-inside">
                <li>Image is sent securely to our Edge parser.</li>
                <li>Image is NOT stored or retained publicly.</li>
                <li>Extracted data is stored in your private records.</li>
              </ul>
            </div>
            <Button variant="primary" onClick={() => setState('UPLOAD')} className="w-full">
              Continue
            </Button>
          </motion.div>
        )}

        {state === 'UPLOAD' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center pt-8">
            <h2 className="text-warm-pearl text-xl mb-3">Capture Report</h2>
            <p className="text-muted-slate text-sm leading-relaxed mb-8 max-w-[280px]">
              Fit the complete report inside the frame. Keep the page flat and well lit.
            </p>

            <div className="w-full aspect-[3/4] border-2 border-dashed border-[var(--glass-border)] rounded-xl mb-6 flex flex-col items-center justify-center bg-deep-graphite/50 relative overflow-hidden">
              <Camera size={48} className="text-muted mb-2" />
              <p className="text-muted text-sm">Align Document Here</p>
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-signal-teal/50 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-signal-teal/50 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-signal-teal/50 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-signal-teal/50 rounded-br-lg" />
            </div>

            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={!isOnline}
            />
            
            {isOnline ? (
              <Button 
                variant="primary" 
                className="w-full"
                onClick={handleNativeCamera}
                icon={<Camera size={18} />}
              >
                Take Photo
              </Button>
            ) : (
              <div className="w-full p-4 rounded-xl bg-signal-amber/10 border border-signal-amber/20 text-center">
                <AlertTriangle size={24} className="text-signal-amber mx-auto mb-2" />
                <p className="text-signal-amber text-sm font-medium mb-1">Offline Mode</p>
                <p className="text-signal-amber/80 text-xs">Online AI analysis requires an internet connection.</p>
              </div>
            )}
          </motion.div>
        )}

        {state === 'SCANNING' && (
          <div className="flex flex-col h-[65vh]">
            <div className="relative flex-1 rounded-xl overflow-hidden bg-deep-graphite/50 mb-6 border border-[var(--glass-border)] shadow-xl">
              {capturedImage && (
                <img src={capturedImage} alt="Captured Document" className="absolute inset-0 w-full h-full object-cover opacity-50" />
              )}
              <div className="absolute inset-0 bg-mineral-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-2 border-[var(--glass-border)] border-t-signal-teal rounded-full animate-spin mb-6" />
                <div className="flex flex-col gap-2 font-mono bg-mineral-black/90 p-4 rounded-xl border border-[var(--glass-border)]">
                  <div className="flex items-center gap-2 text-signal-teal text-xs">
                    <span>[OK]</span> <span>DOCUMENT CAPTURED</span>
                  </div>
                  <div className="flex items-center gap-2 text-warm-pearl text-xs">
                    <span className="animate-pulse">[&gt;_]</span> <span>PARSING LAB DATA...</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center px-4">
              <p className="text-muted text-sm mb-1">Analyzing Document</p>
              <p className="text-muted-slate text-xs">Please wait while the AI extracts your results.</p>
            </div>
          </div>
        )}

        {state === 'ERROR' && (
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <div className="w-16 h-16 bg-emergency-red/10 rounded-full flex items-center justify-center text-emergency-red mb-6">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-warm-pearl text-xl mb-2">LAB REPORT COULD NOT BE READ</h2>
            <p className="text-muted-slate text-sm mb-6 max-w-xs mx-auto">
              {error || 'The analysis service is temporarily unavailable.'}
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button variant="primary" onClick={handleNativeCamera}>
                TRY AGAIN
              </Button>
              <Button variant="secondary" onClick={() => setState('UPLOAD')}>
                DO NOT SAVE
              </Button>
            </div>
          </div>
        )}

        {state === 'REVIEW' && parsedData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-28">
            <div className="mb-6">
              <h2 className="text-warm-pearl text-2xl font-light tracking-tight">REVIEW RESULTS</h2>
              <p className="text-muted-slate text-sm mt-1">Please verify extracted values</p>
            </div>

            {(() => {
              const attentionCount = parsedData.biomarkers.filter(b => b.status === 'HIGH' || b.status === 'LOW').length;
              if (attentionCount > 0) {
                return (
                  <div className="bg-signal-amber/10 border border-signal-amber/20 rounded-2xl p-4 mb-6">
                    <h3 className="text-signal-amber text-sm font-medium mb-1 flex items-center gap-2">
                      <AlertCircle size={16} /> RESULTS REQUIRING ATTENTION
                    </h3>
                    <p className="text-xs text-signal-amber/80 mb-3">
                      {attentionCount} value{attentionCount > 1 ? 's' : ''} outside the laboratory's stated reference range.
                    </p>
                    <ul className="text-sm text-warm-pearl space-y-1">
                      {parsedData.biomarkers.filter(b => b.status === 'HIGH' || b.status === 'LOW').map((b, i) => (
                        <li key={i} className="flex justify-between items-center bg-mineral-black/50 px-3 py-1.5 rounded-lg">
                          <span>{b.name}</span>
                          <span className="text-signal-amber text-xs font-bold uppercase tracking-wider">{b.status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              }
              return null;
            })()}

            {parsedData.extractionWarnings && parsedData.extractionWarnings.length > 0 && (
              <div className="bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-2xl p-4 mb-6">
                <h3 className="text-muted text-sm font-medium mb-2 flex items-center gap-2">
                  <Info size={16} /> Extraction Warnings
                </h3>
                <ul className="text-xs text-muted-slate list-disc list-inside">
                  {parsedData.extractionWarnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            <div className="bg-deep-graphite rounded-3xl divide-y divide-[var(--glass-border)] border border-[var(--glass-border)] overflow-hidden shadow-xl shadow-black/20">
              {parsedData.biomarkers.map((b, i) => (
                <div key={i} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-warm-pearl font-medium flex items-center gap-2">
                        {b.name}
                        {b.status === 'UNKNOWN' && (
                          <span className="text-[10px] bg-[var(--glass-surface)] text-muted px-1.5 py-0.5 rounded uppercase">Review Required</span>
                        )}
                      </p>
                      <p className="text-muted-slate text-xs mt-1">Ref: {b.reference_range || 'Unknown'}</p>
                    </div>
                    
                    {editingIndex === i ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          step="any"
                          className="w-20 bg-mineral-black border border-[var(--glass-border)] rounded px-2 py-1 text-warm-pearl text-right"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                        <button onClick={() => handleEditSave(i)} className="text-signal-teal p-1"><CheckCircle size={18}/></button>
                      </div>
                    ) : (
                      <div className="text-right flex flex-col items-end gap-1">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-light ${(b.status === 'HIGH' || b.status === 'LOW') ? 'text-signal-amber' : 'text-muted'}`}>{b.value}</span>
                          <span className="text-[10px] text-muted-slate uppercase tracking-wider">{b.unit}</span>
                        </div>
                        {(b.status === 'HIGH' || b.status === 'LOW') && (
                          <span className="text-[9px] font-bold text-signal-amber uppercase tracking-widest">{b.status}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Provenance and Edit Controls */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)] mt-1">
                    <div className="text-[10px] text-muted-slate font-mono overflow-hidden text-ellipsis whitespace-nowrap max-w-[220px] bg-mineral-black px-2 py-1 rounded">
                      "{b.sourceText}"
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setEditingIndex(i); setEditValue(String(b.value)); }} className="text-muted hover:text-warm-pearl transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleRemove(i)} className="text-emergency-red/80 hover:text-emergency-red transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-mineral-black via-mineral-black/90 to-transparent">
              <div className="flex gap-3 max-w-md mx-auto">
                <Button variant="secondary" className="flex-1" onClick={() => setState('UPLOAD')} icon={<RefreshCw size={18} />}>
                  Retake
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving} icon={<Save size={18} />}>
                  CONFIRM & SAVE
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {state === 'SAVED' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center pt-24">
            <div className="w-20 h-20 bg-signal-teal/10 rounded-full flex items-center justify-center text-signal-teal mb-6">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-warm-pearl text-3xl font-light mb-3">Saved</h2>
            <p className="text-muted-slate text-sm mb-8">
              {parsedData?.biomarkers.length} biomarkers added to your history.
            </p>
            <Button variant="primary" onClick={() => navigate('/records')}>
              View Records
            </Button>
          </motion.div>
        )}

      </div>
    </div>
  )
}
