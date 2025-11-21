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
import { historyRoute } from './routes/history.js';
import { notesRoute } from './routes/notes.js';
import { tagsRoute } from './routes/tags.js';
import { exportsRoute } from './routes/exports.js';
import { analyticsRoute } from './routes/analytics.js';

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
        description: 'Volumes I, II & V - Deterministic numerology, narrative composition, and integration layer',
        version: '0.3.0',
      },
      tags: [
        { name: 'readings', description: 'Reading generation endpoints (Volumes I & II)' },
        { name: 'history', description: 'Reading history and search (Volume V)' },
        { name: 'notes', description: 'Journaling and notes (Volume V)' },
        { name: 'tags', description: 'Tag management (Volume V)' },
        { name: 'exports', description: 'Data export (Volume V)' },
        { name: 'analytics', description: 'Usage analytics (Volume V)' },
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
  // System
  await fastify.register(healthRoute);

  // Volumes I & II
  await fastify.register(parseRoute);
  await fastify.register(composeRoute);
  await fastify.register(readRoute);

  // Volume V (Integration Layer)
  await fastify.register(historyRoute);
  await fastify.register(notesRoute);
  await fastify.register(tagsRoute);
  await fastify.register(exportsRoute);
  await fastify.register(analyticsRoute);

  return fastify;
}
