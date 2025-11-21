/**
 * API Keys routes (Volume VI - Transmission Layer)
 * POST /v1/keys - Create API key
 * GET /v1/keys - List user's API keys
 * GET /v1/keys/:id - Get API key details
 * PATCH /v1/keys/:id - Update API key
 * DELETE /v1/keys/:id - Revoke API key
 * GET /v1/keys/:id/usage - Get usage stats for key
 */

import type { FastifyPluginAsync } from 'fastify';
import { CreateApiKeySchema, UpdateApiKeySchema } from '@vyberology/types';
import { randomBytes, createHash } from 'crypto';

export const keysRoute: FastifyPluginAsync = async (fastify) => {
  // Create API key
  fastify.post<{
    Body: unknown;
  }>(
    '/v1/keys',
    {
      schema: {
        description: 'Create a new API key',
        tags: ['keys'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            scopes: { type: 'array', items: { type: 'string', enum: ['read', 'write', 'admin'] }, default: ['read'] },
            rate_limit_tier: { type: 'string', enum: ['free', 'pro', 'enterprise'], default: 'free' },
            expires_at: { type: 'string', format: 'date-time' },
          },
          required: ['name'],
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
                  name: { type: 'string' },
                  key: { type: 'string' },
                  key_prefix: { type: 'string' },
                  scopes: { type: 'array' },
                  rate_limit_tier: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
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

        const keyData = CreateApiKeySchema.parse(request.body);
        const db = getServiceClient();

        // Generate API key (vybe_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
        const keySecret = randomBytes(32).toString('hex'); // 64 chars
        const fullKey = `vybe_${keySecret}`;

        // Hash the key for storage (SHA-256)
        const keyHash = createHash('sha256').update(fullKey).digest('hex');

        // Create key prefix for display (first 12 chars)
        const keyPrefix = fullKey.substring(0, 12);

        // Determine rate limits based on tier
        const rateLimits = {
          free: { rps: 10, rpm: null },
          pro: { rps: 100, rpm: null },
          enterprise: { rps: 1000, rpm: null },
        };
        const limits = rateLimits[keyData.rate_limit_tier];

        // Insert API key
        const { data, error } = await db
          .from('api_keys')
          .insert({
            user_id: userId,
            name: keyData.name,
            key_hash: keyHash,
            key_prefix: keyPrefix,
            scopes: keyData.scopes,
            rate_limit_tier: keyData.rate_limit_tier,
            requests_per_second: limits.rps,
            requests_per_month: limits.rpm,
            expires_at: keyData.expires_at || null,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        // Return the full key (only time it's ever shown!)
        return reply.code(201).send({
          success: true,
          data: {
            id: data.id,
            name: data.name,
            key: fullKey, // ⚠️  Store this securely! Never shown again.
            key_prefix: data.key_prefix,
            scopes: data.scopes,
            rate_limit_tier: data.rate_limit_tier,
            created_at: data.created_at,
            expires_at: data.expires_at,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'KEY_CREATE_ERROR',
          },
        });
      }
    }
  );

  // List API keys
  fastify.get(
    '/v1/keys',
    {
      schema: {
        description: 'List all user API keys',
        tags: ['keys'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  keys: { type: 'array' },
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

        // Query keys (excluding hash for security)
        const { data: keys, error } = await db
          .from('api_keys')
          .select('id, name, key_prefix, scopes, is_active, rate_limit_tier, requests_per_second, total_requests, last_used_at, created_at, expires_at, revoked_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return reply.code(200).send({
          success: true,
          data: {
            keys: keys || [],
            total: keys?.length || 0,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(error);

        return reply.code(400).send({
          success: false,
          error: {
            error: message,
            code: 'KEY_LIST_ERROR',
          },
        });
      }
    }
  );

  // Get API key details
  fastify.get<{
    Params: { id: string };
  }>(
    '/v1/keys/:id',
    {
      schema: {
        description: 'Get API key details',
        tags: ['keys'],
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

        // Query key (excluding hash)
        const { data, error } = await db
          .from('api_keys')
          .select('id, name, key_prefix, scopes, is_active, rate_limit_tier, requests_per_second, total_requests, last_used_at, created_at, expires_at, revoked_at')
          .eq('id', request.params.id)
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return reply.code(404).send({
              success: false,
              error: {
                error: 'API key not found or access denied',
                code: 'KEY_NOT_FOUND',
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
            code: 'KEY_GET_ERROR',
          },
        });
      }
    }
  );

  // Update API key
  fastify.patch<{
    Params: { id: string };
    Body: unknown;
  }>(
    '/v1/keys/:id',
    {
      schema: {
        description: 'Update API key',
        tags: ['keys'],
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
            name: { type: 'string', minLength: 1, maxLength: 100 },
            scopes: { type: 'array', items: { type: 'string', enum: ['read', 'write', 'admin'] } },
            is_active: { type: 'boolean' },
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

        const update = UpdateApiKeySchema.parse(request.body);
        const db = getServiceClient();

        // Update key
        const { data, error } = await db
          .from('api_keys')
          .update(update)
          .eq('id', request.params.id)
          .eq('user_id', userId)
          .select('id, name, key_prefix, scopes, is_active, rate_limit_tier, created_at')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return reply.code(404).send({
              success: false,
              error: {
                error: 'API key not found or access denied',
                code: 'KEY_NOT_FOUND',
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
            code: 'KEY_UPDATE_ERROR',
          },
        });
      }
    }
  );

  // Revoke API key (soft delete)
  fastify.delete<{
    Params: { id: string };
  }>(
    '/v1/keys/:id',
    {
      schema: {
        description: 'Revoke API key (cannot be undone)',
        tags: ['keys'],
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

        // Soft delete (set revoked_at and deactivate)
        const { error } = await db
          .from('api_keys')
          .update({
            is_active: false,
            revoked_at: new Date().toISOString(),
          })
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
            code: 'KEY_REVOKE_ERROR',
          },
        });
      }
    }
  );

  // Get usage stats for API key
  fastify.get<{
    Params: { id: string };
  }>(
    '/v1/keys/:id/usage',
    {
      schema: {
        description: 'Get usage statistics for API key',
        tags: ['keys'],
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

        // Query v_api_key_usage view
        const { data, error } = await db
          .from('v_api_key_usage')
          .select('*')
          .eq('api_key_id', request.params.id)
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return reply.code(404).send({
              success: false,
              error: {
                error: 'API key not found or access denied',
                code: 'KEY_NOT_FOUND',
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
            code: 'KEY_USAGE_ERROR',
          },
        });
      }
    }
  );
};
