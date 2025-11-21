/**
 * Fastify app setup
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config.js';
import { parseRoute } from './routes/parse.js';
import { composeRoute } from './routes/compose.js';
import { readRoute } from './routes/read.js';
import { healthRoute } from './routes/health.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: config.env === 'production' ? 'info' : 'debug',
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: config.cors.origin,
  });

  // Swagger/OpenAPI
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Vyberology API',
        description: 'Volume 1 & 2 Reading Engine API - Deterministic numerology and narrative composition',
        version: '0.1.0',
      },
      tags: [
        { name: 'readings', description: 'Reading generation endpoints' },
        { name: 'system', description: 'System and health endpoints' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });

  // Error handler
  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);

    reply.code(error.statusCode || 500).send({
      success: false,
      error: {
        error: error.message,
        code: error.code || 'INTERNAL_ERROR',
      },
    });
  });

  // Register routes
  await fastify.register(healthRoute);
  await fastify.register(parseRoute);
  await fastify.register(composeRoute);
  await fastify.register(readRoute);

  return fastify;
}
