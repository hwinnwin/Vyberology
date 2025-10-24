import { buildCors, passesRateLimit, createSupabaseClient } from '../_shared/security.ts';

const C = (value: string | null | undefined, length: number) => (value ?? '').slice(0, length);
const J = (payload: unknown, length: number) =>
  C(typeof payload === 'string' ? payload : JSON.stringify(payload ?? ''), length);

type ErrorLogPayload = {
  environment: string;
  release: string;
  context: string;
  route: string;
  origin: string;
  ua: string;
  user_id_hash: string;
  ip_hash: string;
  severity: string;
  message: string;
  stack: string;
  meta: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const { headers, allowed } = buildCors(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!allowed) return new Response('Origin not allowed', { status: 403, headers });
  if (!(await passesRateLimit(req, 'log-error'))) return new Response('Rate limit exceeded', { status: 429, headers });

  try {
    const bodyJson = await req.json();
    const body = isRecord(bodyJson) ? bodyJson : {};
    const sb = createSupabaseClient(req);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
    const hash = async (value: string) =>
      Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    const ip_hash = await hash(ip);
    const { data: user } = await sb.auth.getUser();
    const user_id_hash = user?.user?.id ? await hash(user.user.id) : '';

    const payload: ErrorLogPayload = {
      environment: C(body.environment as string | undefined, 16) || 'beta',
      release: C(body.release as string | undefined, 64),
      context: C(body.context as string | undefined, 64) || 'client',
      route: C(body.route as string | undefined, 512),
      origin: C(origin, 256),
      ua: C(req.headers.get('user-agent'), 512),
      user_id_hash,
      ip_hash,
      severity: C(body.severity as string | undefined, 16) || 'error',
      message: J(body.message, 4000),
      stack: J(body.stack, 4000),
      meta: isRecord(body.meta) ? (body.meta as Record<string, unknown>) : {},
    };
    const { error } = await sb.rpc('write_error_log', payload);
    return new Response(error ? 'Logged (degraded)' : 'Logged', { status: 200, headers });
  } catch {
    return new Response('Bad Request', { status: 400, headers });
  }
});
