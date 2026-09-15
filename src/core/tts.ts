import { supabase } from './supabase'
import { log } from './logger'
import i18n from './i18n/i18n'

class TTSService {
  private audioContext: AudioContext | null = null

  constructor() {
    // Only create AudioContext on first user interaction or when needed
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  async speak(text: string) {
    this.initAudioContext()
    const lang = i18n.language as 'en' | 'ta' | 'hi'

    try {
      // 1. Try Edge Function
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language: lang }
      })

      if (error) {
        throw error
      }

      if (data?.audioBase64) {
        await this.playBase64(data.audioBase64)
        return
      }

      if (data?.error === 'PROVIDER_NOT_CONFIGURED') {
        console.warn('Edge TTS provider not configured, falling back to browser synthesis.')
        this.browserFallback(text, lang)
        return
      }
    } catch (err: any) {
      log.error('error', 'Edge TTS failed, falling back to browser synthesis', err)
      this.browserFallback(text, lang)
    }
  }

  private async playBase64(base64: string) {
    if (!this.audioContext) return
    const binaryStr = window.atob(base64)
    const len = binaryStr.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer)
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.audioContext.destination)
      source.start(0)
    } catch (err) {
      log.error('TTS', 'Failed to play decoded audio', err)
    }
  }

  private browserFallback(text: string, lang: string) {
    if (!('speechSynthesis' in window)) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Map i18n lang to BCP 47
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'ta': 'ta-IN',
      'hi': 'hi-IN'
    }
    
    utterance.lang = langMap[lang] || 'en-US'
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const targetLang = utterance.lang.split('-')[0]
      const voice = voices.find(v => v.lang.startsWith(targetLang))
      if (voice) {
        utterance.voice = voice
      }
    }

    window.speechSynthesis.speak(utterance)
  }
}

export const tts = new TTSService()
