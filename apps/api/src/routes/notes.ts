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
        const note = CreateNoteSchema.parse(request.body);
        // TODO: Get user_id from auth, insert into Supabase

        return reply.code(201).send({
          success: true,
          data: {
            id: 'demo-note-id',
            ...note,
            created_at: new Date().toISOString(),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

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
        // TODO: Query Supabase with user_id + optional reading_id filter

        return reply.code(200).send({
          success: true,
          data: {
            notes: [],
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

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
        const update = UpdateNoteSchema.parse(request.body);
        // TODO: Update in Supabase with RLS check

        return reply.code(200).send({
          success: true,
          data: {
            id: request.params.id,
            ...update,
            updated_at: new Date().toISOString(),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

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
        // TODO: Delete from Supabase with RLS check

        return reply.code(200).send({
          success: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

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
