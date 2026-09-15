import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, LogOut, User, Phone, Globe, ShieldCheck, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../core/auth/AuthContext'
import { useTheme } from '../../core/theme/ThemeContext'
import { updateProfile } from '../../core/db/queries'
import Button from '../../shared/components/Button'
import { log } from '../../core/logger'
import type { Language, Sex } from '../../core/database.types'
import i18n from '../../core/i18n/i18n'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { profile, signOut, refreshProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [language, setLanguage] = useState<Language>(profile?.preferred_language ?? 'en')
  const [sex, setSex] = useState<Sex | ''>(profile?.sex ?? '')
  const [dob, setDob] = useState(profile?.date_of_birth ?? '')
  const [ecName, setEcName] = useState(profile?.emergency_contact_name ?? '')
  const [ecPhone, setEcPhone] = useState(profile?.emergency_contact_phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setLanguage(profile.preferred_language ?? 'en')
      setSex(profile.sex ?? '')
      setDob(profile.date_of_birth ?? '')
      setEcName(profile.emergency_contact_name ?? '')
      setEcPhone(profile.emergency_contact_phone ?? '')
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await updateProfile(profile!.id, {
      full_name: fullName.trim() || null,
      preferred_language: language,
      sex: sex || null,
      date_of_birth: dob || null,
      emergency_contact_name: ecName.trim() || null,
      emergency_contact_phone: ecPhone.trim() || null,
    })

    setSaving(false)
    if (!error) {
      setSaved(true)
      await refreshProfile()
      await i18n.changeLanguage(language)
      
      // Specifically alert the user that their emergency contact number was updated
      if (ecPhone.trim()) {
        alert(`Emergency contact number has been officially saved as: ${ecPhone.trim()}`)
      }
      
      setTimeout(() => setSaved(false), 2000)
      log.auth('Profile saved')
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div
      className="min-h-full bg-mineral-black pb-8"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="px-5 pt-5 pb-4 border-b border-white/5">
        <h1 className="text-warm-pearl text-xl font-semibold">{t('profile.title')}</h1>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Personal info */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <User size={14} className="text-muted-slate" />
            <p className="text-stone text-xs tracking-wider uppercase">Personal</p>
          </div>
          <div className="bg-deep-graphite rounded-card divide-y divide-white/5 border border-white/5">
            <ProfileField label={t('profile.name')}>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="bg-transparent text-warm-pearl text-sm text-right focus:outline-none placeholder:text-muted-slate/50 w-full"
                placeholder="Your name"
              />
            </ProfileField>
            <ProfileField label={t('profile.dob')} hint={t('common.optional')}>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="bg-transparent text-warm-pearl text-sm text-right focus:outline-none w-full"
              />
            </ProfileField>
            <ProfileField label={t('profile.sex')} hint={t('common.optional')}>
              <select
                value={sex}
                onChange={e => setSex(e.target.value as Sex | '')}
                className="bg-transparent text-warm-pearl text-sm text-right focus:outline-none w-auto"
              >
                <option value="">—</option>
                <option value="male">{t('profile.sexOptions.male')}</option>
                <option value="female">{t('profile.sexOptions.female')}</option>
                <option value="other">{t('profile.sexOptions.other')}</option>
                <option value="prefer_not_to_say">{t('profile.sexOptions.prefer_not_to_say')}</option>
              </select>
            </ProfileField>
          </div>
        </section>

        {/* Theme Settings */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            {theme === 'dark' ? <Moon size={14} className="text-muted-slate" /> : <Sun size={14} className="text-muted-slate" />}
            <p className="text-stone text-xs tracking-wider uppercase">Appearance</p>
          </div>
          <div className="bg-deep-graphite rounded-card border border-white/5 p-3 flex items-center justify-between">
            <span className="text-warm-pearl text-sm ml-1">
              {theme === 'dark' ? 'Dark Mineral Theme' : 'Warm Pearl Theme'}
            </span>
            <button
              onClick={toggleTheme}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out relative flex items-center ${
                theme === 'warm' ? 'bg-signal-teal' : 'bg-raised-graphite'
              }`}
            >
              <div 
                className={`w-6 h-6 rounded-full bg-warm-pearl shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center ${
                  theme === 'warm' ? 'translate-x-6' : 'translate-x-0'
                }`}
              >
                {theme === 'dark' ? <Moon size={12} className="text-mineral-black" /> : <Sun size={12} className="text-signal-teal" />}
              </div>
            </button>
          </div>
        </section>

        {/* Language */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={14} className="text-muted-slate" />
            <p className="text-stone text-xs tracking-wider uppercase">{t('profile.language')}</p>
          </div>
          <div className="bg-deep-graphite rounded-card border border-white/5">
            <div className="flex gap-2 p-3">
              {(['en', 'ta', 'hi'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 py-2 rounded-instrument text-sm transition-colors ${
                    language === lang
                      ? 'bg-signal-teal/15 text-signal-teal border border-signal-teal/30'
                      : 'text-muted-slate hover:text-stone'
                  }`}
                >
                  {t(`profile.languages.${lang}`)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Emergency contact */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Phone size={14} className="text-muted-slate" />
            <p className="text-stone text-xs tracking-wider uppercase">{t('profile.emergencyContact')}</p>
          </div>
          <div className="bg-deep-graphite rounded-card divide-y divide-white/5 border border-white/5">
            <ProfileField label={t('profile.emergencyContactName')} hint={t('common.optional')}>
              <input
                type="text"
                value={ecName}
                onChange={e => setEcName(e.target.value)}
                className="bg-transparent text-warm-pearl text-sm text-right focus:outline-none placeholder:text-muted-slate/50 w-full"
                placeholder="Contact name"
              />
            </ProfileField>
            <ProfileField label={t('profile.emergencyContactPhone')} hint={t('common.optional')}>
              <input
                type="tel"
                value={ecPhone}
                onChange={e => setEcPhone(e.target.value)}
                className="bg-transparent text-warm-pearl text-sm text-right focus:outline-none placeholder:text-muted-slate/50 w-full"
                placeholder="+91 XXXXX XXXXX"
              />
            </ProfileField>
          </div>
        </section>

        {/* Consent */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={14} className="text-muted-slate" />
            <p className="text-stone text-xs tracking-wider uppercase">{t('profile.consent')}</p>
          </div>
          <div className="bg-deep-graphite rounded-card p-4 border border-white/5">
            <p className="text-soft-bone text-sm">
              Camera processing happens on your device. Health data is stored in your account only and is never sold or shared.
            </p>
          </div>
        </section>

        {/* Save */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSave}
          loading={saving}
          icon={<Save size={16} />}
        >
          {saved ? '✓ ' + t('profile.saved') : t('profile.save')}
        </Button>

        {/* Sign out */}
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onClick={handleSignOut}
          icon={<LogOut size={16} />}
          className="text-muted-slate"
        >
          {t('auth.signOut')}
        </Button>
      </div>
    </div>
  )
}

function ProfileField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <div className="flex-shrink-0">
        <p className="text-stone text-sm">{label}</p>
        {hint && <p className="text-muted-slate text-xs">{hint}</p>}
      </div>
      <div className="flex-1 min-w-0 flex justify-end">{children}</div>
    </div>
  )
}
