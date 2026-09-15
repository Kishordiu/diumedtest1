// Simple PWA icon generator using Canvas API (Node.js compatible with canvas package)
// Run: node scripts/generate-icons.mjs
// Outputs all required icon sizes to public/icons/

import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(iconsDir, { recursive: true })

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

function drawIcon(canvas) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  const cx = w / 2
  const cy = h / 2

  // Background
  ctx.fillStyle = '#0D1012'
  ctx.beginPath()
  // Rounded rect
  const r = w * 0.22
  ctx.moveTo(r, 0)
  ctx.lineTo(w - r, 0)
  ctx.arcTo(w, 0, w, r, r)
  ctx.lineTo(w, h - r)
  ctx.arcTo(w, h, w - r, h, r)
  ctx.lineTo(r, h)
  ctx.arcTo(0, h, 0, h - r, r)
  ctx.lineTo(0, r)
  ctx.arcTo(0, 0, r, 0, r)
  ctx.closePath()
  ctx.fill()

  const scale = w / 64

  // Outer ring
  ctx.strokeStyle = 'rgba(83,183,168,0.35)'
  ctx.lineWidth = 1.5 * scale
  ctx.beginPath()
  ctx.arc(cx, cy, 22 * scale, 0, Math.PI * 2)
  ctx.stroke()

  // Inner ring
  ctx.strokeStyle = 'rgba(83,183,168,0.55)'
  ctx.lineWidth = scale
  ctx.beginPath()
  ctx.arc(cx, cy, 14 * scale, 0, Math.PI * 2)
  ctx.stroke()

  // Aperture arcs (3 segments)
  ctx.strokeStyle = '#F5F2EA'
  ctx.lineWidth = 2.5 * scale
  ctx.lineCap = 'round'

  // Arc 1: top to right
  ctx.beginPath()
  ctx.arc(cx, cy, 14 * scale, -Math.PI / 2, 0.5)
  ctx.stroke()

  // Arc 2: right to bottom-left
  ctx.beginPath()
  ctx.arc(cx, cy, 14 * scale, 1.5, Math.PI * 0.9)
  ctx.stroke()

  // Arc 3: bottom-left to top
  ctx.beginPath()
  ctx.arc(cx, cy, 14 * scale, Math.PI * 1.2, -Math.PI / 2 - 0.3)
  ctx.stroke()

  // Signal pulse path
  const pts = [
    [20, 32], [25, 32], [27, 26], [30, 38], [33, 28], [36, 35], [38, 32], [44, 32]
  ]
  ctx.strokeStyle = '#53B7A8'
  ctx.lineWidth = 1.5 * scale
  ctx.beginPath()
  ctx.moveTo(pts[0][0] * scale, pts[0][1] * scale)
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0] * scale, pts[i][1] * scale)
  }
  ctx.stroke()

  // Center dot
  ctx.fillStyle = '#53B7A8'
  ctx.beginPath()
  ctx.arc(cx, cy, 1.5 * scale, 0, Math.PI * 2)
  ctx.fill()
}

for (const size of SIZES) {
  const canvas = createCanvas(size, size)
  drawIcon(canvas)
  const buffer = canvas.toBuffer('image/png')
  const outputPath = join(iconsDir, `icon-${size}.png`)
  writeFileSync(outputPath, buffer)
  console.log(`Generated: icon-${size}.png`)
}

console.log('All icons generated successfully.')
