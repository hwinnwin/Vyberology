-- Error Logs Table for Centralized Edge Function Error Tracking
-- Part of Production Readiness Phase 2 (P0-004)
-- Service role only access (bypasses RLS for Edge Functions)

-- up
create table if not exists public.error_logs (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  environment text not null check (environment in ('staging','production')),
  service text not null,
  level text not null check (level in ('error','warn','info')),
  request_id uuid,
  user_id uuid,
  code text,
  message text not null,
  details jsonb,
  ip inet,
  ua text
);

-- Indexes for common queries
create index if not exists error_logs_ts_idx on public.error_logs (ts desc);
create index if not exists error_logs_service_idx on public.error_logs (service);
create index if not exists error_logs_level_idx on public.error_logs (level);
create index if not exists error_logs_environment_idx on public.error_logs (environment);

-- Enable RLS
alter table public.error_logs enable row level security;

-- Service role only policies
create policy "error_logs read by service role"
  on public.error_logs
  for select
  using (auth.role() = 'service_role');

create policy "error_logs insert by service role"
  on public.error_logs
  for insert
  with check (auth.role() = 'service_role');

-- down
drop table if exists public.error_logs;
