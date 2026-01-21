// /lib/services/rule-enforcement-engine.ts

import { prisma } from '@/lib/prisma'
import type { AssociationRule, RuleViolation } from '@prisma/client'
import * as coachComp from './coach-compensation'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Rule with optional override applied
 */
export type ActiveRule = AssociationRule & {
  isOverridden?: boolean
  overrideReason?: string
}

/**
 * Budget validation input
 */
export type BudgetInput = {
  totalBudget: number
  playerAssessment: number
  maxBuyout: number
  categories: Array<{ name: string; allocated: number }>
}

/**
 * Violation result
 */
export type Violation = {
  ruleId: string
  type: string
  severity: 'WARNING' | 'ERROR' | 'CRITICAL'
  message: string
}

/**
 * Budget validation result
 */
export type BudgetValidationResult = {
  isValid: boolean
  violations: Violation[]
  warnings: Violation[]
}

/**
 * Transaction validation input
 */
export type TransactionInput = {
  id?: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  systemCategoryId?: string | null
  teamId?: string
}

/**
 * Transaction validation result
 */
export type TransactionValidationResult = {
  requiredApprovals: number
  tier: { min: number; max: number; approvals: number } | null
  coachCompValidation?: coachComp.ValidationResult
}

/**
 * Log violation input
 */
export type LogViolationInput = {
  teamId: string
  ruleId: string
  violationType: string
  severity: 'WARNING' | 'ERROR' | 'CRITICAL'
  description: string
  violationData: any
  budgetId?: string
  transactionId?: string
}

// ============================================================================
// RULE ENFORCEMENT ENGINE CLASS
// ============================================================================

export class RuleEnforcementEngine {

  // --------------------------------------------------------------------------
  // PUBLIC METHODS
  // --------------------------------------------------------------------------

