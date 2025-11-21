/**
 * Tags API routes
 * POST /v1/tags - Create tag
 * GET /v1/tags - List user's tags
 * POST /v1/readings/:id/tags - Attach tags to reading
 * DELETE /v1/readings/:id/tags/:tagId - Remove tag from reading
 */

import type { FastifyPluginAsync } from 'fastify';
import { CreateTagSchema, AttachTagsSchema } from '@vyberology/types';

export const tagsRoute: FastifyPluginAsync = async (fastify) => {
  // Create tag
  fastify.post<{
    Body: unknown;
  }>(
    '/v1/tags',
    {
      schema: {
        description: 'Create a new tag',
        tags: ['tags'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 50 },
            color: { type: 'string', pattern: '^#[0-9a-f]{6}$' },
          },
          required: ['name'],
        },
        response: {
          201: {
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
        const tag = CreateTagSchema.parse(request.body);
        // TODO: Insert into Supabase with user_id

        return reply.code(201).send({
          success: true,
          data: {
            id: 'demo-tag-id',
            ...tag,
            color: tag.color || '#3b82f6',
            created_at: new Date().toISOString(),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'TAG_CREATE_ERROR',
          },
        });
      }
    }
  );

  // List tags
  fastify.get(
    '/v1/tags',
    {
      schema: {
        description: 'List all user tags',
        tags: ['tags'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  tags: { type: 'array' },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        // TODO: Query Supabase with user_id

        return reply.code(200).send({
          success: true,
          data: {
            tags: [],
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'TAG_LIST_ERROR',
          },
        });
      }
    }
  );

  // Attach tags to reading
  fastify.post<{
    Params: { id: string };
    Body: unknown;
  }>(
    '/v1/readings/:id/tags',
    {
      schema: {
        description: 'Attach tags to a reading',
        tags: ['tags'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            tag_ids: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              minItems: 1,
            },
          },
          required: ['tag_ids'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { tag_ids } = AttachTagsSchema.parse(request.body);
        // TODO: Insert into reading_tags with RLS check

        return reply.code(200).send({
          success: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'TAG_ATTACH_ERROR',
          },
        });
      }
    }
  );

  // Remove tag from reading
  fastify.delete<{
    Params: { id: string; tagId: string };
  }>(
    '/v1/readings/:id/tags/:tagId',
    {
      schema: {
        description: 'Remove tag from reading',
        tags: ['tags'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tagId: { type: 'string', format: 'uuid' },
          },
          required: ['id', 'tagId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // TODO: Delete from reading_tags with RLS check

        return reply.code(200).send({
          success: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'TAG_REMOVE_ERROR',
          },
        });
      }
    }
  );
};
