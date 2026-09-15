import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  text: string
  language: 'en' | 'ta' | 'hi'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const execId = crypto.randomUUID()
  const startTime = Date.now()

  const log = (status: string, extra: Record<string, any> = {}) => {
    console.log(JSON.stringify({
      log_type: '[DIUMED][EDGE][TTS]',
      execution_id: execId,
      status,
      duration_ms: Date.now() - startTime,
      ...extra
    }))
  }

  log('request_received')

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      log('unauthorized', { reason: 'missing_auth_header' })
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    if (!API_KEY) {
      log('provider_config_missing', { secret: 'ELEVENLABS_API_KEY' })
      return new Response(JSON.stringify({ error: 'PROVIDER_NOT_CONFIGURED', details: 'ELEVENLABS_API_KEY is not set.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: RequestBody = await req.json()
    if (!body.text || !body.language) {
      log('bad_request', { reason: 'missing_fields' })
      return new Response(JSON.stringify({ error: 'Missing text or language.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Voice mapping (example Voice IDs for ElevenLabs)
    // English: Rachel (21m00Tcm4TlvDq8ikWAM)
    // Multilingual voices on ElevenLabs v2 support Tamil and Hindi natively
    const voiceMap = {
      en: '21m00Tcm4TlvDq8ikWAM',
      ta: '21m00Tcm4TlvDq8ikWAM', 
      hi: '21m00Tcm4TlvDq8ikWAM'
    }

    const voiceId = voiceMap[body.language] || voiceMap.en

    log('provider_request_started', { language: body.language, text_length: body.text.length })
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: body.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    })

    log('provider_response_received', { provider_status: response.status })

    if (!response.ok) {
      const err = await response.text()
      log('provider_error', { provider_status: response.status, details: err })
      return new Response(JSON.stringify({ error: 'PROVIDER_ERROR', details: \`Provider returned \${response.status}\` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

    log('completed', { audio_size_bytes: audioBuffer.byteLength })

    return new Response(JSON.stringify({ audioBase64: base64Audio }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    log('internal_error', { safe_error: error.message })
    return new Response(JSON.stringify({ error: 'INTERNAL_ERROR', details: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
