import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthContext'
import { supabase } from '../../core/supabase'
import { useTranslation } from 'react-i18next'
import { Users, Activity, Stethoscope, AlertTriangle } from 'lucide-react'

interface AdminMetrics {
  userCount: number | null
  measurementsToday: number | null
  measurementsTotal: number | null
  triageSessions: number | null
  emergencyEvents: number | null
}

export default function AdminPage() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<AdminMetrics>({
    userCount: null,
    measurementsToday: null,
    measurementsTotal: null,
    triageSessions: null,
    emergencyEvents: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/')
      return
    }
    const load = async () => {
      setLoading(true)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [
        { count: userCount },
        { count: measurementsToday },
        { count: measurementsTotal },
        { count: triageSessions },
        { count: emergencyEvents },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('health_measurements').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('health_measurements').select('id', { count: 'exact', head: true }),
        supabase.from('triage_assessments').select('id', { count: 'exact', head: true }),
        supabase.from('emergency_events').select('id', { count: 'exact', head: true }),
      ])

      setMetrics({
        userCount: userCount ?? 0,
        measurementsToday: measurementsToday ?? 0,
        measurementsTotal: measurementsTotal ?? 0,
        triageSessions: triageSessions ?? 0,
        emergencyEvents: emergencyEvents ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [role, navigate])

  if (role !== 'admin') return null

  const metricItems = [
    { label: t('admin.metrics.users'), value: metrics.userCount, icon: Users },
    { label: t('admin.metrics.measurementsToday'), value: metrics.measurementsToday, icon: Activity },
    { label: t('admin.metrics.measurementsTotal'), value: metrics.measurementsTotal, icon: Activity },
    { label: t('admin.metrics.triageSessions'), value: metrics.triageSessions, icon: Stethoscope },
    { label: t('admin.metrics.emergencyEvents'), value: metrics.emergencyEvents, icon: AlertTriangle },
  ]

  return (
    <div
      className="min-h-full bg-mineral-black"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="px-5 pt-5 pb-4 border-b border-[var(--glass-border)]">
        <h1 className="text-warm-pearl text-xl font-semibold">{t('admin.title')}</h1>
        <p className="text-muted-slate text-xs mt-0.5">Operations console · Admin view</p>
      </div>

      <div className="px-5 pt-5 grid grid-cols-2 gap-3">
        {metricItems.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-deep-graphite rounded-card p-4 border border-[var(--glass-border)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className="text-muted-slate" />
              <p className="text-muted-slate text-xs">{label}</p>
            </div>
            {loading ? (
              <div className="h-8 w-12 bg-[var(--glass-surface)] rounded animate-pulse" />
            ) : (
              <p className="readout text-warm-pearl text-2xl font-thin">
                {value ?? '—'}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 mt-6">
        <div className="bg-deep-graphite rounded-card p-4 border border-[var(--glass-border)]">
          <p className="text-muted-slate text-xs leading-relaxed">
            Metrics reflect live database counts. No synthetic or cached data.
            Empty values indicate zero records, not missing data.
          </p>
        </div>
      </div>
    </div>
  )
}
