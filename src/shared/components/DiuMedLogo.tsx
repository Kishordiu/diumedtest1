// DiuMed original SVG logo
// Abstract aperture/pulse mark — circular optical signal with measurement notch

export default function DiuMedLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DiuMed"
      role="img"
    >
      {/* Outer aperture ring */}
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      {/* Inner measurement ring */}
      <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      {/* Aperture blades — 3 segments with gaps */}
      <path
        d="M32 12 A20 20 0 0 1 49.5 22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M50.5 34 A20 20 0 0 1 32 52"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M20 48 A20 20 0 0 1 12 28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Signal pulse line through center */}
      <path
        d="M20 32 L25 32 L27 26 L30 38 L33 28 L36 36 L38 32 L44 32"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center focal point */}
      <circle cx="32" cy="32" r="2" fill="currentColor" />
    </svg>
  )
}
