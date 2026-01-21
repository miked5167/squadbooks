/**
 * Validation Schemas for Receipt Policy API
 * Zod schemas for validating receipt policy-related API requests
 */

import { z } from 'zod'

/**
 * Category Override Schema
 * Each category can have either a custom threshold or be marked as exempt
 */
export const categoryOverrideSchema = z.object({
  thresholdCents: z.number().int().min(0).optional(),
  exempt: z.boolean().optional(),
})

/**
 * Association Receipt Policy Schema
 * For updating association-level receipt policy settings
 */
export const associationReceiptPolicySchema = z.object({
  receiptsEnabled: z.boolean().default(true),
  receiptGlobalThresholdCents: z
    .number()
    .int()
    .min(0, 'Receipt threshold must be non-negative')
    .max(99999999, 'Receipt threshold is too large')
    .default(10000),
  receiptGracePeriodDays: z
    .number()
    .int()
    .min(0, 'Grace period must be non-negative')
    .max(365, 'Grace period cannot exceed 365 days')
    .default(7),
  receiptCategoryThresholdsEnabled: z.boolean().default(false),
  receiptCategoryOverrides: z.record(z.string().uuid(), categoryOverrideSchema).default({}),
  allowedTeamThresholdOverride: z.boolean().default(false),
})

/**
 * Team Receipt Override Schema
 * For updating team-level receipt threshold override
 */
export const teamReceiptOverrideSchema = z.object({
  receiptGlobalThresholdOverrideCents: z
    .number()
    .int()
    .min(0, 'Receipt threshold must be non-negative')
    .max(99999999, 'Receipt threshold is too large')
    .nullable()
    .optional(),
})

/**
 * Validation function to ensure team override is stricter than association
 * This should be called after both association policy and team override are known
 */
export function validateTeamOverrideStrictness(
  teamOverrideCents: number | null | undefined,
  associationThresholdCents: number
): { valid: boolean; error?: string } {
  // Null/undefined means no override - always valid
  if (teamOverrideCents === null || teamOverrideCents === undefined) {
    return { valid: true }
  }

  // Team override must be <= association threshold (stricter = lower amount)
  if (teamOverrideCents > associationThresholdCents) {
    return {
      valid: false,
      error: `Team receipt threshold ($${(teamOverrideCents / 100).toFixed(2)}) cannot be higher than association threshold ($${(associationThresholdCents / 100).toFixed(2)}). Teams can only make receipt requirements stricter.`,
    }
  }

  return { valid: true }
}

/**
 * Type inference helpers
 */
export type AssociationReceiptPolicyInput = z.infer<typeof associationReceiptPolicySchema>
export type TeamReceiptOverrideInput = z.infer<typeof teamReceiptOverrideSchema>
export type CategoryOverrideInput = z.infer<typeof categoryOverrideSchema>
