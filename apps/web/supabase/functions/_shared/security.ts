import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const defaultAllowedOrigins = 'http://localhost:8080,capacitor://localhost';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? defaultAllowedOrigins)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const baseCors = {
  Vary: 'Origin',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function buildCors(origin: string | null) {
  const normalized = origin?.trim() ?? '';
  const allowed = !normalized || allowedOrigins.includes(normalized);
  const headers = allowed && normalized
    ? { ...baseCors, 'Access-Control-Allow-Origin': normalized }
    : baseCors;
  return { headers, allowed };
}

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
