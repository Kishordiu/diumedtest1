import DiuMedLogo from './DiuMedLogo'

export default function LoadingScreen() {
  return (
    <div
      className="min-h-dvh min-h-screen bg-mineral-black flex flex-col items-center justify-center"
      aria-label="Loading DiuMed"
      role="status"
    >
      <div className="text-signal-teal animate-signal-pulse">
        <DiuMedLogo size={48} />
      </div>
      <p className="mt-4 text-muted-slate text-sm tracking-widest uppercase">Loading</p>
    </div>
  )
}
