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
      className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-3xl flex items-stretch pt-2 transition-colors duration-500"
      aria-label="Main navigation"
      style={{
        zIndex: 40,
        paddingBottom: 'calc(var(--safe-bottom) + 8px)',
        borderTop: '1px solid var(--glass-border)',
        boxShadow: '0 -1px 0 0 rgba(87, 185, 167, 0.07), 0 -8px 32px rgba(0, 0, 0, 0.25)',
      }}
    >
      {navItems.map(({ to, icon: Icon, labelKey, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-all duration-150 min-h-[56px] ${
              isActive
                ? 'text-signal-teal'
                : 'text-muted hover:text-primary active:text-primary'
            }`
          }
          aria-label={t(labelKey)}
        >
          {({ isActive }) => (
            <>
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      boxShadow: '0 0 12px 2px rgba(87, 185, 167, 0.25)',
                      background: 'rgba(87, 185, 167, 0.08)',
                      width: '36px',
                      height: '36px',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} aria-hidden="true" />
              </div>
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
