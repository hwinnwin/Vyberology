/**
 * Notes API routes
 * POST /v1/notes - Create note
 * GET /v1/notes - List notes for a reading
 * PATCH /v1/notes/:id - Update note
 * DELETE /v1/notes/:id - Delete note
 */

import type { FastifyPluginAsync } from 'fastify';
import { CreateNoteSchema, UpdateNoteSchema } from '@vyberology/types';

export const notesRoute: FastifyPluginAsync = async (fastify) => {
  // Create note
  fastify.post<{
    Body: unknown;
  }>(
    '/v1/notes',
    {
      schema: {
        description: 'Create a new note',
        tags: ['notes'],
        body: {
          type: 'object',
          properties: {
            reading_id: { type: 'string', format: 'uuid' },
            body: { type: 'string', minLength: 1, maxLength: 10000 },
          },
          required: ['body'],
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

        const note = CreateNoteSchema.parse(request.body);
        const db = getServiceClient();

        // Insert note
        const { data, error } = await db
          .from('notes')
          .insert({
            user_id: userId,
            reading_id: note.reading_id || null,
            body: note.body,
          })
          .select()
          .single();

        if (error) {
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
            code: 'NOTE_CREATE_ERROR',
          },
        });
      }
    }
  );

  // List notes
  fastify.get<{
    Querystring: { reading_id?: string };
  }>(
    '/v1/notes',
    {
      schema: {
        description: 'List notes, optionally filtered by reading',
        tags: ['notes'],
        querystring: {
          type: 'object',
          properties: {
            reading_id: { type: 'string', format: 'uuid' },
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
                  notes: { type: 'array' },
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

        // Query notes with optional reading_id filter
        let query = db
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (request.query.reading_id) {
          query = query.eq('reading_id', request.query.reading_id);
        }

        const { data: notes, error } = await query;

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return reply.code(200).send({
          success: true,
          data: {
            notes: notes || [],
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'NOTE_LIST_ERROR',
          },
        });
      }
    }
  );

  // Update note
  fastify.patch<{
    Params: { id: string };
    Body: unknown;
  }>(
    '/v1/notes/:id',
    {
      schema: {
        description: 'Update a note',
        tags: ['notes'],
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
            body: { type: 'string', minLength: 1, maxLength: 10000 },
          },
          required: ['body'],
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

        const update = UpdateNoteSchema.parse(request.body);
        const db = getServiceClient();

        // Update note (RLS ensures user owns it)
        const { data, error } = await db
          .from('notes')
          .update({
            body: update.body,
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.params.id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return reply.code(404).send({
              success: false,
              error: {
                error: 'Note not found or access denied',
                code: 'NOTE_NOT_FOUND',
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
            code: 'NOTE_UPDATE_ERROR',
          },
        });
      }
    }
  );

  // Delete note
  fastify.delete<{
    Params: { id: string };
  }>(
    '/v1/notes/:id',
    {
      schema: {
        description: 'Delete a note',
        tags: ['notes'],
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

        // Delete note (RLS ensures user owns it)
        const { error } = await db
          .from('notes')
          .delete()
          .eq('id', request.params.id)
          .eq('user_id', userId);

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
            code: 'NOTE_DELETE_ERROR',
          },
        });
      }
    }
  );
};
