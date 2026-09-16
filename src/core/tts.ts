import { supabase } from './supabase'
import { log } from './logger'
import i18n from './i18n/i18n'
import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'

class TTSService {
  private audioContext: AudioContext | null = null
  private unlocked = false

  constructor() {
    // Register a one-time unlock listener for AudioContext on first user gesture
    // This is required in Android WebViews where audio is blocked until interaction
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio()
        window.removeEventListener('touchstart', unlock, true)
        window.removeEventListener('click', unlock, true)
      }
      window.addEventListener('touchstart', unlock, true)
      window.addEventListener('click', unlock, true)

      // Pre-load speech synthesis voices (needed on some Android WebViews)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices()
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices()
        }
      }
    }
  }

  private unlockAudio() {
    if (this.unlocked) return
    this.unlocked = true

    try {
      // Create and immediately resume AudioContext on user gesture
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Play a silent buffer to "warm up" the audio pipeline
      const buffer = this.audioContext.createBuffer(1, 1, 22050)
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(this.audioContext.destination)
      source.start(0)
      
      // Resume in case it was created in a suspended state
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

      log.tts('Audio unlocked successfully')
    } catch (err) {
      log.error('TTS', 'Failed to unlock audio', err)
    }
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    // Always try to resume in case it's suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
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
    
    // Resume if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

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
      // Final fallback: try browser speech synthesis
      this.browserFallback('Audio playback failed', 'en')
    }
  }

  private async browserFallback(text: string, lang: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        const langMap: Record<string, string> = {
          'en': 'en-US',
          'ta': 'ta-IN',
          'hi': 'hi-IN'
        }
        await TextToSpeech.speak({
          text: text,
          lang: langMap[lang] || 'en-US',
          rate: 0.9,
          pitch: 1.0,
          volume: 1.0
        })
        return
      } catch (e) {
        log.error('TTS', 'Native TTS failed', e)
        // Fallthrough to browser synthesis if native fails
      }
    }

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
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
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
