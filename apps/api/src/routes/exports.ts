/**
 * Exports API routes
 * POST /v1/exports - Queue export job
 * GET /v1/exports/:id - Get export status
 * GET /v1/exports - List user's exports
 */

import type { FastifyPluginAsync } from 'fastify';
import { CreateExportSchema } from '@vyberology/types';

export const exportsRoute: FastifyPluginAsync = async (fastify) => {
  // Queue export
  fastify.post<{
    Body: unknown;
  }>(
    '/v1/exports',
    {
      schema: {
        description: 'Queue a new export job',
        tags: ['exports'],
        body: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['csv', 'json'] },
            filters: { type: 'object' },
          },
          required: ['format'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  status: { type: 'string' },
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

        const exportRequest = CreateExportSchema.parse(request.body);
        const db = getServiceClient();

        // Insert export job
        const { data, error } = await db
          .from('exports')
          .insert({
            user_id: userId,
            format: exportRequest.format,
            status: 'queued',
            params: exportRequest.filters || {},
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        // TODO: Trigger export worker to process job
        // For now, job is just queued in database

        return reply.code(201).send({
          success: true,
          data,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'EXPORT_CREATE_ERROR',
          },
        });
      }
    }
  );

  // Get export status
  fastify.get<{
    Params: { id: string };
  }>(
    '/v1/exports/:id',
    {
      schema: {
        description: 'Get export job status',
        tags: ['exports'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
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

        const db = getServiceClient();

        // Query export with RLS check
        const { data, error } = await db
          .from('exports')
          .select('*')
          .eq('id', request.params.id)
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return reply.code(404).send({
              success: false,
              error: {
                error: 'Export not found or access denied',
                code: 'EXPORT_NOT_FOUND',
              },
            });
          }
          throw new Error(`Database error: ${error.message}`);
        }

        return reply.code(200).send({
          success: true,
          data,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'EXPORT_GET_ERROR',
          },
        });
      }
    }
  );

  // List exports
  fastify.get(
    '/v1/exports',
    {
      schema: {
        description: 'List all user exports',
        tags: ['exports'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  exports: { type: 'array' },
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

        const db = getServiceClient();

        // Query user's exports
        const { data: exports, error } = await db
          .from('exports')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return reply.code(200).send({
          success: true,
          data: {
            exports: exports || [],
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'EXPORT_LIST_ERROR',
          },
        });
      }
    }
  );
};
