-- Migration 002: health_measurements, triage_assessments
-- Applied to: yogzsyrwboyvsomgnavd
-- Apply via: Supabase MCP or supabase db push

create table public.health_measurements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  measurement_type text not null check (measurement_type in ('heart_rate','spo2','respiratory_rate','hrv')),
  value_numeric numeric,
  unit text,
  quality text not null default 'UNKNOWN' check (quality in ('EXCELLENT','GOOD','FAIR','POOR','UNKNOWN')),
  status text not null default 'PENDING' check (status in ('PENDING','SAVED','FAILED','DISCARDED')),
  captured_at timestamptz not null default now(),
  duration_seconds integer,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index health_measurements_user_id_idx on public.health_measurements(user_id);
create index health_measurements_captured_at_idx on public.health_measurements(captured_at);

create table public.triage_assessments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  symptoms text[] not null,
  symptom_text text,
  input_language text not null default 'en',
  severity text not null check (severity in ('CRITICAL','HIGH','MEDIUM','LOW','UNKNOWN')),
  recommendation text not null,
  source text not null check (source in ('OFFLINE_RULE_ENGINE','ONLINE_AI_ASSISTANCE','HUMAN_OVERRIDE')),
  confidence numeric,
  model_metadata jsonb,
  limitations text,
  created_at timestamptz not null default now()
);

create index triage_assessments_user_id_idx on public.triage_assessments(user_id);
