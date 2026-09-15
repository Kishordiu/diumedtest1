-- Migration 001: profiles, consents, device_sessions, user_roles
-- Applied to: yogzsyrwboyvsomgnavd
-- Apply via: Supabase MCP or supabase db push

create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  date_of_birth date,
  sex text check (sex in ('male','female','other','prefer_not_to_say')),
  preferred_language text not null default 'en' check (preferred_language in ('en','ta','hi')),
  emergency_contact_name text,
  emergency_contact_phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  consent_type text not null,
  version text not null default '1.0',
  granted boolean not null default false,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.device_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id text not null,
  platform text,
  browser text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role text not null default 'user' check (role in ('user','admin')),
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, preferred_language)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'en');
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();
