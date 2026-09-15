// DiuMed structured logger
// Prefixed logging — silent in production

const isDev = import.meta.env.DEV

function createLogger(module: string) {
  return (...args: unknown[]) => {
    if (isDev) {
      console.log(`[DIUMED][${module}]`, ...args)
    }
  }
}

export const log = {
  auth: createLogger('AUTH'),
  camera: createLogger('CAMERA'),
  rppg: createLogger('RPPG'),
  triage: createLogger('TRIAGE'),
  sync: createLogger('SYNC'),
  db: createLogger('DB'),
  emergency: createLogger('EMERGENCY'),
  offline: createLogger('OFFLINE'),
  cppg: createLogger('CPPG'),
  tts: createLogger('TTS'),
  vision: createLogger('VISION'),
  lab: createLogger('LAB'),
  error: (module: string, ...args: unknown[]) => {
    // Always log errors, but never include health data or tokens
    console.error(`[DIUMED][${module}][ERROR]`, ...args)
  },
}
