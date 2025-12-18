/**
 * Types for the validation-first exceptions workflow
 */

import type { TransactionType, TransactionStatus } from '@prisma/client'

export interface ValidationViolation {
  code: string
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  message: string
  ruleId?: string
  metadata?: Record<string, any>
}

export interface ValidationResult {
  compliant: boolean
  violations: ValidationViolation[]
  score?: number
  validatedAt: string
  checksRun: Record<string, boolean>
}

export interface TransactionWithValidation {
  id: string
  teamId: string
  type: TransactionType
  status: TransactionStatus
  amount: number
  vendor: string
  description: string | null
  transactionDate: Date
  receiptUrl: string | null
  receiptStatus: string | null
  category: {
    id: string
    name: string
    heading: string
    color: string
  } | null
  creator: {
    id: string
    name: string
    role: string
  }
  validationJson: ValidationResult | null
  exceptionReason: string | null
  exceptionSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
  createdAt: Date
  updatedAt: Date
}

export interface ExceptionFilters {
  search: string
  categories: string[]
  severities: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[]
}

export interface ResolveExceptionInput {
  transactionId: string
  resolution: 'OVERRIDE' | 'CORRECT' | 'REVALIDATE'
  reason: string
  correctedData?: {
    categoryId?: string
    vendor?: string
    amount?: number
    description?: string
    receiptUrl?: string
  }
}
