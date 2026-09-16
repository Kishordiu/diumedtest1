import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Phone, MessageSquare, AlertTriangle, PhoneCall } from 'lucide-react'
import { useAuth } from '../../core/auth/AuthContext'
import { insertEmergencyEvent, updateEmergencyStatus } from '../../core/db/queries'
import Button from '../../shared/components/Button'
import { log } from '../../core/logger'
import type { EmergencyEventType, EmergencyStatus } from '../../core/database.types'

type EmergencyState = 'READY' | 'INITIATING' | 'DEVICE_HANDOFF' | 'RETURNED' | 'UNVERIFIABLE'

interface EmergencyAction {
  type: EmergencyEventType
  label: string
  target: string
  icon: typeof Phone
  variant: 'emergency' | 'danger' | 'secondary'
  description: string
}

export default function EmergencyPage() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [emergencyState, setEmergencyState] = useState<EmergencyState>('READY')
  const [lastAction, setLastAction] = useState<EmergencyEventType | null>(null)

  const hasEmergencyContact = !!(profile?.emergency_contact_phone)

  const actions: EmergencyAction[] = [
    {
      type: 'CALL_112',
      label: t('emergency.call112'),
      target: '112',
      icon: PhoneCall,
      variant: 'emergency',
      description: 'Opens your phone dialer with 112',
    },
    ...(hasEmergencyContact ? [
      {
        type: 'CALL_CUSTOM' as EmergencyEventType,
        label: t('emergency.callCustom'),
        target: profile!.emergency_contact_phone!,
        icon: Phone,
        variant: 'danger' as const,
        description: `Call ${profile?.emergency_contact_name ?? 'emergency contact'}`,
      },
      {
        type: 'SMS_CUSTOM' as EmergencyEventType,
        label: t('emergency.smsCustom'),
        target: profile!.emergency_contact_phone!,
        icon: MessageSquare,
        variant: 'secondary' as const,
        description: `Text ${profile?.emergency_contact_name ?? 'emergency contact'}`,
      },
    ] : []),
  ]

  const handleAction = async (action: EmergencyAction) => {
    setEmergencyState('INITIATING')
    setLastAction(action.type)
    log.emergency('Initiating emergency action:', action.type, action.target)

    // Record the event before attempting device handoff
    if (user) {
      await insertEmergencyEvent({
        user_id: user.id,
        event_type: action.type,
        target: action.target,
        status: 'INITIATED',
        initiated_at: new Date().toISOString(),
        metadata: {
          contact_name: profile?.emergency_contact_name ?? null,
        } as never,
      })
    }

    setEmergencyState('DEVICE_HANDOFF')

    // Attempt device handoff — tel: or sms: URI
    let uri: string
    if (action.type === 'CALL_112' || action.type === 'CALL_CUSTOM') {
      uri = `tel:${action.target}`
    } else {
      uri = `sms:${action.target}?body=I need emergency assistance. This message was sent from DiuMed.`
    }

    try {
      window.location.href = uri
    } catch (err) {
      log.error('EMERGENCY', 'URI handoff failed:', err)
    }

    // After a delay, we cannot know if the action succeeded
    setTimeout(() => {
      setEmergencyState('RETURNED')

      // Update status in DB
      if (user) {
        updateEmergencyStatus(user.id, 'UNVERIFIABLE')
          .then(({ error }) => {
            if (!error) log.emergency('Status updated to UNVERIFIABLE')
          })
      }
    }, 3000)
  }

  const stateMessages: Record<EmergencyState, string> = {
    READY: '',
    INITIATING: 'Initiating...',
    DEVICE_HANDOFF: t('emergency.states.deviceHandoff'),
    RETURNED: t('emergency.states.returned'),
    UNVERIFIABLE: t('emergency.states.unverifiable'),
  }

  return (
    <div
      className="min-h-full bg-mineral-black"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={18} className="text-emergency-red" />
          <h1 className="text-warm-pearl text-xl font-semibold">{t('emergency.title')}</h1>
        </div>
        <p className="text-muted-slate text-sm">{t('emergency.subtitle')}</p>
      </div>

      {/* Warning */}
      <div className="px-5 pt-4">
        <div className="surface-emergency rounded-card p-4 mb-5">
          <p className="text-emergency-red/80 text-sm">{t('emergency.warning')}</p>
        </div>

        {/* State message */}
        {emergencyState !== 'READY' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-deep-graphite rounded-card p-4 mb-5 border border-[var(--glass-border)]"
          >
            <p className="text-warm-pearl text-sm">{stateMessages[emergencyState]}</p>
            {emergencyState === 'RETURNED' && (
              <p className="text-muted-slate text-xs mt-2">{t('emergency.states.unverifiable')}</p>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {actions.map(action => (
            <div key={action.type}>
              <Button
                variant={action.variant}
                size="lg"
                fullWidth
                onClick={() => handleAction(action)}
                disabled={emergencyState === 'INITIATING' || emergencyState === 'DEVICE_HANDOFF'}
                icon={<action.icon size={18} />}
              >
                {action.label}
              </Button>
              <p className="text-muted-slate text-xs mt-1 px-1">{action.description}</p>
            </div>
          ))}

          {!hasEmergencyContact && (
            <div className="bg-deep-graphite rounded-card p-4 border border-[var(--glass-border)]">
              <p className="text-muted text-sm">{t('emergency.noContact')}</p>
              <p className="text-signal-teal text-xs mt-1">{t('emergency.addContact')}</p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-deep-graphite rounded-card p-4 border border-[var(--glass-border)]">
          <p className="text-muted-slate text-xs leading-relaxed">
            {t('emergency.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  )
}
