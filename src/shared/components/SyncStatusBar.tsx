import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useTranslation } from 'react-i18next'
import { Wifi, WifiOff } from 'lucide-react'

export default function SyncStatusBar() {
  const isOnline = useNetworkStatus()
  const { t } = useTranslation()

  if (isOnline) return null // Only show when offline

  return (
    <div
      className="bg-signal-amber/10 border-b border-signal-amber/20 px-4 py-2 flex items-center gap-2"
      role="status"
      aria-live="polite"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      <WifiOff size={14} className="text-signal-amber flex-shrink-0" aria-hidden="true" />
      <p className="text-signal-amber text-xs">{t('sync.offline')}</p>
    </div>
  )
}
