/**
 * GET /v1/history
 * Paginated reading history with filters
 */

import type { FastifyPluginAsync } from 'fastify';
import { HistoryFiltersSchema, type HistoryResponse } from '@vyberology/types';

export const historyRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Querystring: unknown;
    Reply: HistoryResponse;
  }>(
    '/v1/history',
    {
      schema: {
        description: 'Get reading history with filters',
        tags: ['history'],
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string', description: 'Text search query' },
            element: { type: 'string', description: 'Filter by element' },
            chakra: { type: 'string', description: 'Filter by chakra' },
            tag: { type: 'string', description: 'Filter by tag name' },
            from: { type: 'string', format: 'date-time', description: 'Start date' },
            to: { type: 'string', format: 'date-time', description: 'End date' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            cursor: { type: 'string', format: 'uuid', description: 'Pagination cursor' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  readings: { type: 'array' },
                  total: { type: 'number' },
                  next_cursor: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // TODO: Get user ID from auth middleware
        // For now, return demo data
        const filters = HistoryFiltersSchema.parse(request.query);

        // Mock implementation - replace with actual Supabase query
        const readings = [];
        const total = 0;

        return reply.code(200).send({
          success: true,
          data: {
            readings,
            total,
            next_cursor: undefined,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'HISTORY_ERROR',
          },
        });
      }
    }
  );
};
