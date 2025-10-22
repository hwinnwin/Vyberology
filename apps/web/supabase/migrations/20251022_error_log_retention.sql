create or replace function public.purge_old_error_logs()
returns void language plpgsql as $$
begin
  delete from public.error_logs where created_at < now() - interval '30 days';
end; $$;
