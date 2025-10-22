-- error_logs: transient telemetry for beta. Retention: 30 days via scheduled purge (see 20251022_error_log_retention.sql).
create table if not exists public.error_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  environment text not null default 'beta',
  release text,
  context text not null,
  route text,
  origin text,
  ua text,
  user_id_hash text,
  ip_hash text,
  severity text not null default 'error',
  message text not null,
  stack text,
  meta jsonb default '{}'::jsonb
);

create index if not exists error_logs_created_at_idx on public.error_logs (created_at desc);
create index if not exists error_logs_env_ctx_idx on public.error_logs (environment, context, severity, created_at desc);
create index if not exists error_logs_meta_gin on public.error_logs using gin (meta);

revoke all on table public.error_logs from anon, authenticated;

create or replace function public.write_error_log(
  p_environment text, p_release text, p_context text,
  p_route text, p_origin text, p_ua text,
  p_user_id_hash text, p_ip_hash text,
  p_severity text, p_message text, p_stack text, p_meta jsonb
) returns void language plpgsql security definer as $$
begin
  insert into public.error_logs(environment, release, context, route, origin, ua,
    user_id_hash, ip_hash, severity, message, stack, meta)
  values (
    coalesce(p_environment,'beta'),
    left(p_release,64), left(p_context,64), left(p_route,512),
    left(p_origin,256), left(p_ua,512), left(p_user_id_hash,128),
    left(p_ip_hash,128), left(p_severity,16),
    left(p_message,4000), left(p_stack,4000), coalesce(p_meta,'{}'::jsonb)
  );
end; $$;

grant execute on function public.write_error_log(text,text,text,text,text,text,text,text,text,text,text,jsonb)
  to anon, authenticated;
