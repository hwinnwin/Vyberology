import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { securityHeaders } from '../_lib/securityHeaders.ts';

const fallbackOrigins = [
  'https://vyberology.com',
  'https://vyberology.app',
  'https://beta.vyberology.app',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:5173',
  'http://localhost:8080',
];

export const getAllowedOrigins = (): string[] => {
  const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured.length > 0 ? configured : fallbackOrigins;
};

const baseCors = {
  Vary: 'Origin',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
} as const;

export const corsHeaders = (origin: string | null) => {
  const allowedOrigins = getAllowedOrigins();
  const normalized = origin?.trim();
  const isAllowed = normalized ? allowedOrigins.includes(normalized) : false;
  const target = isAllowed && normalized ? normalized : allowedOrigins[0] ?? 'https://vyberology.app';

  return {
    ...baseCors,
    'Access-Control-Allow-Origin': target,
  };
};

const applySecurityHeaders = (headers: Headers) => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });
};

export const handleOptions = (req: Request) => {
  const headers = new Headers(corsHeaders(req.headers.get('Origin')));
  applySecurityHeaders(headers);
  return new Response(null, { status: 204, headers });
};

export const withCors =
  (handler: (req: Request) => Promise<Response> | Response) =>
  async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return handleOptions(req);
    }

    const response = await handler(req);
    const headers = new Headers(response.headers);
    const cors = corsHeaders(req.headers.get('Origin'));
    Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
    applySecurityHeaders(headers);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };

export const buildCors = (origin: string | null) => {
  const headersInit = {
    ...securityHeaders,
    ...corsHeaders(origin),
  };
  const headers = headersInit;
  const normalized = origin?.trim();
  const allowed =
    !normalized ||
    headers['Access-Control-Allow-Origin'] === normalized ||
    headers['Access-Control-Allow-Origin'] === '*';

  return { headers, allowed };
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

export function createSupabaseClient(req?: Request) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: req
      ? {
          headers: {
            Authorization: req.headers.get('Authorization') ?? '',
          },
        }
      : undefined,
  });
}

export async function passesRateLimit(
  req: Request,
  scope: string,
  limit = 10,
  windowSec = 60
): Promise<boolean> {
  if (limit <= 0) return true;

  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('cf-connecting-ip') ??
      '0.0.0.0';

    const client = createSupabaseClient(req);

    const { data, error } = await client.rpc('record_call', {
      _scope: scope,
      _key: ip,
      _limit: limit,
      _window_sec: windowSec,
    });

    if (error) {
      console.error(`record_call failed for scope=${scope}`, error);
      return true;
    }

    return data !== false;
  } catch (err) {
    console.error(`Rate limit check failed for scope=${scope}`, err);
    return true;
  }
}

export type JwtCheckResult =
  | { ok: true; token: string }
  | { ok: false; response: Response };

export function requireJwt(req: Request): JwtCheckResult {
  const authorization = req.headers.get('Authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        {
          status: 401,
          headers: {
            ...securityHeaders,
            ...corsHeaders(req.headers.get('Origin')),
            'Content-Type': 'application/json',
          },
        }
      ),
    };
  }

  return { ok: true, token: match[1] };
}

export function optionalJwt(req: Request): { token: string | null } {
  const authorization = req.headers.get('Authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return { token: match?.[1] ?? null };
}
