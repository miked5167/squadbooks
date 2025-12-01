'use server'

import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { ruleEngine } from '@/lib/services/rule-enforcement-engine'

/**
 * Validate a transaction against association rules
 * Returns required approvals and any violations
 */
export async function validateTransaction(amount: number, type: 'INCOME' | 'EXPENSE') {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
        requiredApprovals: 0,
        tier: null
      }
    }

    // Get user's team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true },
    })

    if (!user || !user.teamId) {
      return {
        success: false,
        error: 'No team found',
        requiredApprovals: 0,
        tier: null
      }
    }

    // Validate transaction
    const result = await ruleEngine.validateTransaction(user.teamId, {
      amount,
      type,
    })

    return {
      success: true,
      requiredApprovals: result.requiredApprovals,
      tier: result.tier,
    }
  } catch (error) {
    console.error('[validateTransaction] Error:', error)
    return {
      success: false,
      error: 'Validation failed',
      requiredApprovals: 0,
      tier: null
    }
  }
}

/**
 * Get team's current compliance status
 */
export async function getTeamCompliance() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
        score: null,
        status: null
      }
    }

    // Get user's team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true },
    })

    if (!user || !user.teamId) {
      return {
        success: false,
        error: 'No team found',
        score: null,
        status: null
      }
    }

    // Get active violations
    const violations = await prisma.ruleViolation.findMany({
      where: {
        teamId: user.teamId,
        resolved: false,
      },
      select: {
        severity: true,
        description: true,
        rule: {
          select: {
            name: true,
          },
        },
      },
    })

    // Calculate compliance score
    const score = await ruleEngine.calculateComplianceScore(user.teamId)

    // Determine status
    let status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT'
    if (score >= 90) {
      status = 'COMPLIANT'
    } else if (score >= 70) {
      status = 'AT_RISK'
    } else {
      status = 'NON_COMPLIANT'
    }

    return {
      success: true,
      score,
      status,
      violations: violations.map(v => ({
        severity: v.severity,
        description: v.description,
        ruleName: v.rule.name,
      })),
    }
  } catch (error) {
    console.error('[getTeamCompliance] Error:', error)
    return {
      success: false,
      error: 'Failed to get compliance status',
      score: null,
      status: null
    }
  }
}
