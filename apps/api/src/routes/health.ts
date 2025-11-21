/**
 * GET /health
 * Health check endpoint
 */

import type { FastifyPluginAsync } from 'fastify';

export const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['system'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      return reply.code(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    }
  );
};
