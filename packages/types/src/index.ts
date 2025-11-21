/**
 * @vyberology/types
 * Shared type definitions and Zod schemas for Vyberology reading system
 */

import { z } from 'zod';

// ============================================================================
// Input Types
// ============================================================================

export const ReadingInputSchema = z.object({
  sourceType: z.enum(['text', 'image']),
  rawText: z.string().optional(),
  ocrText: z.string().optional(),
  metadata: z.object({
    context: z.string().optional(),
    locale: z.string().default('en-AU'),
    timestamp: z.string().datetime().optional(),
  }).optional(),
});

export type ReadingInput = z.infer<typeof ReadingInputSchema>;

// ============================================================================
// Engine Output Types (Volume 1)
// ============================================================================

export const NumberTokenSchema = z.object({
  value: z.number(),
  raw: z.string(),
  index: z.number(),
});

export type NumberToken = z.infer<typeof NumberTokenSchema>;

export const ElementTagSchema = z.enum([
  '🜂 Fire',
  '🜁 Air',
  '🜃 Earth',
  '🜄 Water',
]);

export type ElementTag = z.infer<typeof ElementTagSchema>;

export const ChakraTagSchema = z.enum([
  'Root',
  'Sacral',
  'Solar Plexus',
  'Heart',
  'Throat',
  'Third Eye',
  'Crown',
]);

export type ChakraTag = z.infer<typeof ChakraTagSchema>;

export const MasterNumberSchema = z.union([
  z.literal(11),
  z.literal(22),
  z.literal(33),
]);

export type MasterNumber = z.infer<typeof MasterNumberSchema>;

export const ReadingDataV1Schema = z.object({
  tokens: z.array(NumberTokenSchema),
  sums: z.object({
    fullSum: z.number(),
    reduced: z.number(),
    master: MasterNumberSchema.optional(),
  }),
  elements: z.array(ElementTagSchema),
  chakras: z.array(ChakraTagSchema),
  phase: z.object({
    volume: z.union([z.literal(1), z.literal(2), z.literal(5), z.literal(6)]),
    cycle: z.string().optional(),
    marker: z.string().optional(),
  }),
  trace: z.record(z.unknown()),
});

export type ReadingDataV1 = z.infer<typeof ReadingDataV1Schema>;

// ============================================================================
// Composer Output Types (Volume 2)
// ============================================================================

export const ComposedReadingV2Schema = z.object({
  markerTitle: z.string(),
  coreEquationTone: z.string(),
  elementalAlignment: z.array(ElementTagSchema),
  chakraFocus: z.array(ChakraTagSchema),
  chakraResonance: z.string(),
  essence: z.string(),
  intention: z.string(),
  reflectionKey: z.string(),
  meta: z.object({
    engine: ReadingDataV1Schema,
    version: z.string(),
  }),
});

export type ComposedReadingV2 = z.infer<typeof ComposedReadingV2Schema>;

// ============================================================================
// API Response Types
// ============================================================================

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ParseResponseSchema = z.object({
  success: z.boolean(),
  data: ReadingDataV1Schema.optional(),
  error: ApiErrorSchema.optional(),
});

export type ParseResponse = z.infer<typeof ParseResponseSchema>;

export const ComposeResponseSchema = z.object({
  success: z.boolean(),
  data: ComposedReadingV2Schema.optional(),
  error: ApiErrorSchema.optional(),
});

export type ComposeResponse = z.infer<typeof ComposeResponseSchema>;

export const ReadResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    engine: ReadingDataV1Schema,
    composed: ComposedReadingV2Schema,
  }).optional(),
  error: ApiErrorSchema.optional(),
});

export type ReadResponse = z.infer<typeof ReadResponseSchema>;

// ============================================================================
// Database Types (for Volume 5)
// ============================================================================

export const StoredReadingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  input: ReadingInputSchema,
  engine: ReadingDataV1Schema,
  composed: ComposedReadingV2Schema,
  volume: z.number(),
  created_at: z.string().datetime(),
});

export type StoredReading = z.infer<typeof StoredReadingSchema>;

// ============================================================================
// Volume V Types (Integration Layer)
// ============================================================================

export * from './volume-v.js';
