/**
 * Validation Schemas for Settings API
 * Zod schemas for validating Settings-related API requests
 */

import { z } from 'zod'
import { UserRole } from '@prisma/client'

/**
 * Team Profile Settings Schema
 */
export const teamProfileSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
  teamType: z.enum(['HOUSE_LEAGUE', 'REPRESENTATIVE', 'ADULT_RECREATIONAL', 'OTHER']).optional(),
  ageDivision: z.enum(['U7', 'U9', 'U11', 'U13', 'U15', 'U18', 'OTHER']).optional(),
  competitiveLevel: z.enum(['AAA', 'AA', 'A', 'BB', 'B', 'MD', 'HOUSE_RECREATIONAL', 'NOT_APPLICABLE', 'OTHER']).optional(),
  level: z.string().optional(),
  season: z.string().min(1, 'Season is required'),
  logoUrl: z.union([z.string().url('Invalid logo URL'), z.literal('')]).optional().nullable(),
  associationName: z.string().max(200).optional().nullable(),
  seasonStartDate: z.string().datetime().optional().nullable(),
  seasonEndDate: z.string().datetime().optional().nullable(),
  contactName: z.string().max(100).optional().nullable(),
  contactEmail: z.union([z.string().email('Invalid contact email'), z.literal('')]).optional().nullable(),
  contactPhone: z.string().max(20).optional().nullable(),
})

/**
 * Team Settings Schema (Dual Approval & Transaction Rules)
 */
export const teamSettingsSchema = z.object({
  dualApprovalEnabled: z.boolean().default(true),
  dualApprovalThreshold: z
    .number()
    .positive('Threshold must be positive')
    .min(0)
    .max(999999.99)
    .default(200.0),
  receiptRequired: z.boolean().default(true),
  allowSelfReimbursement: z.boolean().default(false),
  duplicateDetectionEnabled: z.boolean().default(true),
  allowedPaymentMethods: z
    .array(z.enum(['CASH', 'CHEQUE', 'E_TRANSFER', 'CREDIT_CARD']))
    .min(1, 'At least one payment method must be allowed')
    .default(['CASH', 'CHEQUE', 'E_TRANSFER']),
  duplicateDetectionWindow: z
    .number()
    .int()
    .min(1)
    .max(30)
    .default(7),
})

/**
 * User Role Update Schema
 */
export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
})

/**
 * User Invite Schema
 */
export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100),
  role: z.nativeEnum(UserRole).default(UserRole.PARENT),
})

/**
 * Category Schema
 */
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  heading: z.string().min(1, 'Heading is required').max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color hex code'),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean().default(true),
})

/**
 * Category Update Schema (for editing existing categories)
 */
export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100).optional(),
  heading: z.string().min(1, 'Heading is required').max(100).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color hex code').optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

/**
 * Notification Settings Schema
 */
export const notificationSettingsSchema = z.object({
  newExpenseSubmitted: z.boolean().default(true),
  approvalRequired: z.boolean().default(true),
  budgetThresholdWarning: z.boolean().default(true),
  missingReceiptReminder: z.boolean().default(true),
  monthlySummary: z.boolean().default(false),
})

/**
 * Audit Log Filter Schema
 */
export const auditLogFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

/**
 * Season Close Schema
 */
export const seasonCloseSchema = z.object({
  archiveData: z.boolean().default(true),
  createNewSeason: z.boolean().default(false),
  newSeasonName: z.string().optional(),
  confirmMessage: z
    .string()
    .refine(
      (val) => val === 'I understand this action cannot be undone',
      'You must confirm by typing the exact message'
    ),
})

/**
 * Type inference helpers
 */
export type TeamProfileInput = z.infer<typeof teamProfileSchema>
export type TeamSettingsInput = z.infer<typeof teamSettingsSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>
export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>
export type SeasonCloseInput = z.infer<typeof seasonCloseSchema>
