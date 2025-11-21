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
        // Extract user from Authorization header
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          return reply.code(401).send({
            success: false,
            error: {
              error: 'Missing or invalid authorization header',
              code: 'UNAUTHORIZED',
            },
          });
        }

        const token = authHeader.slice(7);
        const { getServiceClient, extractUserIdFromToken } = await import('../db.js');
        const userId = extractUserIdFromToken(token);

        if (!userId) {
          return reply.code(401).send({
            success: false,
            error: {
              error: 'Invalid token',
              code: 'UNAUTHORIZED',
            },
          });
        }

        const filters = HistoryFiltersSchema.parse(request.query);
        const db = getServiceClient();

        // Start with base query
        let query = db
          .from('readings')
          .select('id, input_name, input_birthdate, full_output, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(filters.limit);

        // Apply cursor pagination
        if (filters.cursor) {
          const { data: cursorReading } = await db
            .from('readings')
            .select('created_at')
            .eq('id', filters.cursor)
            .single();

          if (cursorReading) {
            query = query.lt('created_at', cursorReading.created_at);
          }
        }

        // Apply date range filters
        if (filters.from) {
          query = query.gte('created_at', filters.from);
        }
        if (filters.to) {
          query = query.lte('created_at', filters.to);
        }

        // Execute query
        const { data: readings, error } = await query;

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        // Transform to ReadingSummary format
        const summaries = (readings || []).map((r: any) => ({
          id: r.id,
          input_name: r.input_name,
          input_birthdate: r.input_birthdate,
          created_at: r.created_at,
          elements: r.full_output?.parse?.elements || {},
          chakras: r.full_output?.parse?.chakras || {},
          essence_preview: r.full_output?.compose?.sections?.essence?.substring(0, 200) || '',
        }));

        // Apply client-side filters (for text search, element, chakra, tag)
        let filtered = summaries;

        if (filters.q) {
          const lowerQ = filters.q.toLowerCase();
          filtered = filtered.filter(
            (r: any) =>
              r.input_name.toLowerCase().includes(lowerQ) ||
              r.essence_preview.toLowerCase().includes(lowerQ)
          );
        }

        if (filters.element) {
          filtered = filtered.filter((r: any) =>
            Object.keys(r.elements).some(
              (el) => el.toLowerCase() === filters.element!.toLowerCase()
            )
          );
        }

        if (filters.chakra) {
          filtered = filtered.filter((r: any) =>
            Object.keys(r.chakras).some(
              (ch) => ch.toLowerCase() === filters.chakra!.toLowerCase()
            )
          );
        }

        // Get total count (approximate)
        const { count } = await db
          .from('readings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Determine next cursor
        const nextCursor =
          filtered.length === filters.limit
            ? filtered[filtered.length - 1].id
            : undefined;

        return reply.code(200).send({
          success: true,
          data: {
            readings: filtered,
            total: count || 0,
            next_cursor: nextCursor,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

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
