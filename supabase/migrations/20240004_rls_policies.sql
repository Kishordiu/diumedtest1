-- Migration 004: RLS Policies
-- Applied to: yogzsyrwboyvsomgnavd
-- Apply via: Supabase MCP or supabase db push

alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.device_sessions enable row level security;
alter table public.user_roles enable row level security;
alter table public.health_measurements enable row level security;
alter table public.triage_assessments enable row level security;
alter table public.emergency_events enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Helper function for admin checks to prevent infinite recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- User Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own consents" on public.consents for select using (auth.uid() = user_id);
create policy "Users can manage own consents" on public.consents for all using (auth.uid() = user_id);

create policy "Users can manage own sessions" on public.device_sessions for all using (auth.uid() = user_id);

create policy "Users can view own role" on public.user_roles for select using (auth.uid() = user_id);

create policy "Users can manage own measurements" on public.health_measurements for all using (auth.uid() = user_id);

create policy "Users can manage own triage" on public.triage_assessments for all using (auth.uid() = user_id);

create policy "Users can insert own emergency events" on public.emergency_events for insert with check (auth.uid() = user_id);
create policy "Users can view own emergency events" on public.emergency_events for select using (auth.uid() = user_id);
create policy "Users can update own emergency events" on public.emergency_events for update using (auth.uid() = user_id);

-- Admin Policies
create policy "Admins can view all profiles" on public.profiles for select using (public.is_admin());
create policy "Admins can view all measurements" on public.health_measurements for select using (public.is_admin());
create policy "Admins can view all triage" on public.triage_assessments for select using (public.is_admin());
create policy "Admins can view roles" on public.user_roles for select using (public.is_admin());
create policy "Admins can manage roles" on public.user_roles for all using (public.is_admin());
create policy "Admins can view audit logs" on public.admin_audit_logs for select using (public.is_admin());
