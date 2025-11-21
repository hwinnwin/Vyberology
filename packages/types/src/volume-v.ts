/**
 * Volume V: Integration Layer Types
 * History, Notes, Tags, Exports, Analytics
 */

import { z } from 'zod';

// ============================================================================
// Notes
// ============================================================================

export const NoteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  reading_id: z.string().uuid().optional(),
  body: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export type Note = z.infer<typeof NoteSchema>;

export const CreateNoteSchema = z.object({
  reading_id: z.string().uuid().optional(),
  body: z.string().min(1).max(10000),
});

export type CreateNote = z.infer<typeof CreateNoteSchema>;

export const UpdateNoteSchema = z.object({
  body: z.string().min(1).max(10000),
});

export type UpdateNote = z.infer<typeof UpdateNoteSchema>;

// ============================================================================
// Tags
// ============================================================================

export const TagSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).default('#3b82f6'),
  created_at: z.string().datetime(),
});

export type Tag = z.infer<typeof TagSchema>;

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
});

export type CreateTag = z.infer<typeof CreateTagSchema>;

export const AttachTagsSchema = z.object({
  tag_ids: z.array(z.string().uuid()).min(1),
});

export type AttachTags = z.infer<typeof AttachTagsSchema>;

// ============================================================================
// History / Filters
// ============================================================================

export const HistoryFiltersSchema = z.object({
  q: z.string().optional(),
  element: z.string().optional(),
  chakra: z.string().optional(),
  tag: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export type HistoryFilters = z.infer<typeof HistoryFiltersSchema>;

export const ReadingSummarySchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  volume: z.number(),
  reduced_number: z.coerce.number(),
  master_number: z.coerce.number().optional(),
  elements: z.array(z.string()),
  chakras: z.array(z.string()),
  marker_title: z.string(),
  essence: z.string(),
  tags: z.array(z.string()),
  notes_count: z.coerce.number(),
});

export type ReadingSummary = z.infer<typeof ReadingSummarySchema>;

export const HistoryResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    readings: z.array(ReadingSummarySchema),
    total: z.number(),
    next_cursor: z.string().uuid().optional(),
  }).optional(),
  error: z.object({
    error: z.string(),
    code: z.string().optional(),
  }).optional(),
});

export type HistoryResponse = z.infer<typeof HistoryResponseSchema>;

// ============================================================================
// Exports
// ============================================================================

export const ExportSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  format: z.enum(['csv', 'json']),
  status: z.enum(['queued', 'processing', 'ready', 'failed']),
  url: z.string().url().optional(),
  params: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
});

export type Export = z.infer<typeof ExportSchema>;

export const CreateExportSchema = z.object({
  format: z.enum(['csv', 'json']),
  filters: HistoryFiltersSchema.optional(),
});

export type CreateExport = z.infer<typeof CreateExportSchema>;

// ============================================================================
// Analytics
// ============================================================================

export const ElementDataPointSchema = z.object({
  day: z.string(),
  element: z.string(),
  count: z.number(),
});

export type ElementDataPoint = z.infer<typeof ElementDataPointSchema>;

export const ChakraDataPointSchema = z.object({
  day: z.string(),
  chakra: z.string(),
  count: z.number(),
});

export type ChakraDataPoint = z.infer<typeof ChakraDataPointSchema>;

export const AnalyticsRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type AnalyticsRange = z.infer<typeof AnalyticsRangeSchema>;

export const AnalyticsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    series: z.array(z.union([ElementDataPointSchema, ChakraDataPointSchema])),
  }).optional(),
  error: z.object({
    error: z.string(),
    code: z.string().optional(),
  }).optional(),
});

export type AnalyticsResponse = z.infer<typeof AnalyticsResponseSchema>;
