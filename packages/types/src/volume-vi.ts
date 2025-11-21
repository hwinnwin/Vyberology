/**
 * Volume VI: Transmission Layer
 * Types for API keys, webhooks, rate limiting, and usage tracking
 */

import { z } from 'zod';

// ============================================================================
// API KEYS
// ============================================================================

export const ApiKeyScopeSchema = z.enum(['read', 'write', 'admin']);
export type ApiKeyScope = z.infer<typeof ApiKeyScopeSchema>;

export const RateLimitTierSchema = z.enum(['free', 'pro', 'enterprise']);
export type RateLimitTier = z.infer<typeof RateLimitTierSchema>;

export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  name: z.string(),
  key_prefix: z.string(),
  scopes: z.array(ApiKeyScopeSchema),
  is_active: z.boolean(),
  rate_limit_tier: RateLimitTierSchema,
  requests_per_second: z.number().int(),
  requests_per_month: z.number().int().nullable().optional(),
  total_requests: z.number().int(),
  last_used_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable().optional(),
  revoked_at: z.string().datetime().nullable().optional(),
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(ApiKeyScopeSchema).min(1).default(['read']),
  rate_limit_tier: RateLimitTierSchema.default('free'),
  expires_at: z.string().datetime().optional(),
});
export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;

export const UpdateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scopes: z.array(ApiKeyScopeSchema).min(1).optional(),
  is_active: z.boolean().optional(),
});
export type UpdateApiKey = z.infer<typeof UpdateApiKeySchema>;

// Response when creating a key (includes the full key once)
export const ApiKeyCreatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  key: z.string(), // Full key (only shown once!)
  key_prefix: z.string(),
  scopes: z.array(ApiKeyScopeSchema),
  rate_limit_tier: RateLimitTierSchema,
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable().optional(),
});
export type ApiKeyCreated = z.infer<typeof ApiKeyCreatedSchema>;

// ============================================================================
// WEBHOOKS
// ============================================================================

export const WebhookEventSchema = z.enum([
  'reading.created',
  'reading.updated',
  'reading.deleted',
  'note.created',
  'note.updated',
  'note.deleted',
  'tag.created',
  'tag.attached',
  'tag.detached',
  'export.ready',
  'export.failed',
]);
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

export const WebhookSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  url: z.string().url(),
  secret: z.string().optional(), // Not returned in API responses
  is_active: z.boolean(),
  events: z.array(WebhookEventSchema),
  max_retries: z.number().int(),
  retry_delay_seconds: z.number().int(),
  total_deliveries: z.number().int(),
  failed_deliveries: z.number().int(),
  last_delivered_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable().optional(),
});
export type Webhook = z.infer<typeof WebhookSchema>;

export const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(WebhookEventSchema).min(1),
  max_retries: z.number().int().min(0).max(10).default(3),
  retry_delay_seconds: z.number().int().min(1).max(3600).default(60),
});
export type CreateWebhook = z.infer<typeof CreateWebhookSchema>;

export const UpdateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(WebhookEventSchema).min(1).optional(),
  is_active: z.boolean().optional(),
  max_retries: z.number().int().min(0).max(10).optional(),
  retry_delay_seconds: z.number().int().min(1).max(3600).optional(),
});
export type UpdateWebhook = z.infer<typeof UpdateWebhookSchema>;

// ============================================================================
// WEBHOOK DELIVERIES
// ============================================================================

export const WebhookDeliveryStatusSchema = z.enum(['success', 'failed', 'pending']);
export type WebhookDeliveryStatus = z.infer<typeof WebhookDeliveryStatusSchema>;

export const WebhookDeliverySchema = z.object({
  id: z.string().uuid(),
  webhook_id: z.string().uuid(),
  event_type: WebhookEventSchema,
  payload: z.any(), // JSONB - varies by event type
  http_status: z.number().int().nullable().optional(),
  request_headers: z.any().optional(),
  response_body: z.string().nullable().optional(),
  response_headers: z.any().optional(),
  attempt_number: z.number().int(),
  delivered_at: z.string().datetime(),
  duration_ms: z.number().int().nullable().optional(),
  status: WebhookDeliveryStatusSchema,
  error_message: z.string().nullable().optional(),
});
export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;

