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
