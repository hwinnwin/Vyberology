import { buildCors, passesRateLimit, createSupabaseClient } from '../_shared/security.ts';

const C = (s: string, n: number) => (s ?? '').slice(0, n);
const J = (v: unknown, n: number) => C(typeof v === 'string' ? v : JSON.stringify(v ?? ''), n);

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const { headers, allowed } = buildCors(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!allowed) return new Response('Origin not allowed', { status: 403, headers });
  if (!(await passesRateLimit(req, 'log-error'))) return new Response('Rate limit exceeded', { status: 429, headers });

  try {
    const body = await req.json();
    const sb = createSupabaseClient(req);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
    const hash = async (v: string) =>
      Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    const ip_hash = await hash(ip);
    const { data: user } = await sb.auth.getUser();
    const user_id_hash = user?.user?.id ? await hash(user.user.id) : '';

    const payload = {
      environment: C(body.environment ?? 'beta', 16),
      release: C(body.release ?? '', 64),
      context: C(body.context ?? 'client', 64),
      route: C(body.route ?? '', 512),
      origin: C(origin ?? '', 256),
      ua: C(req.headers.get('user-agent') ?? '', 512),
      user_id_hash,
      ip_hash,
      severity: C(body.severity ?? 'error', 16),
      message: J(body.message, 4000),
      stack: J(body.stack, 4000),
      meta: typeof body.meta === 'object' && body.meta ? body.meta : {},
    };
    const { error } = await sb.rpc('write_error_log', payload as any);
    return new Response(error ? 'Logged (degraded)' : 'Logged', { status: 200, headers });
  } catch {
    return new Response('Bad Request', { status: 400, headers });
  }
});
