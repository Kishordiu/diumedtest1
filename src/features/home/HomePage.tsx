import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Stethoscope, AlertTriangle, Fingerprint, ChevronRight, Droplet, Eye, FileText, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../../core/supabase'
import { useAuth } from '../../core/auth/AuthContext'
import type { Database } from '../../core/database.types'
import { useTranslation } from 'react-i18next'

type Measurement = Database['public']['Tables']['health_measurements']['Row']

export default function HomePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { t } = useTranslation()
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
    <div className="min-h-full bg-base text-primary flex flex-col overflow-x-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border border-signal-teal/30 flex items-center justify-center relative">
             <div className="w-1.5 h-1.5 bg-signal-teal rounded-full" />
             <div className="absolute inset-0 border border-signal-teal/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          </div>
          <span className="text-primary text-sm tracking-[0.2em] uppercase font-light">DiuMed</span>
        </div>
        <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-surface border border-[var(--glass-border)] flex items-center justify-center hover:border-primary/20 transition-colors">
          <span className="text-sm font-medium text-primary font-mono">
            {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
          </span>
        </button>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex-1">
        {/* Hero greeting */}
        <motion.div variants={itemVariants} className="px-6 pt-10 pb-12 relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-signal-teal/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-50" />
          <p className="text-technical text-[11px] mb-3 uppercase tracking-[0.2em] font-mono">
            {firstName ? `HELLO, ${firstName.toUpperCase()}` : 'HELLO'}
          </p>
          <h1 className="text-primary text-4xl sm:text-5xl font-light leading-[1.1] tracking-tight">
            {t('home.question').split(' ').map((word, i) => i === 2 ? <React.Fragment key={i}><br />{word} </React.Fragment> : word + ' ')}
          </h1>
        </motion.div>

        {/* Strong Spatial Actions block */}
        <motion.div variants={itemVariants} className="px-6 mb-12">
          <div className="relative bg-instrument rounded-3xl p-6 shadow-2xl border border-[var(--glass-border)] overflow-hidden group">
            {/* Background texture/lighting */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--glass-surface)] to-transparent pointer-events-none opacity-20" />
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-signal-teal/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-signal-teal/20 transition-colors duration-700" />
            
            <p className="text-[10px] text-technical tracking-[0.2em] uppercase font-mono mb-6 relative z-10">{t('home.primaryActions')}</p>
            
            <div className="flex flex-col gap-6 relative z-10">
              <button onClick={() => navigate('/bio-aura')} className="flex items-center justify-between group/btn text-left">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-signal-teal/10 flex items-center justify-center text-signal-teal group-hover/btn:bg-signal-teal/20 group-hover/btn:scale-110 transition-all duration-300">
                    <Activity size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-primary text-lg font-medium mb-1 transition-colors">{t('home.bioAura')}</h3>
                    <p className="text-muted text-[11px] font-mono tracking-wide uppercase">{t('home.bioAuraDesc')}</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-technical group-hover/btn:text-signal-teal group-hover/btn:translate-x-1 transition-all" strokeWidth={1.5} />
              </button>

              <div className="w-full h-[1px] bg-[var(--glass-border)]" />

              <button onClick={() => navigate('/pulse-touch')} className="flex items-center justify-between group/btn text-left">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--glass-surface)] flex items-center justify-center text-primary group-hover/btn:bg-primary/10 group-hover/btn:scale-110 transition-all duration-300">
                    <Fingerprint size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-primary text-lg font-medium mb-1 transition-colors">{t('home.pulseTouch')}</h3>
                    <p className="text-muted text-[11px] font-mono tracking-wide uppercase">{t('home.pulseTouchDesc')}</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-technical group-hover/btn:text-primary group-hover/btn:translate-x-1 transition-all" strokeWidth={1.5} />
              </button>

              <div className="w-full h-[1px] bg-[var(--glass-border)]" />

              <div className="grid grid-cols-2 gap-4 pt-2">
                 <button onClick={() => navigate('/triage')} className="bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-2xl p-4 text-left hover:border-primary/20 transition-colors group/mini">
                   <Stethoscope size={18} className="text-signal-amber mb-3" />
                   <p className="text-primary font-medium text-sm mb-1">{t('home.triage')}</p>
                   <p className="text-muted text-[10px] font-mono">{t('home.triageDesc')}</p>
                 </button>
                 <button onClick={() => navigate('/emergency')} className="bg-emergency-red/10 border border-emergency-red/20 rounded-2xl p-4 text-left hover:bg-emergency-red/20 transition-colors group/mini">
                   <AlertTriangle size={18} className="text-emergency-red mb-3" />
                   <p className="text-emergency-red font-medium text-sm mb-1">{t('home.emergency')}</p>
                   <p className="text-emergency-red/70 text-[10px] font-mono">{t('home.emergencyDesc')}</p>
                 </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Daily Summary */}
        <motion.div variants={itemVariants} className="px-6 mb-12">
          <p className="text-[10px] text-technical tracking-[0.2em] uppercase mb-4 font-mono">{t('home.today')}</p>
          
          {loading ? (
            <div className="h-32 bg-surface rounded-3xl border border-[var(--glass-border)] shadow-sm animate-pulse" />
          ) : heartRates.length === 0 ? (
            <div className="bg-surface border border-[var(--glass-border)] rounded-3xl p-6 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-primary text-sm font-medium mb-1">{t('home.noMeasurements')}</p>
                <p className="text-xs text-secondary">{t('home.firstReading')}</p>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl p-6 border border-[var(--glass-border)] relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-signal-teal/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-technical mb-1 font-mono">{t('home.latest')}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-light text-primary font-mono tracking-tight">{latestHr}</span>
                    <span className="text-xs font-mono text-signal-teal ml-1">BPM</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-technical mb-1 font-mono">{t('home.count')}</p>
                  <p className="text-xl font-medium text-primary font-mono">{todayMeasurements.length}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-base rounded-2xl p-4 relative z-10 border border-[var(--glass-border)]">
                <div className="text-center flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-technical mb-1 font-mono">{t('home.avg')}</p>
                  <p className="font-mono text-primary text-sm">{avgHr}</p>
                </div>
                <div className="w-px h-8 bg-[var(--glass-border)]" />
                <div className="text-center flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-technical mb-1 font-mono">{t('home.range')}</p>
                  <p className="font-mono text-primary text-sm">{minHr} - {maxHr}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Secondary Tools */}
        <motion.div variants={itemVariants} className="px-6 mb-12">
          <p className="text-[10px] text-technical tracking-[0.2em] uppercase mb-4 font-mono">{t('home.experimentalTools')}</p>
          <div className="space-y-3">
            <button onClick={() => navigate('/anemia-screening')} className="w-full bg-surface shadow-sm border border-[var(--glass-border)] rounded-2xl p-4 flex items-center gap-4 hover:border-primary/10 transition-colors text-left group">
              <div className="w-8 h-8 rounded-full bg-signal-amber/10 flex items-center justify-center text-signal-amber group-hover:scale-110 transition-transform">
                <Droplet size={14} />
              </div>
              <div className="flex-1">
                <p className="text-primary text-sm font-medium mb-0.5">{t('home.anemiaScreening')}</p>
                <p className="text-[10px] text-secondary uppercase tracking-wider font-mono">{t('home.anemiaScreeningDesc')}</p>
              </div>
              <ChevronRight size={16} className="text-technical group-hover:text-primary transition-colors" />
            </button>
            
            <button onClick={() => navigate('/sclera-screening')} className="w-full bg-surface shadow-sm border border-[var(--glass-border)] rounded-2xl p-4 flex items-center gap-4 hover:border-primary/10 transition-colors text-left group">
              <div className="w-8 h-8 rounded-full bg-signal-teal/10 flex items-center justify-center text-signal-teal group-hover:scale-110 transition-transform">
                <Eye size={14} />
              </div>
              <div className="flex-1">
                <p className="text-primary text-sm font-medium mb-0.5">{t('home.scleraScreening')}</p>
                <p className="text-[10px] text-secondary uppercase tracking-wider font-mono">{t('home.scleraScreeningDesc')}</p>
              </div>
              <ChevronRight size={16} className="text-technical group-hover:text-primary transition-colors" />
            </button>

            <button onClick={() => navigate('/scan-lab-report')} className="w-full bg-surface shadow-sm border border-[var(--glass-border)] rounded-2xl p-4 flex items-center gap-4 hover:border-primary/10 transition-colors text-left group">
              <div className="w-8 h-8 rounded-full bg-[var(--glass-surface)] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <FileText size={14} />
              </div>
              <div className="flex-1">
                <p className="text-primary text-sm font-medium mb-0.5">{t('home.labReportScanner')}</p>
                <p className="text-[10px] text-secondary uppercase tracking-wider font-mono">{t('home.labReportScannerDesc')}</p>
              </div>
              <ChevronRight size={16} className="text-technical group-hover:text-primary transition-colors" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
