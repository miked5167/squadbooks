import { z } from 'zod'

// Enums matching Prisma schema
export const PreSeasonBudgetStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'ACTIVATED',
  'CANCELLED',
])

// Season format validation (e.g., "2025-2026")
const seasonRegex = /^\d{4}-\d{4}$/
const seasonValidator = z.string().regex(seasonRegex, {
  message: 'Season must be in format YYYY-YYYY (e.g., 2025-2026)'
}).refine((season) => {
  const [start, end] = season.split('-').map(Number)
  return end === start + 1
}, { message: 'Season end year must be one year after start year' })

// Create Pre-Season Budget Schema
export const CreatePreSeasonBudgetSchema = z.object({
  proposedTeamName: z.string()
    .min(3, { message: 'Team name must be at least 3 characters' })
    .max(100, { message: 'Team name cannot exceed 100 characters' }),
  proposedSeason: seasonValidator,
  teamType: z.string().optional(),
  ageDivision: z.string().optional(),
  competitiveLevel: z.string().optional(),
  totalBudget: z.number()
    .positive({ message: 'Total budget must be positive' })
    .max(1000000, { message: 'Total budget cannot exceed $1,000,000' })
    .multipleOf(0.01, { message: 'Total budget must have at most 2 decimal places' }),
  projectedPlayers: z.number()
    .int({ message: 'Projected players must be a whole number' })
    .positive({ message: 'Must have at least 1 projected player' })
    .max(50, { message: 'Projected players cannot exceed 50' }),
  associationId: z.string().uuid().optional(),
})

// Update Pre-Season Budget Schema (for editing draft)
export const UpdatePreSeasonBudgetSchema = z.object({
  proposedTeamName: z.string()
    .min(3, { message: 'Team name must be at least 3 characters' })
    .max(100, { message: 'Team name cannot exceed 100 characters' })
    .optional(),
  proposedSeason: seasonValidator.optional(),
  teamType: z.string().optional(),
  ageDivision: z.string().optional(),
  competitiveLevel: z.string().optional(),
  totalBudget: z.number()
    .positive({ message: 'Total budget must be positive' })
    .max(1000000, { message: 'Total budget cannot exceed $1,000,000' })
    .multipleOf(0.01, { message: 'Total budget must have at most 2 decimal places' })
    .optional(),
  projectedPlayers: z.number()
    .int({ message: 'Projected players must be a whole number' })
    .positive({ message: 'Must have at least 1 projected player' })
    .max(50, { message: 'Projected players cannot exceed 50' })
    .optional(),
})

// Pre-Season Allocation Schema
export const PreSeasonAllocationSchema = z.object({
  categoryId: z.string().min(1, { message: 'Category is required' }),
  allocated: z.number()
    .nonnegative({ message: 'Allocated amount cannot be negative' })
    .max(1000000, { message: 'Allocated amount cannot exceed $1,000,000' })
    .multipleOf(0.01, { message: 'Allocated amount must have at most 2 decimal places' }),
  notes: z.string()
    .max(500, { message: 'Notes cannot exceed 500 characters' })
    .optional(),
})

// Update Allocations Schema (array of allocations)
export const UpdateAllocationsSchema = z.object({
  allocations: z.array(PreSeasonAllocationSchema)
    .min(1, { message: 'At least one category allocation is required' }),
})

// Parent Interest Schema (public form submission)
export const ParentInterestSchema = z.object({
  parentName: z.string()
    .min(2, { message: 'Parent name must be at least 2 characters' })
    .max(100, { message: 'Parent name cannot exceed 100 characters' }),
  email: z.string()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email cannot exceed 255 characters' }),
  phone: z.string()
    .max(20, { message: 'Phone number cannot exceed 20 characters' })
    .optional(),
  playerName: z.string()
    .min(2, { message: 'Player name must be at least 2 characters' })
    .max(100, { message: 'Player name cannot exceed 100 characters' }),
  playerAge: z.number()
    .int({ message: 'Player age must be a whole number' })
    .positive({ message: 'Player age must be positive' })
    .max(25, { message: 'Player age seems too high' })
    .optional(),
  acknowledged: z.boolean(),
  comments: z.string()
    .max(1000, { message: 'Comments cannot exceed 1000 characters' })
    .optional(),
})

// Association Approval Schema
export const AssociationApprovalSchema = z.object({
  notes: z.string()
    .max(1000, { message: 'Notes cannot exceed 1000 characters' })
    .optional(),
})

// Association Rejection Schema (notes required)
export const AssociationRejectionSchema = z.object({
  notes: z.string()
    .min(10, { message: 'Rejection reason must be at least 10 characters' })
    .max(1000, { message: 'Rejection reason cannot exceed 1000 characters' }),
})

// Team Activation Schema
export const TeamActivationSchema = z.object({
  minimumInterestsRequired: z.number()
    .int()
    .positive()
    .default(8),
})

// List Filter Schema
export const PreSeasonBudgetFilterSchema = z.object({
  status: PreSeasonBudgetStatusEnum.optional(),
  associationId: z.string().uuid().optional(),
  season: seasonValidator.optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(50),
  sortBy: z.enum(['createdAt', 'proposedTeamName', 'totalBudget', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Type exports
export type CreatePreSeasonBudgetInput = z.infer<typeof CreatePreSeasonBudgetSchema>
export type UpdatePreSeasonBudgetInput = z.infer<typeof UpdatePreSeasonBudgetSchema>
export type PreSeasonAllocationInput = z.infer<typeof PreSeasonAllocationSchema>
export type UpdateAllocationsInput = z.infer<typeof UpdateAllocationsSchema>
export type ParentInterestInput = z.infer<typeof ParentInterestSchema>
export type AssociationApprovalInput = z.infer<typeof AssociationApprovalSchema>
export type AssociationRejectionInput = z.infer<typeof AssociationRejectionSchema>
export type TeamActivationInput = z.infer<typeof TeamActivationSchema>
export type PreSeasonBudgetFilter = z.infer<typeof PreSeasonBudgetFilterSchema>
export type PreSeasonBudgetStatus = z.infer<typeof PreSeasonBudgetStatusEnum>
