/**
 * POST /v1/compose
 * Compose narrative reading from engine data
 */

import type { FastifyPluginAsync } from 'fastify';
import { ReadingDataV1Schema, type ComposeResponse } from '@vyberology/types';
import { composeReading } from '@vyberology/composer';

export const composeRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: { data: unknown };
    Reply: ComposeResponse;
  }>(
    '/v1/compose',
    {
      schema: {
        description: 'Compose narrative reading from engine data',
        tags: ['readings'],
        body: {
          type: 'object',
          properties: {
            data: { type: 'object' },
          },
          required: ['data'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Validate engine data
        const engine = ReadingDataV1Schema.parse(request.body.data);

        // Compose reading
        const composed = composeReading(engine);

        return reply.code(200).send({
          success: true,
          data: composed,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'COMPOSE_ERROR',
          },
        });
      }
    }
  );
};
