/**
 * Analytics API routes
 * GET /v1/analytics/elements - Elements distribution over time
 * GET /v1/analytics/chakras - Chakras distribution over time
 */

import type { FastifyPluginAsync } from 'fastify';
import { AnalyticsRangeSchema } from '@vyberology/types';

export const analyticsRoute: FastifyPluginAsync = async (fastify) => {
  // Elements analytics
  fastify.get<{
    Querystring: unknown;
  }>(
    '/v1/analytics/elements',
    {
      schema: {
        description: 'Get elements distribution over time',
        tags: ['analytics'],
        querystring: {
          type: 'object',
          properties: {
            from: { type: 'string', format: 'date-time' },
            to: { type: 'string', format: 'date-time' },
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
                  series: { type: 'array' },
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

        const range = AnalyticsRangeSchema.parse(request.query);
        const db = getServiceClient();

        // Query v_elements_daily view
        let query = db
          .from('v_elements_daily')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: true });

        if (range.from) {
          query = query.gte('date', range.from);
        }
        if (range.to) {
          query = query.lte('date', range.to);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        // Transform to time series format
        const series = (data || []).map((row: any) => ({
          date: row.date,
          earth: row.earth_count,
          water: row.water_count,
          fire: row.fire_count,
          air: row.air_count,
          ether: row.ether_count,
        }));

        return reply.code(200).send({
          success: true,
          data: {
            series,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'ANALYTICS_ERROR',
          },
        });
      }
    }
  );

  // Chakras analytics
  fastify.get<{
    Querystring: unknown;
  }>(
    '/v1/analytics/chakras',
    {
      schema: {
        description: 'Get chakras distribution over time',
        tags: ['analytics'],
        querystring: {
          type: 'object',
          properties: {
            from: { type: 'string', format: 'date-time' },
            to: { type: 'string', format: 'date-time' },
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
                  series: { type: 'array' },
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

        const range = AnalyticsRangeSchema.parse(request.query);
        const db = getServiceClient();

        // Query v_chakras_daily view
        let query = db
          .from('v_chakras_daily')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: true });

        if (range.from) {
          query = query.gte('date', range.from);
        }
        if (range.to) {
          query = query.lte('date', range.to);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        // Transform to time series format
        const series = (data || []).map((row: any) => ({
          date: row.date,
          root: row.root_count,
          sacral: row.sacral_count,
          solar: row.solar_count,
          heart: row.heart_count,
          throat: row.throat_count,
          third_eye: row.third_eye_count,
          crown: row.crown_count,
        }));

        return reply.code(200).send({
          success: true,
          data: {
            series,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'ANALYTICS_ERROR',
          },
        });
      }
    }
  );
};
