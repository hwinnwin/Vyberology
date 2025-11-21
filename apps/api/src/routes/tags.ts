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

        const tag = CreateTagSchema.parse(request.body);
        const db = getServiceClient();

        // Insert tag
        const { data, error } = await db
          .from('tags')
          .insert({
            user_id: userId,
            name: tag.name,
            color: tag.color || '#3b82f6',
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            // Unique constraint violation
            return reply.code(409).send({
              success: false,
              error: {
                error: 'Tag name already exists',
                code: 'TAG_DUPLICATE',
              },
            });
          }
          throw new Error(`Database error: ${error.message}`);
        }

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

        // Query user's tags
        const { data: tags, error } = await db
          .from('tags')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return reply.code(200).send({
          success: true,
          data: {
            tags: tags || [],
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

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

        const { tag_ids } = AttachTagsSchema.parse(request.body);
        const db = getServiceClient();

        // Verify reading belongs to user
        const { data: reading, error: readingError } = await db
          .from('readings')
          .select('id')
          .eq('id', request.params.id)
          .eq('user_id', userId)
          .single();

        if (readingError || !reading) {
          return reply.code(404).send({
            success: false,
            error: {
              error: 'Reading not found or access denied',
              code: 'READING_NOT_FOUND',
            },
          });
        }

        // Insert reading-tag associations
        const associations = tag_ids.map((tag_id) => ({
          reading_id: request.params.id,
          tag_id,
        }));

        const { error } = await db
          .from('reading_tags')
          .insert(associations)
          .select();

        if (error) {
          // Ignore duplicate key errors (tag already attached)
          if (error.code !== '23505') {
            throw new Error(`Database error: ${error.message}`);
          }
        }

        return reply.code(200).send({
          success: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

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

        // Verify reading belongs to user
        const { data: reading, error: readingError } = await db
          .from('readings')
          .select('id')
          .eq('id', request.params.id)
          .eq('user_id', userId)
          .single();

        if (readingError || !reading) {
          return reply.code(404).send({
            success: false,
            error: {
              error: 'Reading not found or access denied',
              code: 'READING_NOT_FOUND',
            },
          });
        }

        // Delete reading-tag association
        const { error } = await db
          .from('reading_tags')
          .delete()
          .eq('reading_id', request.params.id)
          .eq('tag_id', request.params.tagId);

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return reply.code(200).send({
          success: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

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
