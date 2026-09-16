import { Outlet } from 'react-router-dom'
import BottomNav from '../shared/components/BottomNav'
import SyncStatusBar from '../shared/components/SyncStatusBar'

export default function AppShell() {
  return (
    <div className="flex flex-col min-h-dvh">
      <SyncStatusBar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 24px)' }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
