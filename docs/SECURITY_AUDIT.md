# SECURITY_AUDIT

## Date: 2026-09-15

## Frontend Secret Scan
Searched entire `src/` directory for: `service_role`, `sk-`, `GEMINI_API_KEY`, `ELEVENLABS`, `API_KEY`, `SECRET`, `PASSWORD`
**Result: ZERO matches.** No secrets exist in frontend code.

## Environment Variables
| Variable | Location | Type |
|----------|----------|------|
| `VITE_SUPABASE_URL` | `.env.local` | Public project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` | Publishable anon key (role: `anon`) |
| `FEATHERLESS_API_KEY` | Edge Function env only | Server-side only |
| `ELEVENLABS_API_KEY` | Edge Function env only | Server-side only |

No `service_role` key exists anywhere in the repository.

## Row Level Security (RLS)
All tables enforce RLS:
- **`health_measurements`**: `auth.uid() = user_id` for SELECT, INSERT
- **`profiles`**: Users can only SELECT and UPDATE their own profile
- **`user_roles`**: Admin-only via `is_admin()` function

## Edge Functions
All three Edge Functions perform JWT validation:
- `text-to-speech`: Checks `authorization` header before calling ElevenLabs
- `parse_lab_report`: Checks `authorization` header before calling Featherless
- `triage`: Checks `authorization` header before calling Featherless

## Data Privacy
- Conjunctival images are processed locally and NEVER uploaded to any server
- Lab report images are sent to the Edge Function for parsing but not stored permanently
- No health data is logged to browser console in production
- No sensitive text is logged by the TTS system

## .gitignore Verification
`.env.local` is properly listed in `.gitignore` — secrets will not be committed.
