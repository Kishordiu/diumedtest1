import { Outlet } from 'react-router-dom'
import BottomNav from '../shared/components/BottomNav'
import SyncStatusBar from '../shared/components/SyncStatusBar'

export default function AppShell() {
  return (
    <div className="flex flex-col min-h-dvh min-h-screen bg-mineral-black">
      <SyncStatusBar />
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
