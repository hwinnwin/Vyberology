/**
 * API Configuration
 */

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  rateLimit: {
    unauth: 30, // requests per minute
    auth: 300,  // requests per minute
  },
};
