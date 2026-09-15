import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Stethoscope, AlertTriangle, Fingerprint, ChevronRight, Droplet, Eye, FileText, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../../core/supabase'
import { useAuth } from '../../core/auth/AuthContext'
import type { Database } from '../../core/database.types'

type Measurement = Database['public']['Tables']['health_measurements']['Row']

export default function HomePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [todayMeasurements, setTodayMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.user_metadata?.full_name) {
      setFirstName(session.user.user_metadata.full_name.split(' ')[0])
    }

    const loadToday = async () => {
      setLoading(true)
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      
      const { data } = await supabase
        .from('health_measurements')
        .select('*')
        .eq('status', 'SAVED')
        .gte('captured_at', startOfDay.toISOString())
        .order('captured_at', { ascending: false })
      
      setTodayMeasurements(data || [])
      setLoading(false)
    }

    loadToday()
  }, [session])

  const heartRates = todayMeasurements
    .filter(m => m.measurement_type === 'heart_rate' && m.value_numeric !== null)
    .map(m => m.value_numeric as number)

  const avgHr = heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null
  const minHr = heartRates.length > 0 ? Math.min(...heartRates) : null
  const maxHr = heartRates.length > 0 ? Math.max(...heartRates) : null
  const latestHr = heartRates.length > 0 ? heartRates[0] : null

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as any } }
  }

  return (
    <div className="min-h-full bg-mineral-black text-stone flex flex-col pb-28 overflow-x-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border border-signal-teal/30 flex items-center justify-center relative">
             <div className="w-1.5 h-1.5 bg-signal-teal rounded-full" />
             <div className="absolute inset-0 border border-signal-teal/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          </div>
          <span className="text-warm-pearl text-sm tracking-[0.2em] uppercase font-light">DiuMed</span>
        </div>
        <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-raised-graphite border border-white/5 flex items-center justify-center hover:border-white/20 transition-colors">
          <span className="text-sm font-medium text-warm-pearl font-mono">
            {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
          </span>
        </button>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex-1">
        {/* Hero greeting */}
        <motion.div variants={itemVariants} className="px-6 pt-10 pb-12 relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-signal-teal/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-50" />
          <p className="text-stone text-[11px] mb-3 uppercase tracking-[0.2em] font-mono">
            {firstName ? `HELLO, ${firstName.toUpperCase()}` : 'HELLO'}
          </p>
          <h1 className="text-warm-pearl text-4xl sm:text-5xl font-light leading-[1.1] tracking-tight">
            How are you<br />feeling?
          </h1>
        </motion.div>

        {/* Strong Spatial Actions block */}
        <motion.div variants={itemVariants} className="px-6 mb-12">
          <div className="relative bg-material-mineral rounded-3xl p-6 shadow-2xl border border-white/5 overflow-hidden group">
            {/* Background texture/lighting */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-signal-teal/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-signal-teal/20 transition-colors duration-700" />
            
            <p className="text-[10px] text-muted-slate tracking-[0.2em] uppercase font-mono mb-6 relative z-10">Primary Actions</p>
            
            <div className="flex flex-col gap-6 relative z-10">
              <button onClick={() => navigate('/bio-aura')} className="flex items-center justify-between group/btn text-left">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-signal-teal/10 flex items-center justify-center text-signal-teal group-hover/btn:bg-signal-teal/20 group-hover/btn:scale-110 transition-all duration-300">
                    <Activity size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-warm-pearl text-lg font-medium mb-1 group-hover/btn:text-white transition-colors">Bio-Aura</h3>
                    <p className="text-muted-slate text-[11px] font-mono tracking-wide uppercase">Facial optical estimate</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-muted-slate group-hover/btn:text-signal-teal group-hover/btn:translate-x-1 transition-all" strokeWidth={1.5} />
              </button>

              <div className="w-full h-[1px] bg-white/5" />

              <button onClick={() => navigate('/pulse-touch')} className="flex items-center justify-between group/btn text-left">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-warm-pearl group-hover/btn:bg-white/10 group-hover/btn:scale-110 transition-all duration-300">
                    <Fingerprint size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-warm-pearl text-lg font-medium mb-1 group-hover/btn:text-white transition-colors">Pulse Touch</h3>
                    <p className="text-muted-slate text-[11px] font-mono tracking-wide uppercase">Finger contact estimate</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-muted-slate group-hover/btn:text-warm-pearl group-hover/btn:translate-x-1 transition-all" strokeWidth={1.5} />
              </button>

              <div className="w-full h-[1px] bg-white/5" />

              <div className="grid grid-cols-2 gap-4 pt-2">
                 <button onClick={() => navigate('/triage')} className="bg-mineral-black border border-white/5 rounded-2xl p-4 text-left hover:border-white/20 transition-colors group/mini">
                   <Stethoscope size={18} className="text-signal-amber mb-3" />
                   <p className="text-warm-pearl font-medium text-sm mb-1">Triage</p>
                   <p className="text-muted-slate text-[10px] font-mono">Describe symptoms</p>
                 </button>
                 <button onClick={() => navigate('/emergency')} className="bg-emergency-red/10 border border-emergency-red/20 rounded-2xl p-4 text-left hover:bg-emergency-red/20 transition-colors group/mini">
                   <AlertTriangle size={18} className="text-emergency-red mb-3" />
                   <p className="text-emergency-red font-medium text-sm mb-1">Emergency</p>
                   <p className="text-emergency-red/70 text-[10px] font-mono">Get help</p>
                 </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Daily Summary */}
        <motion.div variants={itemVariants} className="px-6 mb-12">
          <p className="text-[10px] text-muted-slate tracking-[0.2em] uppercase mb-4 font-mono">Today</p>
          
          {loading ? (
            <div className="h-32 bg-raised-graphite rounded-3xl border border-white/5 animate-pulse" />
          ) : heartRates.length === 0 ? (
            <div className="bg-raised-graphite border border-white/5 rounded-3xl p-6 flex items-center justify-between">
              <div>
                <p className="text-warm-pearl text-sm font-medium mb-1">No measurements yet</p>
                <p className="text-xs text-muted-slate">Your first optical reading will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="bg-raised-graphite rounded-3xl p-6 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-signal-teal/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-slate mb-1 font-mono">Latest</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-light text-warm-pearl font-mono tracking-tight">{latestHr}</span>
                    <span className="text-xs font-mono text-signal-teal ml-1">BPM</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-muted-slate mb-1 font-mono">Count</p>
                  <p className="text-xl font-medium text-warm-pearl font-mono">{todayMeasurements.length}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-mineral-black rounded-2xl p-4 relative z-10 border border-white/5">
                <div className="text-center flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-slate mb-1 font-mono">Avg</p>
                  <p className="font-mono text-warm-pearl text-sm">{avgHr}</p>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="text-center flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-slate mb-1 font-mono">Range</p>
                  <p className="font-mono text-warm-pearl text-sm">{minHr} - {maxHr}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Secondary Tools */}
        <motion.div variants={itemVariants} className="px-6">
          <p className="text-[10px] text-muted-slate tracking-[0.2em] uppercase mb-4 font-mono">Experimental Tools</p>
          <div className="space-y-3">
            <button onClick={() => navigate('/anemia-screening')} className="w-full bg-raised-graphite border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors text-left group">
              <div className="w-8 h-8 rounded-full bg-signal-amber/10 flex items-center justify-center text-signal-amber group-hover:scale-110 transition-transform">
                <Droplet size={14} />
              </div>
              <div className="flex-1">
                <p className="text-warm-pearl text-sm font-medium mb-0.5">Anemia Screening</p>
                <p className="text-[10px] text-muted-slate uppercase tracking-wider font-mono">Optical Assessment</p>
              </div>
              <ChevronRight size={16} className="text-muted-slate group-hover:text-warm-pearl transition-colors" />
            </button>
            
            <button onClick={() => navigate('/sclera-screening')} className="w-full bg-raised-graphite border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors text-left group">
              <div className="w-8 h-8 rounded-full bg-signal-teal/10 flex items-center justify-center text-signal-teal group-hover:scale-110 transition-transform">
                <Eye size={14} />
              </div>
              <div className="flex-1">
                <p className="text-warm-pearl text-sm font-medium mb-0.5">Sclera Screening</p>
                <p className="text-[10px] text-muted-slate uppercase tracking-wider font-mono">Optical Assessment</p>
              </div>
              <ChevronRight size={16} className="text-muted-slate group-hover:text-warm-pearl transition-colors" />
            </button>

            <button onClick={() => navigate('/scan-lab-report')} className="w-full bg-raised-graphite border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors text-left group">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-stone group-hover:scale-110 transition-transform">
                <FileText size={14} />
              </div>
              <div className="flex-1">
                <p className="text-warm-pearl text-sm font-medium mb-0.5">Lab Report Scanner</p>
                <p className="text-[10px] text-muted-slate uppercase tracking-wider font-mono">Document Extraction</p>
              </div>
              <ChevronRight size={16} className="text-muted-slate group-hover:text-warm-pearl transition-colors" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
