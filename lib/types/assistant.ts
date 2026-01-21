// HuddleBooks AI Assistant Types
import type { UserRole } from '@prisma/client'
import { z } from 'zod'

// ============================================
// CONTEXT & PERMISSIONS
// ============================================

export interface AssistantContext {
  userId: string
  teamId: string
  role: UserRole
  associationId?: string
  currentRoute?: string
  permissions: UserPermissions
  sessionActions?: string[]
}

export interface UserPermissions {
  canCreateTransaction: boolean
  canEditTransaction: boolean
  canApproveTransaction: boolean
  canViewBudget: boolean
  canEditBudget: boolean
  canSendReminders: boolean
  canGenerateReports: boolean
  canManageTeam: boolean
}

// ============================================
// TOOL SCHEMAS (using Zod for validation)
// ============================================

export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive(),
  categoryId: z.string(),
  vendor: z.string(),
  description: z.string().optional(),
  transactionDate: z.string(), // ISO date
  receiptUrl: z.string().optional(),
})

export const editTransactionSchema = z.object({
  transactionId: z.string(),
  updates: z.object({
    amount: z.number().positive().optional(),
    categoryId: z.string().optional(),
    vendor: z.string().optional(),
    description: z.string().optional(),
    transactionDate: z.string().optional(),
    receiptUrl: z.string().optional(),
  }),
})

export const approveTransactionSchema = z.object({
  transactionId: z.string(),
  comment: z.string().optional(),
})

export const sendParentReminderSchema = z.object({
  subject: z.string(),
  message: z.string(),
  recipientType: z.enum(['all', 'specific']),
  recipientIds: z.array(z.string()).optional(),
})

export const openPageSchema = z.object({
  page: z.enum([
    'dashboard',
    'transactions',
    'budget',
    'reports',
    'team',
    'settings',
    'players',
    'families',
  ]),
  params: z.record(z.string()).optional(),
})

export const generateReportSchema = z.object({
  reportType: z.enum([
    'monthly_summary',
    'budget_variance',
    'transaction_history',
    'compliance',
  ]),
  dateRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
})

export const getTeamBudgetStatusSchema = z.object({
  categoryId: z.string().optional(),
})

export const getTeamTransactionsSchema = z.object({
  categoryId: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  limit: z.number().optional(),
})

// ============================================
// TOOL FUNCTION TYPES
// ============================================

export type ToolFunction =
  | 'createTransaction'
  | 'editTransaction'
  | 'approveTransaction'
  | 'sendParentReminder'
  | 'openPage'
  | 'generateReport'
  | 'getTeamBudgetStatus'
  | 'getAssociationComplianceFlags'
  | 'getTeamTransactions'

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  message?: string
}

// ============================================
// CHAT MESSAGE TYPES
// ============================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  timestamp: Date
}

export interface ToolCall {
  id: string
  function: ToolFunction
  parameters: Record<string, any>
}

// ============================================
// API REQUEST/RESPONSE
// ============================================

export interface AssistantRequest {
  message: string
  conversationHistory: ChatMessage[]
  context: AssistantContext
}

export interface AssistantResponse {
  message: string
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  needsUserAction?: boolean
  suggestedActions?: string[]
}

// ============================================
// KNOWLEDGE BASE TYPES
// ============================================

export interface KnowledgeEntry {
  category: string // 'hockey_rules', 'compliance', 'features', etc.
  title: string
  content: string
  tags: string[]
  relatedPages?: string[]
  roleRelevant?: UserRole[]
}

export interface KnowledgeBase {
  entries: KnowledgeEntry[]
  version: string
  lastUpdated: Date
}
