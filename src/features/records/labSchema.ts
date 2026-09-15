export type BiomarkerStatus = 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN'

export function determineBiomarkerStatus(value: number, referenceRange: string): BiomarkerStatus {
  // Very basic parser for ranges like "12.0 - 15.5", "< 5", "> 10"
  if (!referenceRange || typeof referenceRange !== 'string') return 'UNKNOWN'

  const cleanRange = referenceRange.replace(/[^\d.<>-]/g, '').trim()

  if (cleanRange.includes('-')) {
    const parts = cleanRange.split('-')
    if (parts.length === 2) {
      const min = parseFloat(parts[0])
      const max = parseFloat(parts[1])
      if (!isNaN(min) && !isNaN(max)) {
        if (value < min) return 'LOW'
        if (value > max) return 'HIGH'
        return 'NORMAL'
      }
    }
  }

  if (cleanRange.startsWith('<')) {
    const max = parseFloat(cleanRange.substring(1))
    if (!isNaN(max)) {
      return value < max ? 'NORMAL' : 'HIGH'
    }
  }

  if (cleanRange.startsWith('>')) {
    const min = parseFloat(cleanRange.substring(1))
    if (!isNaN(min)) {
      return value > min ? 'NORMAL' : 'LOW'
    }
  }

  return 'UNKNOWN'
}
