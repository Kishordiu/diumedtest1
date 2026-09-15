import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../core/auth/AuthContext'
import AppShell from './AppShell'
import LoadingScreen from '../shared/components/LoadingScreen'

// Lazy-loaded routes
const Onboarding = lazy(() => import('../features/onboarding/OnboardingPage'))
const AuthPage = lazy(() => import('../features/auth/AuthPage'))
const ResetPasswordPage = lazy(() => import('../features/auth/ResetPasswordPage'))
const HomePage = lazy(() => import('../features/home/HomePage'))
const BioAuraPage = lazy(() => import('../features/bio-aura/BioAuraPage').then(m => ({ default: m.BioAuraPage })))
const PulseTouchPage = lazy(() => import('../features/bio-aura/PulseTouchPage').then(m => ({ default: m.PulseTouchPage })))
const MeasurementResultPage = lazy(() => import('../features/records/MeasurementResultPage').then(m => ({ default: m.MeasurementResultPage })))
const TriagePage = lazy(() => import('../features/triage/TriagePage'))
const RecordsPage = lazy(() => import('../features/records/RecordsPage'))
const LabReportScanner = lazy(() => import('../features/records/LabReportScanner'))
const RecordDetailPage = lazy(() => import('../features/records/RecordDetailPage'))
const EmergencyPage = lazy(() => import('../features/emergency/EmergencyPage'))
const ProfilePage = lazy(() => import('../features/profile/ProfilePage'))
const AnemiaScreeningPage = lazy(() => import('../features/vision/AnemiaScreeningPage'))
const ScleraScreeningPage = lazy(() => import('../features/vision/ScleraScreeningPage'))
const AdminPage = lazy(() => import('../features/admin/AdminPage'))
const BenchmarkMode = lazy(() => import('../features/developer/BenchmarkMode'))
const SignalLabPage = lazy(() => import('../features/developer/SignalLabPage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (session) return <Navigate to="/" replace />
  return <>{children}</>
}

import { ErrorBoundary } from './ErrorBoundary'

export default function Router() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public */}
          <Route path="/onboarding" element={<PublicRoute><Onboarding /></PublicRoute>} />
          <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

          {/* Protected — inside AppShell with nav */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<HomePage />} />
            <Route path="bio-aura" element={<BioAuraPage />} />
            <Route path="pulse-touch" element={<PulseTouchPage />} />
            <Route path="measurement-result/:id" element={<MeasurementResultPage />} />
            <Route path="triage" element={<TriagePage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="scan-lab-report" element={<LabReportScanner />} />
            <Route path="records/:id" element={<RecordDetailPage />} />
            <Route path="emergency" element={<EmergencyPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="anemia-screening" element={<AnemiaScreeningPage />} />
            <Route path="sclera-screening" element={<ScleraScreeningPage />} />
            <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="dev/benchmark" element={<BenchmarkMode />} />
            <Route path="dev/signal-lab" element={<SignalLabPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
