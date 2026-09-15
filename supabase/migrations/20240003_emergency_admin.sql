-- Migration 003: emergency_events, admin_audit_logs
-- Applied to: yogzsyrwboyvsomgnavd
-- Apply via: Supabase MCP or supabase db push

create table public.emergency_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null check (event_type in ('CALL_112','CALL_CUSTOM','SMS_CUSTOM')),
  target text,
  status text not null check (status in ('INITIATED','HANDED_OFF','UNVERIFIABLE','FAILED')),
  initiated_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index emergency_events_user_id_idx on public.emergency_events(user_id);

create table public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
