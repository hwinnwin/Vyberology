export const securityHeaders: HeadersInit = {
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "referrer-policy": "same-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  // "content-security-policy": [
  //   "default-src 'self'",
  //   "img-src 'self' data:",
  //   "connect-src 'self' https://api.openai.com https://*.supabase.co",
  //   "script-src 'self'",
  //   "style-src 'self' 'unsafe-inline'",
  // ].join("; "),
};
