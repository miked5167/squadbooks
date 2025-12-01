'use server'

import { prisma } from '@/lib/prisma'

export async function getRulesData(associationId: string) {
  try {
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        currency: true,
      },
    })

    if (!association) {
      return { association: null, rules: [] }
    }

    const rules = await prisma.associationRule.findMany({
      where: {
        associationId,
      },
      orderBy: [
        { isActive: 'desc' }, // Active rules first
        { createdAt: 'desc' },
      ],
      include: {
        _count: {
          select: {
            overrides: true,
            violations: true,
          },
        },
      },
    })

    return {
      association,
      rules,
    }
  } catch (error) {
    console.error('[getRulesData] Error:', error)
    return { association: null, rules: [] }
  }
}

export async function toggleRuleActive(ruleId: string, isActive: boolean) {
  try {
    const rule = await prisma.associationRule.update({
      where: { id: ruleId },
      data: { isActive },
    })

    return { success: true, rule }
  } catch (error) {
    console.error('[toggleRuleActive] Error:', error)
    return { success: false, error: 'Failed to update rule' }
  }
}

export async function deleteRule(ruleId: string) {
  try {
    // Soft delete by deactivating
    await prisma.associationRule.update({
      where: { id: ruleId },
      data: { isActive: false },
    })

    return { success: true }
  } catch (error) {
    console.error('[deleteRule] Error:', error)
    return { success: false, error: 'Failed to delete rule' }
  }
}

export async function createRule(data: {
  associationId: string
  ruleType: string
  name: string
  description?: string
  isActive?: boolean
  config: any
  approvalTiers?: any
  requiredExpenses?: any
  signingAuthorityComposition?: any
  teamTypeFilter?: any
  ageDivisionFilter?: any
  competitiveLevelFilter?: any
  createdBy?: string
}) {
  try {
    const rule = await prisma.associationRule.create({
      data: {
        associationId: data.associationId,
        ruleType: data.ruleType,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
        config: data.config,
        approvalTiers: data.approvalTiers,
        requiredExpenses: data.requiredExpenses,
        signingAuthorityComposition: data.signingAuthorityComposition,
        teamTypeFilter: data.teamTypeFilter || null,
        ageDivisionFilter: data.ageDivisionFilter || null,
        competitiveLevelFilter: data.competitiveLevelFilter || null,
        createdBy: data.createdBy,
      },
      include: {
        _count: {
          select: {
            overrides: true,
            violations: true,
          },
        },
      },
    })

    return { success: true, rule }
  } catch (error) {
    console.error('[createRule] Error:', error)
    return { success: false, error: 'Failed to create rule' }
  }
}

export async function updateRule(data: {
  id: string
  ruleType?: string
  name?: string
  description?: string
  isActive?: boolean
  config?: any
  approvalTiers?: any
  requiredExpenses?: any
  signingAuthorityComposition?: any
  teamTypeFilter?: any
  ageDivisionFilter?: any
  competitiveLevelFilter?: any
}) {
  try {
    const rule = await prisma.associationRule.update({
      where: { id: data.id },
      data: {
        ruleType: data.ruleType,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        config: data.config,
        approvalTiers: data.approvalTiers,
        requiredExpenses: data.requiredExpenses,
        signingAuthorityComposition: data.signingAuthorityComposition,
        teamTypeFilter: data.teamTypeFilter,
        ageDivisionFilter: data.ageDivisionFilter,
        competitiveLevelFilter: data.competitiveLevelFilter,
      },
      include: {
        _count: {
          select: {
            overrides: true,
            violations: true,
          },
        },
      },
    })

    return { success: true, rule }
  } catch (error) {
    console.error('[updateRule] Error:', error)
    return { success: false, error: 'Failed to update rule' }
  }
}

export async function getRule(ruleId: string) {
  try {
    const rule = await prisma.associationRule.findUnique({
      where: { id: ruleId },
      include: {
        _count: {
          select: {
            overrides: true,
            violations: true,
          },
        },
      },
    })

    if (!rule) {
      return { success: false, error: 'Rule not found' }
    }

    return { success: true, rule }
  } catch (error) {
    console.error('[getRule] Error:', error)
    return { success: false, error: 'Failed to fetch rule' }
  }
}
