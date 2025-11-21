/**
 * POST /v1/read
 * Convenience endpoint: input → parse → compose
 */

import type { FastifyPluginAsync } from 'fastify';
import { ReadingInputSchema, type ReadResponse } from '@vyberology/types';
import { buildEngine } from '@vyberology/core';
import { composeReading } from '@vyberology/composer';

export const readRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: unknown;
    Reply: ReadResponse;
  }>(
    '/v1/read',
    {
      schema: {
        description: 'Generate complete reading from input (parse + compose)',
        tags: ['readings'],
        body: {
          type: 'object',
          properties: {
            sourceType: { type: 'string', enum: ['text', 'image'] },
            rawText: { type: 'string' },
            ocrText: { type: 'string' },
            metadata: {
              type: 'object',
              properties: {
                context: { type: 'string' },
                locale: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
          required: ['sourceType'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  engine: { type: 'object' },
                  composed: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Validate input
        const input = ReadingInputSchema.parse(request.body);

        // Build engine reading
        const engine = buildEngine(input);

        // Compose narrative
        const composed = composeReading(engine);

        return reply.code(200).send({
          success: true,
          data: {
            engine,
            composed,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'READ_ERROR',
          },
        });
      }
    }
  );
};
