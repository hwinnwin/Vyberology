create table if not exists public.rate_limit_log (
  scope text not null,
  key text not null,
  count int not null default 0,
  reset_at timestamptz not null,
  inserted_at timestamptz not null default now(),
  primary key (scope, key)
);

create index if not exists rate_limit_log_reset_at_idx on public.rate_limit_log (reset_at);

create or replace function public.record_call(
  _scope text,
  _key text,
  _limit integer,
  _window_sec integer
) returns boolean
language plpgsql
security definer
as $$
declare
  v_now timestamptz := now();
  v_reset timestamptz := v_now + make_interval(secs => greatest(_window_sec, 1));
  v_entry public.rate_limit_log%rowtype;
begin
  if _limit is null or _limit <= 0 then
    return true;
  end if;

  loop
    select * into v_entry
    from public.rate_limit_log
    where scope = _scope and key = _key
    for update;

    if not found then
      begin
        insert into public.rate_limit_log(scope, key, count, reset_at)
        values (_scope, _key, 1, v_reset);
        return true;
      exception
        when unique_violation then
          -- Row was inserted by another transaction, retry loop
          null;
      end;
    else
      if v_now >= v_entry.reset_at then
        update public.rate_limit_log
        set count = 1,
            reset_at = v_reset,
            inserted_at = v_now
        where scope = _scope and key = _key;
        return true;
      end if;

      if v_entry.count >= _limit then
        return false;
      end if;

      update public.rate_limit_log
      set count = v_entry.count + 1,
          inserted_at = v_now
      where scope = _scope and key = _key;
      return true;
    end if;
  end loop;
end;
$$;

grant select, insert, update, delete on public.rate_limit_log to authenticated, anon;
grant execute on function public.record_call(text, text, integer, integer) to authenticated, anon;
