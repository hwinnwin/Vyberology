// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://vyberology.com',
  'https://www.vyberology.com',
  'http://localhost:8080',
  'http://localhost:5173',
];

// Build CORS headers with origin checking
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Static fallback for contexts without a request (e.g. error responses)
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://vyberology.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security headers
export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

type Handler = (req: Request) => Promise<Response> | Response;

// Middleware to add CORS headers to responses
export function withCors(handler: Handler): Handler {
  return async (req: Request) => {
    const origin = req.headers.get('origin');
    const dynamicCors = getCorsHeaders(origin);

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...dynamicCors, ...securityHeaders },
      });
    }

    const response = await handler(req);
    const headers = new Headers(response.headers);

    // Add CORS and security headers
    Object.entries({ ...dynamicCors, ...securityHeaders }).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

// JWT authentication check
export function requireJwt(req: Request): { ok: true } | { ok: false; response: Response } {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      ),
    };
  }

  // Basic validation - actual JWT verification happens at Supabase edge function level
  const token = authHeader.replace('Bearer ', '');
  if (!token || token.length < 10) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      ),
    };
  }

  return { ok: true };
}
