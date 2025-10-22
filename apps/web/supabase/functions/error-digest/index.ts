import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const sbUrl = Deno.env.get('SUPABASE_URL')!;
const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
const slack = Deno.env.get('SLACK_WEBHOOK_URL');
const tz = Deno.env.get('DIGEST_LOCAL_TZ') ?? 'Australia/Melbourne';

Deno.serve(async () => {
  if (!slack) {
    return new Response('slack disabled', { status: 204 });
  }
  const sb = createClient(sbUrl, anon);
  const { data, error } = await sb.rpc('get_error_digest', { p_tz: tz });
  if (error) return new Response('rpc fail', { status: 500 });
  const { total, by_context, top_messages } = data as any;
  const text = [
    '*Vyberology — Daily Error Digest*',
    `*Total (24h):* ${total}`,
    `*By context:* ${(by_context ?? []).map((r: any) => `${r.context}: ${r.count}`).join(' • ') || '—'}`,
    '*Top messages:*',
    ...(top_messages ?? []).slice(0, 5).map((m: any, i: number) => `${i + 1}. ${m.message} — ${m.count}×`),
  ].join('\n');
  const res = await fetch(slack, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return new Response('slack fail', { status: 502 });
  return new Response('ok', { status: 200 });
});
