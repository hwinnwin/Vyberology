import { describe, it, expect } from 'vitest';
import { getCorsHeaders, corsHeaders, securityHeaders, withCors, requireJwt } from './security';

describe('security', () => {
  describe('getCorsHeaders', () => {
    it('returns matching origin when allowed', () => {
      const headers = getCorsHeaders('https://vyberology.com');
      expect(headers['Access-Control-Allow-Origin']).toBe('https://vyberology.com');
    });

    it('returns matching origin for www subdomain', () => {
      const headers = getCorsHeaders('https://www.vyberology.com');
      expect(headers['Access-Control-Allow-Origin']).toBe('https://www.vyberology.com');
    });

    it('returns matching origin for localhost:8080', () => {
      const headers = getCorsHeaders('http://localhost:8080');
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:8080');
    });

    it('returns matching origin for localhost:5173', () => {
      const headers = getCorsHeaders('http://localhost:5173');
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
    });

    it('falls back to primary domain for unknown origin', () => {
      const headers = getCorsHeaders('https://evil.com');
      expect(headers['Access-Control-Allow-Origin']).toBe('https://vyberology.com');
    });

    it('falls back to primary domain for null origin', () => {
      const headers = getCorsHeaders(null);
      expect(headers['Access-Control-Allow-Origin']).toBe('https://vyberology.com');
    });

    it('includes required CORS headers', () => {
      const headers = getCorsHeaders(null);
      expect(headers['Access-Control-Allow-Headers']).toContain('authorization');
      expect(headers['Access-Control-Allow-Headers']).toContain('content-type');
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });
  });

  describe('corsHeaders', () => {
    it('has static fallback origin', () => {
      expect(corsHeaders['Access-Control-Allow-Origin']).toBe('https://vyberology.com');
    });
  });

  describe('securityHeaders', () => {
    it('includes strict transport security', () => {
      expect(securityHeaders['Strict-Transport-Security']).toContain('max-age=');
    });

    it('includes X-Frame-Options DENY', () => {
      expect(securityHeaders['X-Frame-Options']).toBe('DENY');
    });

    it('includes nosniff', () => {
      expect(securityHeaders['X-Content-Type-Options']).toBe('nosniff');
    });

    it('includes XSS protection', () => {
      expect(securityHeaders['X-XSS-Protection']).toBe('1; mode=block');
    });

    it('includes referrer policy', () => {
      expect(securityHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('withCors', () => {
    it('returns 204 for OPTIONS preflight', async () => {
      const handler = withCors(async () => new Response('ok'));
      const req = new Request('http://localhost/test', {
        method: 'OPTIONS',
        headers: { origin: 'https://vyberology.com' },
      });
      const res = await handler(req);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://vyberology.com');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('adds CORS and security headers to response', async () => {
      const handler = withCors(async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      const req = new Request('http://localhost/test', {
        method: 'POST',
        headers: { origin: 'http://localhost:5173' },
      });
      const res = await handler(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('Content-Type')).toContain('application/json');
    });
  });

  describe('requireJwt', () => {
    it('returns ok:false when no Authorization header', () => {
      const req = new Request('http://localhost/test');
      const result = requireJwt(req);
      expect(result.ok).toBe(false);
    });

    it('returns ok:false for non-Bearer auth', () => {
      const req = new Request('http://localhost/test', {
        headers: { Authorization: 'Basic abc123' },
      });
      const result = requireJwt(req);
      expect(result.ok).toBe(false);
    });

    it('returns ok:false for short token', () => {
      const req = new Request('http://localhost/test', {
        headers: { Authorization: 'Bearer abc' },
      });
      const result = requireJwt(req);
      expect(result.ok).toBe(false);
    });

    it('returns ok:true for valid Bearer token', () => {
      const req = new Request('http://localhost/test', {
        headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test' },
      });
      const result = requireJwt(req);
      expect(result.ok).toBe(true);
    });

    it('returns 401 response when not ok', () => {
      const req = new Request('http://localhost/test');
      const result = requireJwt(req);
      if (!result.ok) {
        expect(result.response.status).toBe(401);
      }
    });
  });
});
