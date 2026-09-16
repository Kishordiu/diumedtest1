import React, { useState } from 'react'
import { ArrowLeft, Save, Play, Square, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../shared/components/Button'

interface BenchmarkRecord {
  timestamp: number;
  referenceHr: number;
  estimatedHr: number;
}

export default function BenchmarkMode() {
  const navigate = useNavigate()
  const [isRunning, setIsRunning] = useState(false)
  const [records, setRecords] = useState<BenchmarkRecord[]>([])
  const [referenceInput, setReferenceInput] = useState<string>('72')
  const [lastEstimate, setLastEstimate] = useState<number | null>(null)

  // In a real implementation, this would subscribe to the rPPG engine's events.
  // For now, we simulate receiving estimates while running.
  React.useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      const refHr = parseFloat(referenceInput)
      if (isNaN(refHr)) return
      
      // Simulate an estimate slightly off from the reference
      const error = (Math.random() - 0.5) * 5
      const estHr = refHr + error
      setLastEstimate(estHr)
      
      setRecords(prev => [...prev, {
        timestamp: Date.now(),
        referenceHr: refHr,
        estimatedHr: estHr
      }])
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, referenceInput])

  const calculateMetrics = () => {
    if (records.length === 0) return { mae: 0, rmse: 0, bias: 0 }
    
    let sumErr = 0
    let sumAbsErr = 0
    let sumSqErr = 0

    records.forEach(r => {
      const err = r.estimatedHr - r.referenceHr
      sumErr += err
      sumAbsErr += Math.abs(err)
      sumSqErr += err * err
    })

    const n = records.length
    return {
      bias: sumErr / n,
      mae: sumAbsErr / n,
      rmse: Math.sqrt(sumSqErr / n)
    }
  }

  const metrics = calculateMetrics()

  return (
    <div className="min-h-screen bg-mineral-black text-muted flex flex-col p-5" style={{ paddingTop: 'env(safe-area-inset-top, 20px)' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-muted-slate hover:text-muted">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-warm-pearl font-semibold text-lg leading-tight">Developer Benchmarking</h1>
          <p className="text-signal-amber text-xs font-mono">rPPG Engine Validation</p>
        </div>
      </div>

      <div className="bg-raised-graphite rounded-xl p-5 mb-6 border border-[var(--glass-border)]">
        <h2 className="text-warm-pearl font-medium mb-4 text-sm tracking-wide">REFERENCE DATA</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-slate mb-1 block uppercase tracking-wider">Reference HR (BPM)</label>
            <input 
              type="number" 
              value={referenceInput}
              onChange={e => setReferenceInput(e.target.value)}
              className="w-full bg-mineral-black border border-[var(--glass-border)] rounded-lg px-4 py-3 text-warm-pearl focus:outline-none focus:border-signal-teal font-mono text-xl"
              disabled={isRunning}
            />
          </div>
          <Button 
            variant={isRunning ? 'secondary' : 'primary'}
            onClick={() => setIsRunning(!isRunning)}
            icon={isRunning ? <Square size={18}/> : <Play size={18} />}
          >
            {isRunning ? 'STOP' : 'START RECORDING'}
          </Button>
        </div>
      </div>

      <div className="bg-material-glass rounded-xl p-5 mb-6 border border-[var(--glass-border)] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <h2 className="text-warm-pearl font-medium mb-4 text-sm tracking-wide relative z-10 flex items-center gap-2">
          <Activity size={16} className="text-signal-teal" />
          LIVE METRICS (n={records.length})
        </h2>
        
        <div className="grid grid-cols-3 gap-4 relative z-10">
          <div>
            <p className="text-muted-slate text-xs uppercase tracking-widest mb-1">MAE</p>
            <p className="text-2xl text-warm-pearl font-light">{metrics.mae.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-slate text-xs uppercase tracking-widest mb-1">RMSE</p>
            <p className="text-2xl text-warm-pearl font-light">{metrics.rmse.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-slate text-xs uppercase tracking-widest mb-1">BIAS</p>
            <p className="text-2xl text-warm-pearl font-light">{metrics.bias > 0 ? '+' : ''}{metrics.bias.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-raised-graphite rounded-xl p-5 border border-[var(--glass-border)] flex flex-col min-h-[300px]">
        <h2 className="text-warm-pearl font-medium mb-4 text-sm tracking-wide">CHART (Reference vs Estimate)</h2>
        <div className="flex-1 flex items-end gap-1 relative border-b border-l border-[var(--glass-border)] p-2">
          {records.slice(-50).map((r, i) => (
            <div key={i} className="flex-1 relative h-full flex items-end justify-center group">
              <div 
                className="absolute bottom-0 w-2 bg-signal-teal/30 rounded-t" 
                style={{ height: `${(r.referenceHr / 200) * 100}%` }}
              />
              <div 
                className="absolute bottom-0 w-1 bg-signal-amber rounded-t z-10" 
                style={{ height: `${(r.estimatedHr / 200) * 100}%` }}
              />
            </div>
          ))}
          {records.length === 0 && (
             <p className="absolute inset-0 flex items-center justify-center text-muted-slate text-sm">Waiting for data...</p>
          )}
        </div>
        <div className="flex gap-4 mt-4 text-xs font-mono text-muted-slate justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-signal-teal/30 rounded" /> Reference
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-signal-amber rounded" /> Estimate
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={() => setRecords([])} disabled={records.length === 0}>
          CLEAR DATA
        </Button>
      </div>
    </div>
  )
}
