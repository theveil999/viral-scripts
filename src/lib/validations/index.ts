/**
 * @file Zod validation schemas for API routes
 */
import { z } from 'zod'

// ===================
// Common schemas
// ===================

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ===================
// Models
// ===================

export const createModelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  voice_profile: z.record(z.string(), z.unknown()).optional(),
})

// ===================
// Scripts
// ===================

export const scriptStatusSchema = z.enum(['draft', 'approved', 'rejected', 'archived'])

export const updateScriptsStatusSchema = z.object({
  script_ids: z.array(uuidSchema).min(1, 'At least one script ID is required'),
  status: scriptStatusSchema,
})

export const getScriptsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: scriptStatusSchema.optional(),
  batch_id: uuidSchema.optional(),
})

// ===================
// Hooks
// ===================

// PcmType from hook-generation.ts
const pcmTypeSchema = z.enum(['harmonizer', 'thinker', 'rebel', 'persister', 'imaginer', 'promoter'])

export const hookSchema = z.object({
  hook: z.string().min(1, 'Hook text is required'),
  hook_type: z.string().min(1, 'Hook type is required'),
  parasocial_levers: z.array(z.string()).default([]),
  why_it_works: z.string().min(1, 'why_it_works is required'), // Bug fix: was optional but GeneratedHook requires it
  pcm_type: pcmTypeSchema.optional(),
  quality_score: z.number().optional(),
  selected: z.boolean().optional(),
  variation_strategy: z.string().optional(),
  concept_id: z.string().optional(),
})

export const expandScriptsSchema = z.object({
  hooks: z.array(hookSchema).min(1, 'At least one hook is required'),
  targetDuration: z.enum(['short', 'medium', 'long']).optional(),
  corpusLimit: z.number().int().positive().optional(),
})

// ===================
// Voice Transformation (input is ExpandedScript[])
// ===================

// Bug fix: Schema must match ExpandedScript interface requirements
export const structureBreakdownSchema = z.object({
  hook: z.string(),
  tension: z.string(),
  payload: z.string(),
  closer: z.string(),
})

export const expandedScriptSchema = z.object({
  hook_index: z.number().int().nonnegative(),
  hook: z.string().min(1),
  script: z.string().min(1),
  word_count: z.number().int().positive(),
  estimated_duration_seconds: z.number().positive(),
  structure_breakdown: structureBreakdownSchema,
  parasocial_levers_used: z.array(z.string()),
  voice_elements_used: z.array(z.string()),
  quality_score: z.number().optional(),
  validation_issues: z.array(z.string()).optional(),
})

export const transformScriptsSchema = z.object({
  scripts: z.array(expandedScriptSchema).min(1, 'At least one script is required'),
})

// Bug fix: Schema must match TransformedScript interface requirements
export const transformedScriptSchema = z.object({
  script_index: z.number().int().nonnegative(),
  original_hook: z.string().min(1),
  transformed_script: z.string().min(1),
  word_count: z.number().int().positive(),
  changes_made: z.array(z.string()),
  voice_fidelity_score: z.number().min(0).max(1),
  ai_tells_removed: z.array(z.string()),
  voice_elements_added: z.array(z.string()),
})

export const validateScriptsSchema = z.object({
  scripts: z.array(transformedScriptSchema).min(1, 'At least one script is required'),
})

// ===================
// Pipeline / Generate
// ===================

export const generatePipelineSchema = z.object({
  hookCount: z.number().int().positive().max(50).optional(),
  hookTypes: z.array(z.string()).optional(),
  targetDuration: z.enum(['short', 'medium', 'long']).optional(),
  corpusLimit: z.number().int().positive().max(100).optional(),
  variationsPerConcept: z.number().int().positive().max(5).optional(),
  enableShareabilityScoring: z.boolean().optional(),
  ctaStyle: z.string().optional(), // Validated at service layer
  enablePcmTracking: z.boolean().optional(),
  retryFailedStages: z.boolean().optional(),
  maxRetries: z.number().int().positive().max(5).optional(),
})

// ===================
// Profile Extraction
// ===================

export const extractProfileSchema = z.object({
  transcript: z.string().min(100, 'Transcript must be at least 100 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  stage_name: z.string().optional(),
})

// ===================
// Corpus
// ===================

export const addCorpusSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  hook: z.string().optional(),
  hook_type: z.string().optional(),
  source: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// ===================
// Helper function for API routes
// ===================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: z.ZodIssue[] }

export function validateRequest<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || 'Validation failed',
      details: result.error.issues,
    }
  }
  
  return { success: true, data: result.data }
}

