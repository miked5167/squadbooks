import { z } from 'zod'

// Enums matching Prisma schema
export const TransactionTypeEnum = z.enum(['INCOME', 'EXPENSE'])
export const TransactionStatusEnum = z.enum([
  // New validation-first statuses
  'IMPORTED',
  'VALIDATED',
  'EXCEPTION',
  'RESOLVED',
  'LOCKED',
  // Legacy statuses (backward compatibility)
  'DRAFT',
  'PENDING',
  'APPROVED',
  'APPROVED_AUTOMATIC',
  'REJECTED',
])

// Create Transaction Schema
export const CreateTransactionSchema = z.object({
  type: TransactionTypeEnum,
  amount: z.number()
    .positive({ message: 'Amount must be positive' })
    .max(100000, { message: 'Amount cannot exceed $100,000' })
    .multipleOf(0.01, { message: 'Amount must have at most 2 decimal places' }),
  categoryId: z.string().min(1, { message: 'Category is required' }),
  vendor: z.string()
    .min(1, { message: 'Vendor/Payee is required' })
    .max(255, { message: 'Vendor name too long' }),
  description: z.string()
    .max(500, { message: 'Description too long' })
    .optional(),
  transactionDate: z.string().refine((date) => {
    const d = new Date(date)
    const now = new Date()
    return d <= now
  }, { message: 'Transaction date cannot be in the future' }),
  receiptUrl: z.string().url().optional(),
})

// Update Transaction Schema (same as create but all optional except what we allow to update)
export const UpdateTransactionSchema = z.object({
  amount: z.number()
    .positive({ message: 'Amount must be positive' })
    .max(100000, { message: 'Amount cannot exceed $100,000' })
    .multipleOf(0.01, { message: 'Amount must have at most 2 decimal places' })
    .optional(),
  categoryId: z.string().min(1).optional(),
  vendor: z.string()
    .min(1, { message: 'Vendor/Payee is required' })
    .max(255, { message: 'Vendor name too long' })
    .optional(),
  description: z.string()
    .max(500, { message: 'Description too long' })
    .optional(),
  transactionDate: z.string().refine((date) => {
    const d = new Date(date)
    const now = new Date()
    return d <= now
  }, { message: 'Transaction date cannot be in the future' })
    .optional(),
  receiptUrl: z.string().url().optional(),
})

// Transaction Filter Schema
export const TransactionFilterSchema = z.object({
  type: TransactionTypeEnum.optional(),
  status: TransactionStatusEnum.optional(),
  categoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(50),
  sortBy: z.enum(['date', 'amount', 'vendor']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Exception Resolution Schema
export const ResolutionActionEnum = z.enum(['REVALIDATE', 'OVERRIDE', 'CORRECT'])

export const ResolveExceptionSchema = z.object({
  action: ResolutionActionEnum,
  notes: z.string().min(10, { message: 'Resolution notes must be at least 10 characters' }),
  overrideJustification: z.string().optional(),
  correctedData: z.object({
    categoryId: z.string().optional(),
    systemCategoryId: z.string().optional(),
    vendor: z.string().optional(),
    amount: z.number().positive().optional(),
    receiptUrl: z.string().url().optional(),
    description: z.string().optional(),
  }).optional(),
})

// Type exports
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>
export type TransactionFilter = z.infer<typeof TransactionFilterSchema>
export type ResolutionAction = z.infer<typeof ResolutionActionEnum>
export type ResolveExceptionInput = z.infer<typeof ResolveExceptionSchema>
