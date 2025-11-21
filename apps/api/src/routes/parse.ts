/**
 * POST /v1/parse
 * Parse input and return ReadingDataV1
 */

import type { FastifyPluginAsync } from 'fastify';
import { ReadingInputSchema, type ParseResponse } from '@vyberology/types';
import { buildEngine } from '@vyberology/core';

export const parseRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: unknown;
    Reply: ParseResponse;
  }>(
    '/v1/parse',
    {
      schema: {
        description: 'Parse input and extract numerology data',
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
              data: { type: 'object' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  code: { type: 'string' },
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
        const data = buildEngine(input);

        return reply.code(200).send({
          success: true,
          data,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'PARSE_ERROR',
          },
        });
      }
    }
  );
};