export const WebhookDeliveryFiltersSchema = z.object({
  webhook_id: z.string().uuid().optional(),
  status: WebhookDeliveryStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});
export type WebhookDeliveryFilters = z.infer<typeof WebhookDeliveryFiltersSchema>;

// ============================================================================
// USAGE LOGS
// ============================================================================

export const UsageLogSchema = z.object({
  id: z.string().uuid(),
  api_key_id: z.string().uuid(),
  endpoint: z.string(),
  method: z.string(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  status_code: z.number().int().nullable().optional(),
  response_time_ms: z.number().int().nullable().optional(),
  tokens_used: z.number().int().nullable().optional(),
  credits_consumed: z.number().nullable().optional(),
  logged_at: z.string().datetime(),
});
export type UsageLog = z.infer<typeof UsageLogSchema>;

export const UsageFiltersSchema = z.object({
  api_key_id: z.string().uuid().optional(),
  endpoint: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  cursor: z.string().uuid().optional(),
});
export type UsageFilters = z.infer<typeof UsageFiltersSchema>;

// Usage statistics (aggregated)
export const UsageStatsSchema = z.object({
  api_key_id: z.string().uuid(),
  key_name: z.string(),
  key_prefix: z.string(),
  total_requests: z.number().int(),
  requests_last_30d: z.number().int(),
  avg_response_time_ms: z.number().nullable().optional(),
  tokens_remaining: z.number().int().nullable().optional(),
  tokens_max: z.number().int().nullable().optional(),
  window_reset_at: z.string().datetime().nullable().optional(),
  last_used_at: z.string().datetime().nullable().optional(),
});
export type UsageStats = z.infer<typeof UsageStatsSchema>;

// ============================================================================
// RATE LIMITING
// ============================================================================

export const RateLimitBucketSchema = z.object({
  api_key_id: z.string().uuid(),
  tokens_remaining: z.number().int(),
  tokens_max: z.number().int(),
  refill_rate: z.number().int(),
  last_refill_at: z.string().datetime(),
  window_reset_at: z.string().datetime(),
});
export type RateLimitBucket = z.infer<typeof RateLimitBucketSchema>;

export const RateLimitErrorSchema = z.object({
  error: z.literal('Rate limit exceeded'),
  code: z.literal('RATE_LIMIT_EXCEEDED'),
  retry_after_seconds: z.number().int(),
  limit: z.number().int(),
  remaining: z.number().int(),
  reset_at: z.string().datetime(),
});
export type RateLimitError = z.infer<typeof RateLimitErrorSchema>;

// ============================================================================
// API RESPONSES
// ============================================================================

export const ApiKeyResponseSchema = z.object({
  success: z.literal(true),
  data: ApiKeySchema,
});
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;

export const ApiKeyCreatedResponseSchema = z.object({
  success: z.literal(true),
  data: ApiKeyCreatedSchema,
});
export type ApiKeyCreatedResponse = z.infer<typeof ApiKeyCreatedResponseSchema>;

export const ApiKeysListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    keys: z.array(ApiKeySchema),
    total: z.number().int(),
  }),
});
export type ApiKeysListResponse = z.infer<typeof ApiKeysListResponseSchema>;

export const WebhookResponseSchema = z.object({
  success: z.literal(true),
  data: WebhookSchema,
});
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;

export const WebhooksListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    webhooks: z.array(WebhookSchema),
    total: z.number().int(),
  }),
});
export type WebhooksListResponse = z.infer<typeof WebhooksListResponseSchema>;

export const WebhookDeliveriesResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    deliveries: z.array(WebhookDeliverySchema),
    total: z.number().int(),
    next_cursor: z.string().uuid().optional(),
  }),
});
export type WebhookDeliveriesResponse = z.infer<typeof WebhookDeliveriesResponseSchema>;

export const UsageLogsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    logs: z.array(UsageLogSchema),
    total: z.number().int(),
    next_cursor: z.string().uuid().optional(),
  }),
});
export type UsageLogsResponse = z.infer<typeof UsageLogsResponseSchema>;

export const UsageStatsResponseSchema = z.object({
  success: z.literal(true),
  data: UsageStatsSchema,
});
export type UsageStatsResponse = z.infer<typeof UsageStatsResponseSchema>;
