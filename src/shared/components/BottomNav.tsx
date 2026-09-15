import { NavLink } from 'react-router-dom'
import { Home, Activity, Stethoscope, ClipboardList, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const navItems = [
  { to: '/', icon: Home, labelKey: 'nav.home', end: true },
  { to: '/bio-aura', icon: Activity, labelKey: 'nav.bioAura' },
  { to: '/triage', icon: Stethoscope, labelKey: 'nav.triage' },
  { to: '/records', icon: ClipboardList, labelKey: 'nav.records' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
]

export default function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-mineral-black/70 backdrop-blur-2xl border-t border-white/5 flex items-stretch pt-2"
      aria-label="Main navigation"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      {navItems.map(({ to, icon: Icon, labelKey, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors duration-150 min-h-[56px] ${
              isActive
                ? 'text-signal-teal'
                : 'text-muted-slate hover:text-stone active:text-warm-pearl'
            }`
          }
          aria-label={t(labelKey)}
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} aria-hidden="true" />
              <span className="text-[10px] tracking-wider uppercase font-medium">
                {t(labelKey)}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
