// DiuMed Triage Edge Function
// Authenticates user, calls Gemini AI, returns structured triage result.
// 
// SECURITY:
// - JWT verification on every request
// - AI API key is a server-side secret (never in client bundle)
// - No raw user health data logged
// - Returns structured schema only

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM_PROMPT = `You are a symptom triage assistant for DiuMed, a mobile health app.

Your role:
- Assess symptom severity based on user description
- Provide a brief, actionable recommendation
- Clearly communicate limitations

You MUST:
- Use cautious, non-diagnostic language
- Never claim to diagnose a condition
- Always recommend seeking medical care for serious symptoms
- Keep recommendations brief and practical

You MUST NOT:
- Claim certainty about diagnoses
- Provide specific medication doses
- Replace emergency services

Respond ONLY with valid JSON in this exact schema:
{
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN",
  "recommendation": "Brief actionable guidance (1-2 sentences)",
  "limitations": "Brief disclaimer about assessment limitations",
  "confidence": 0.0-1.0
}

Severity definitions:
- CRITICAL: Potential life-threatening emergency (call emergency services immediately)
- HIGH: Needs medical attention today
- MEDIUM: Monitor and see a doctor if worsening
- LOW: Mild symptoms, home management appropriate
- UNKNOWN: Cannot assess from provided information`

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // Verify JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // Parse request body
  let symptomText: string
  try {
    const body = await req.json()
    symptomText = String(body.symptomText ?? '').trim()
    if (!symptomText || symptomText.length > 2000) {
      throw new Error('Invalid symptom text')
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // Check API key availability
  const FEATHERLESS_API_KEY = Deno.env.get('FEATHERLESS_API_KEY')
  if (!FEATHERLESS_API_KEY) {
    return new Response(JSON.stringify({ error: 'Online AI service is temporarily unavailable.' }), {
      status: 503,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // Call Featherless API (OpenAI compatible) with timeout and retry
  const MAX_RETRIES = 1;
  const TIMEOUT_MS = 15000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const aiResponse = await fetch(
        'https://api.featherless.ai/v1/chat/completions',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FEATHERLESS_API_KEY}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'Qwen/Qwen2.5-7B-Instruct', // Standard fast model (Ungated)
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Symptom description: ${symptomText}` }
            ],
            temperature: 0.1,
            max_tokens: 512,
            response_format: { type: "json_object" }
          }),
        }
      )
      clearTimeout(timeoutId);

      if (!aiResponse.ok) {
        const errText = await aiResponse.text()
        console.error('[TRIAGE] AI API error:', aiResponse.status)
        if (aiResponse.status >= 500 && attempt < MAX_RETRIES) {
          continue; // Retry on 5xx
        }
        throw new Error(`AI API error: ${aiResponse.status}`)
      }

      const aiData = await aiResponse.json()
      const rawText = aiData?.choices?.[0]?.message?.content

      if (!rawText) {
        throw new Error('Empty response from AI')
      }

      // Parse and validate response
      let parsed: {
        severity: string
        recommendation: string
        limitations: string
        confidence: number
      }
      try {
        parsed = JSON.parse(rawText)
      } catch {
        throw new Error('Invalid JSON from AI Provider')
      }

      const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']
      const severity = validSeverities.includes(parsed.severity) ? parsed.severity : 'UNKNOWN'

      const result = {
        severity,
        recommendation: String(parsed.recommendation ?? 'Please consult a healthcare professional.').slice(0, 500),
        limitations: String(parsed.limitations ?? 'This is not a medical diagnosis.').slice(0, 300),
        confidence: typeof parsed.confidence === 'number'
          ? Math.max(0, Math.min(1, parsed.confidence))
          : null,
        source: 'ONLINE_AI_ASSISTANCE',
      }

      console.log('[TRIAGE] provider_request_success');
      return new Response(JSON.stringify(result), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })

    } catch (err: any) {
      if (attempt < MAX_RETRIES && (err.name === 'AbortError' || err.message.includes('fetch'))) {
        console.warn(`[TRIAGE] Attempt ${attempt + 1} failed, retrying...`);
        continue;
      }
      console.error('[TRIAGE] Processing error:', err.message)
      return new Response(JSON.stringify({ error: 'AI processing failed' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
  }
})
