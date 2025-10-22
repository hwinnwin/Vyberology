create or replace function public.get_error_digest(p_tz text)
returns json language sql as $$
  with win as (
    select (now() at time zone p_tz) - interval '24 hours' as since
  ),
  filtered as (
    select * from public.error_logs, win
    where created_at >= (select since from win at time zone 'utc')
  ),
  by_context as (
    select context, count(*) as count from filtered group by 1 order by 2 desc
  ),
  top_messages as (
    select left(message,200) as message, count(*) as count
    from filtered group by 1 order by 2 desc limit 10
  )
  select json_build_object(
    'total',(select count(*) from filtered),
    'by_context',(select json_agg(by_context) from by_context),
    'top_messages',(select json_agg(top_messages) from top_messages)
  );
$$;