  /**
   * Get all active rules for a team
   * - Fetches association rules where isActive = true
   * - Applies team-specific overrides if they exist
   * - Filters out expired overrides
   *
   * @param teamId - The team ID to fetch rules for
   * @returns Array of active rules with overrides applied
   */
  async getActiveRules(teamId: string): Promise<ActiveRule[]> {
    try {
      // Fetch team with association link
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          associationTeam: {
            include: {
              association: true
            }
          }
        }
      })

      const associationId = team?.associationTeam?.associationId

      if (!associationId) {
        console.log(`[RuleEngine] No association found for team ${teamId}`)
        return []
      }

      // Get all active association rules with their overrides
      const rules = await prisma.associationRule.findMany({
        where: {
          associationId: associationId,
          isActive: true
        },
        include: {
          overrides: {
            where: {
              teamId,
              isActive: true,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            }
          }
        }
      })

      console.log(`[RuleEngine] Found ${rules.length} active rules for team ${teamId}`)

      // Apply overrides to rules
      return rules.map(rule => {
        const override = rule.overrides[0] // Take first active override
        if (override) {
          console.log(`[RuleEngine] Applying override to rule ${rule.id}: ${override.overrideReason}`)
          return {
            ...rule,
            config: override.overrideConfig as any,
            isOverridden: true,
            overrideReason: override.overrideReason
          }
        }
        return rule
      })
    } catch (error) {
      console.error(`[RuleEngine] Error fetching active rules for team ${teamId}:`, error)
      return []
    }
  }

  /**
   * Validate a budget against all applicable rules
   * - Checks MAX_BUDGET: Total budget doesn't exceed limit
   * - Checks MAX_ASSESSMENT: Player fees within limit
   * - Checks MAX_BUYOUT: Buyout amounts within limit
   * - Checks ZERO_BALANCE: Budget balances (±$1 tolerance)
   * - Checks REQUIRED_EXPENSES: All required categories present
   *
   * @param teamId - The team ID
   * @param budget - Budget data to validate
   * @returns Validation result with violations and warnings
   */
  async validateBudget(
    teamId: string,
    budget: BudgetInput
  ): Promise<BudgetValidationResult> {
    try {
      const rules = await this.getActiveRules(teamId)
      const violations: Violation[] = []

      console.log(`[RuleEngine] Validating budget for team ${teamId} against ${rules.length} rules`)

      for (const rule of rules) {
        switch (rule.ruleType) {
          case 'MAX_BUDGET': {
            const config = rule.config as { maxAmount: number; currency?: string }
            if (budget.totalBudget > config.maxAmount) {
              violations.push({
                ruleId: rule.id,
                type: 'BUDGET_EXCEEDED',
                severity: 'ERROR',
                message: `Budget of $${budget.totalBudget.toLocaleString()} exceeds maximum of $${config.maxAmount.toLocaleString()}`
              })
              console.log(`[RuleEngine] VIOLATION: Budget exceeded - ${budget.totalBudget} > ${config.maxAmount}`)
            }
            break
          }

          case 'MAX_ASSESSMENT': {
            const config = rule.config as { maxAmount: number; currency?: string }
            if (budget.playerAssessment > config.maxAmount) {
              violations.push({
                ruleId: rule.id,
                type: 'ASSESSMENT_TOO_HIGH',
                severity: 'ERROR',
                message: `Player assessment of $${budget.playerAssessment.toLocaleString()} exceeds maximum of $${config.maxAmount.toLocaleString()}`
              })
              console.log(`[RuleEngine] VIOLATION: Assessment too high - ${budget.playerAssessment} > ${config.maxAmount}`)
            }
            break
          }

          case 'MAX_BUYOUT': {
            const config = rule.config as { maxAmount: number; currency?: string }
            if (budget.maxBuyout > config.maxAmount) {
              violations.push({
                ruleId: rule.id,
                type: 'BUYOUT_TOO_HIGH',
                severity: 'ERROR',
                message: `Max buyout of $${budget.maxBuyout.toLocaleString()} exceeds maximum of $${config.maxAmount.toLocaleString()}`
              })
              console.log(`[RuleEngine] VIOLATION: Buyout too high - ${budget.maxBuyout} > ${config.maxAmount}`)
            }
            break
          }

          case 'ZERO_BALANCE': {
            const totalAllocated = budget.categories.reduce((sum, cat) => sum + cat.allocated, 0)
            const difference = Math.abs(totalAllocated - budget.totalBudget)

            // Allow $1 rounding tolerance
            if (difference > 1) {
              violations.push({
                ruleId: rule.id,
                type: 'UNBALANCED_BUDGET',
                severity: 'ERROR',
                message: `Budget must balance to zero. Allocated: $${totalAllocated.toLocaleString()}, Total: $${budget.totalBudget.toLocaleString()} (difference: $${difference.toFixed(2)})`
              })
              console.log(`[RuleEngine] VIOLATION: Budget unbalanced - difference of $${difference}`)
            }
            break
          }

          case 'REQUIRED_EXPENSES': {
            const requiredCategories = rule.requiredExpenses as string[]
            if (!requiredCategories || !Array.isArray(requiredCategories)) {
              console.warn(`[RuleEngine] Invalid requiredExpenses format for rule ${rule.id}`)
              break
            }

            const budgetCategories = budget.categories.map(c => c.name)
            const missing = requiredCategories.filter(req => !budgetCategories.includes(req))

            if (missing.length > 0) {
              violations.push({
                ruleId: rule.id,
                type: 'MISSING_REQUIRED_EXPENSE',
                severity: 'WARNING',
                message: `Missing required expense categories: ${missing.join(', ')}`
              })
              console.log(`[RuleEngine] WARNING: Missing required categories - ${missing.join(', ')}`)
            }
            break
          }

          case 'COACH_COMPENSATION_LIMIT': {
            // Note: Budget validation for coach compensation happens via
            // a separate call to coachComp.validateBudget() in the budget
            // submission flow since we need the full budgetId
            console.log(`[RuleEngine] Coach compensation validation handled separately for budgets`)
            break
          }

          default:
            console.warn(`[RuleEngine] Unknown rule type: ${rule.ruleType}`)
        }
      }

      const errors = violations.filter(v => v.severity === 'ERROR')
      const warnings = violations.filter(v => v.severity === 'WARNING')

      console.log(`[RuleEngine] Budget validation complete: ${errors.length} errors, ${warnings.length} warnings`)

      return {
        isValid: errors.length === 0,
        violations,
        warnings
      }
    } catch (error) {
      console.error(`[RuleEngine] Error validating budget for team ${teamId}:`, error)
      // Return safe default - don't block on errors
      return {
        isValid: true,
        violations: [],
        warnings: []
      }
    }
  }

  /**
   * Validate a transaction and determine required approvals
   * - Finds APPROVAL_TIERS rule
   * - Matches transaction amount to tier
   * - Returns required approval count
   * - Only applies to EXPENSE transactions
   *
   * @param teamId - The team ID
   * @param transaction - Transaction data to validate
   * @returns Required approvals and tier information
   */
  async validateTransaction(
    teamId: string,
    transaction: TransactionInput
  ): Promise<TransactionValidationResult> {
    try {
      let requiredApprovals = 0
      let tier: { min: number; max: number; approvals: number } | null = null
      let coachCompValidation: coachComp.ValidationResult | undefined

      // Only validate expenses for approval tiers
      if (transaction.type === 'EXPENSE') {
        const rules = await this.getActiveRules(teamId)
        const approvalRule = rules.find(r => r.ruleType === 'APPROVAL_TIERS')

        if (approvalRule) {
          const tiers = approvalRule.approvalTiers as Array<{
            min: number
            max: number
            approvals: number
          }>

          if (tiers && Array.isArray(tiers)) {
            // Find matching tier
            tier = tiers.find(t =>
              transaction.amount >= t.min &&
              transaction.amount < t.max
            ) || null

            requiredApprovals = tier?.approvals || 0

            if (tier) {
              console.log(`[RuleEngine] Transaction $${transaction.amount} requires ${tier.approvals} approvals (tier: $${tier.min}-$${tier.max})`)
            } else {
              console.log(`[RuleEngine] No matching tier found for transaction amount $${transaction.amount}`)
            }
          }
        }

        // Validate coach compensation limits if transaction has necessary data
        if (transaction.teamId && transaction.systemCategoryId !== undefined) {
          try {
            // Get team's association and season
            const team = await prisma.team.findUnique({
              where: { id: transaction.teamId },
              select: {
                associationTeam: {
                  select: {
                    associationId: true,
                    association: {
                      select: {
                        season: true,
                      },
                    },
                  },
                },
              },
            })

            if (team?.associationTeam?.[0]) {
              const associationId = team.associationTeam[0].associationId
              const season = team.associationTeam[0].association.season

              coachCompValidation = await coachComp.validateTransaction({
                transaction: {
                  id: transaction.id,
                  teamId: transaction.teamId,
                  systemCategoryId: transaction.systemCategoryId,
                  amount: transaction.amount,
                },
                season,
                associationId,
              })

              console.log(`[RuleEngine] Coach comp validation: ${coachCompValidation.allowed ? 'ALLOWED' : 'BLOCKED'} (${coachCompValidation.severity})`)
            }
          } catch (error) {
            console.error(`[RuleEngine] Error validating coach compensation:`, error)
            // Don't block on validation errors
          }
        }
      }

      return {
        requiredApprovals,
        tier,
        coachCompValidation,
      }
    } catch (error) {
      console.error(`[RuleEngine] Error validating transaction for team ${teamId}:`, error)
      // Return safe default - don't block on errors
      return { requiredApprovals: 0, tier: null }
    }
  }

  /**
   * Calculate compliance score for a team (0-100)
   * - 100 = No violations
   * - Deducts 5 points per WARNING
   * - Deducts 15 points per ERROR
   * - Deducts 30 points per CRITICAL
   * - Minimum score is 0
   *
   * @param teamId - The team ID
   * @returns Compliance score (0-100)
   */
  async calculateComplianceScore(teamId: string): Promise<number> {
    try {
      const violations = await prisma.ruleViolation.findMany({
        where: {
          teamId,
          resolved: false
        }
      })

      if (violations.length === 0) {
        console.log(`[RuleEngine] Team ${teamId} has perfect compliance (100)`)
        return 100
      }

      // Deduct points based on severity
      let deductions = 0
      violations.forEach(v => {
        switch (v.severity) {
          case 'WARNING':
            deductions += 5
            break
          case 'ERROR':
            deductions += 15
            break
          case 'CRITICAL':
            deductions += 30
            break
        }
      })

      const score = Math.max(0, 100 - deductions)
      console.log(`[RuleEngine] Team ${teamId} compliance score: ${score} (${violations.length} violations, ${deductions} points deducted)`)

      return score
    } catch (error) {
      console.error(`[RuleEngine] Error calculating compliance score for team ${teamId}:`, error)
      // Return 100 on error (optimistic default)
      return 100
    }
  }

  /**
   * Log a rule violation to the database
   * - Creates RuleViolation record
   * - Updates team compliance status
   * - Returns created violation
   *
   * @param input - Violation data
   * @returns Created RuleViolation record
   */
  async logViolation(input: LogViolationInput): Promise<RuleViolation> {
    try {
      console.log(`[RuleEngine] Logging ${input.severity} violation for team ${input.teamId}: ${input.violationType}`)

      const violation = await prisma.ruleViolation.create({
        data: {
          teamId: input.teamId,
          ruleId: input.ruleId,
          violationType: input.violationType,
          severity: input.severity,
          description: input.description,
          violationData: input.violationData,
          budgetId: input.budgetId,
          transactionId: input.transactionId
        }
      })

      console.log(`[RuleEngine] Violation logged with ID: ${violation.id}`)

      // Update compliance status
      await this.updateComplianceStatus(input.teamId)

      return violation
    } catch (error) {
      console.error(`[RuleEngine] Error logging violation for team ${input.teamId}:`, error)
      throw error
    }
  }

  // --------------------------------------------------------------------------
  // PRIVATE METHODS
  // --------------------------------------------------------------------------

  /**
   * Update team compliance status
   * - Fetches all unresolved violations
   * - Calculates compliance score
   * - Counts violations by severity
   * - Determines status: COMPLIANT (90-100), AT_RISK (70-89), NON_COMPLIANT (<70)
   * - Upserts TeamComplianceStatus record
   *
   * @param teamId - The team ID
   */
  private async updateComplianceStatus(teamId: string): Promise<void> {
    try {
      console.log(`[RuleEngine] Updating compliance status for team ${teamId}`)

      const violations = await prisma.ruleViolation.findMany({
        where: {
          teamId,
          resolved: false
        }
      })

      const score = await this.calculateComplianceScore(teamId)

      const warningCount = violations.filter(v => v.severity === 'WARNING').length
      const errorCount = violations.filter(v => v.severity === 'ERROR').length
      const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length

      // Determine status based on score
      let status = 'COMPLIANT'
      if (score < 70) {
        status = 'NON_COMPLIANT'
      } else if (score < 90) {
        status = 'AT_RISK'
      }

      await prisma.teamComplianceStatus.upsert({
        where: { teamId },
        create: {
          teamId,
          complianceScore: score,
          activeViolations: violations.length,
          warningCount,
          errorCount,
          criticalCount,
          status,
          lastCheckedAt: new Date()
        },
        update: {
          complianceScore: score,
          activeViolations: violations.length,
          warningCount,
          errorCount,
          criticalCount,
          status,
          lastCheckedAt: new Date()
        }
      })

      console.log(`[RuleEngine] Compliance status updated: ${status} (score: ${score}, violations: ${violations.length})`)
    } catch (error) {
      console.error(`[RuleEngine] Error updating compliance status for team ${teamId}:`, error)
      // Don't throw - this is a side effect
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const ruleEngine = new RuleEnforcementEngine()
