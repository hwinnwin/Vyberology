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
        const exportRequest = CreateExportSchema.parse(request.body);
        // TODO: Insert into exports table with user_id and status='queued'

        const exportId = 'demo-export-id';

        return reply.code(201).send({
          success: true,
          data: {
            id: exportId,
            status: 'queued',
            format: exportRequest.format,
            created_at: new Date().toISOString(),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

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
        // TODO: Query exports table with RLS check

        return reply.code(200).send({
          success: true,
          data: {
            id: request.params.id,
            status: 'queued',
            format: 'json',
            created_at: new Date().toISOString(),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

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
    async (_request, reply) => {
      try {
        // TODO: Query exports table with user_id

        return reply.code(200).send({
          success: true,
          data: {
            exports: [],
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

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
