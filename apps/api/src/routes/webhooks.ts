/**
 * Webhooks routes (Volume VI - Transmission Layer)
 * POST /v1/webhooks - Create webhook
 * GET /v1/webhooks - List user's webhooks
 * GET /v1/webhooks/:id - Get webhook details
 * PATCH /v1/webhooks/:id - Update webhook
 * DELETE /v1/webhooks/:id - Delete webhook
 * GET /v1/webhooks/:id/deliveries - Get delivery history
 */

import type { FastifyPluginAsync } from 'fastify';
import { CreateWebhookSchema, UpdateWebhookSchema, WebhookDeliveryFiltersSchema } from '@vyberology/types';
import { randomBytes } from 'crypto';

export const webhooksRoute: FastifyPluginAsync = async (fastify) => {
  // Create webhook
  fastify.post<{
    Body: unknown;
  }>(
    '/v1/webhooks',
    {
      schema: {
        description: 'Create a new webhook',
        tags: ['webhooks'],
        body: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri' },
            events: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'reading.created', 'reading.updated', 'reading.deleted',
                  'note.created', 'note.updated', 'note.deleted',
                  'tag.created', 'tag.attached', 'tag.detached',
                  'export.ready', 'export.failed',
                ],
              },
              minItems: 1,
            },
            max_retries: { type: 'integer', minimum: 0, maximum: 10, default: 3 },
            retry_delay_seconds: { type: 'integer', minimum: 1, maximum: 3600, default: 60 },
          },
          required: ['url', 'events'],
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
                  url: { type: 'string' },
                  secret: { type: 'string' },
                  events: { type: 'array' },
                  is_active: { type: 'boolean' },
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

        const webhookData = CreateWebhookSchema.parse(request.body);
        const db = getServiceClient();

        // Generate webhook secret (for HMAC signature verification)
        const secret = randomBytes(32).toString('hex');

        // Insert webhook
        const { data, error } = await db
          .from('webhooks')
          .insert({
            user_id: userId,
            url: webhookData.url,
            secret,
            events: webhookData.events,
            max_retries: webhookData.max_retries,
            retry_delay_seconds: webhookData.retry_delay_seconds,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        // Return webhook with secret (only shown once!)
        return reply.code(201).send({
          success: true,
          data: {
            id: data.id,
            url: data.url,
            secret: data.secret, // ⚠️  Store this securely! Use it to verify webhook signatures.
            events: data.events,
            is_active: data.is_active,
            max_retries: data.max_retries,
            retry_delay_seconds: data.retry_delay_seconds,
            created_at: data.created_at,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'WEBHOOK_CREATE_ERROR',
          },
        });
      }
    }
  );

  // List webhooks
  fastify.get(
    '/v1/webhooks',
    {
      schema: {
        description: 'List all user webhooks',
        tags: ['webhooks'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  webhooks: { type: 'array' },
                  total: { type: 'number' },
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

        // Query webhooks (excluding secret for security)
        const { data: webhooks, error } = await db
          .from('webhooks')
          .select('id, url, is_active, events, max_retries, retry_delay_seconds, total_deliveries, failed_deliveries, last_delivered_at, created_at, updated_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return reply.code(200).send({
          success: true,
          data: {
            webhooks: webhooks || [],
            total: webhooks?.length || 0,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'WEBHOOK_LIST_ERROR',
          },
        });
      }
    }
  );

  // Get webhook details
  fastify.get<{
    Params: { id: string };
  }>(
    '/v1/webhooks/:id',
    {
      schema: {
        description: 'Get webhook details',
        tags: ['webhooks'],
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

        // Query webhook (excluding secret)
        const { data, error } = await db
          .from('webhooks')
          .select('id, url, is_active, events, max_retries, retry_delay_seconds, total_deliveries, failed_deliveries, last_delivered_at, created_at, updated_at')
          .eq('id', request.params.id)
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return reply.code(404).send({
              success: false,
              error: {
                error: 'Webhook not found or access denied',
                code: 'WEBHOOK_NOT_FOUND',
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
            code: 'WEBHOOK_GET_ERROR',
          },
        });
      }
    }
  );

  // Update webhook
  fastify.patch<{
    Params: { id: string };
    Body: unknown;
  }>(
    '/v1/webhooks/:id',
    {
      schema: {
        description: 'Update webhook',
        tags: ['webhooks'],
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
            url: { type: 'string', format: 'uri' },
            events: { type: 'array', items: { type: 'string' } },
            is_active: { type: 'boolean' },
            max_retries: { type: 'integer', minimum: 0, maximum: 10 },
            retry_delay_seconds: { type: 'integer', minimum: 1, maximum: 3600 },
          },
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

        const update = UpdateWebhookSchema.parse(request.body);
        const db = getServiceClient();

        // Update webhook
        const { data, error } = await db
          .from('webhooks')
          .update({
            ...update,
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.params.id)
          .eq('user_id', userId)
          .select('id, url, is_active, events, max_retries, retry_delay_seconds, created_at, updated_at')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return reply.code(404).send({
              success: false,
              error: {
                error: 'Webhook not found or access denied',
                code: 'WEBHOOK_NOT_FOUND',
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
            code: 'WEBHOOK_UPDATE_ERROR',
          },
        });
      }
    }
  );

  // Delete webhook
  fastify.delete<{
    Params: { id: string };
  }>(
    '/v1/webhooks/:id',
    {
      schema: {
        description: 'Delete webhook',
        tags: ['webhooks'],
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

        // Delete webhook
        const { error } = await db
          .from('webhooks')
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
            code: 'WEBHOOK_DELETE_ERROR',
          },
        });
      }
    }
  );

  // Get webhook delivery history
  fastify.get<{
    Params: { id: string };
    Querystring: unknown;
  }>(
    '/v1/webhooks/:id/deliveries',
    {
      schema: {
        description: 'Get webhook delivery history',
        tags: ['webhooks'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'pending'] },
            from: { type: 'string', format: 'date-time' },
            to: { type: 'string', format: 'date-time' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            cursor: { type: 'string', format: 'uuid' },
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
                  deliveries: { type: 'array' },
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

        const filters = WebhookDeliveryFiltersSchema.parse({
          ...request.query,
          webhook_id: request.params.id,
        });
        const db = getServiceClient();

        // Verify webhook ownership
        const { data: webhook, error: webhookError } = await db
          .from('webhooks')
          .select('id')
          .eq('id', request.params.id)
          .eq('user_id', userId)
          .single();

        if (webhookError || !webhook) {
          return reply.code(404).send({
            success: false,
            error: {
              error: 'Webhook not found or access denied',
              code: 'WEBHOOK_NOT_FOUND',
            },
          });
        }

        // Query deliveries with filters
        let query = db
          .from('webhook_deliveries')
          .select('*')
          .eq('webhook_id', request.params.id)
          .order('delivered_at', { ascending: false })
          .limit(filters.limit);

        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.from) {
          query = query.gte('delivered_at', filters.from);
        }
        if (filters.to) {
          query = query.lte('delivered_at', filters.to);
        }
        if (filters.cursor) {
          const { data: cursorDelivery } = await db
            .from('webhook_deliveries')
            .select('delivered_at')
            .eq('id', filters.cursor)
            .single();

          if (cursorDelivery) {
            query = query.lt('delivered_at', cursorDelivery.delivered_at);
          }
        }

        const { data: deliveries, error } = await query;

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        // Get total count
        const { count } = await db
          .from('webhook_deliveries')
          .select('*', { count: 'exact', head: true })
          .eq('webhook_id', request.params.id);

        // Determine next cursor
        const nextCursor =
          deliveries && deliveries.length === filters.limit
            ? deliveries[deliveries.length - 1].id
            : undefined;

        return reply.code(200).send({
          success: true,
          data: {
            deliveries: deliveries || [],
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
            code: 'WEBHOOK_DELIVERIES_ERROR',
          },
        });
      }
    }
  );
};
