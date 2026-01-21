'use server'

import { prisma } from '@/lib/prisma'

export async function getViolationsData(associationId: string) {
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
      return { association: null, violations: [], summary: null }
    }

    // Get all violations for teams in this association
    const associationTeams = await prisma.associationTeam.findMany({
      where: {
        associationId,
        isActive: true,
      },
      select: {
        teamId: true,
        teamName: true,
      },
    })

    const teamIds = associationTeams
      .filter(at => at.teamId)
      .map(at => at.teamId!)

    const violations = await prisma.ruleViolation.findMany({
      where: {
        teamId: { in: teamIds },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        rule: {
          select: {
            id: true,
            name: true,
            ruleType: true,
          },
        },
      },
      orderBy: [
        { resolved: 'asc' }, // Unresolved first
        { createdAt: 'desc' },
      ],
    })

    // Calculate summary stats (unresolved only)
    const unresolvedViolations = violations.filter(v => !v.resolved)
    const summary = {
      total: unresolvedViolations.length,
      critical: unresolvedViolations.filter(v => v.severity === 'CRITICAL').length,
      errors: unresolvedViolations.filter(v => v.severity === 'ERROR').length,
      warnings: unresolvedViolations.filter(v => v.severity === 'WARNING').length,
    }

    return {
      association,
      violations,
      summary,
    }
  } catch (error) {
    console.error('[getViolationsData] Error:', error)
    return { association: null, violations: [], summary: null }
  }
}

export async function resolveViolation(
  violationId: string,
  resolvedBy: string,
  resolutionNotes: string
) {
  try {
    const violation = await prisma.ruleViolation.update({
      where: { id: violationId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        resolutionNotes,
      },
    })

    // Update team compliance status
    const { ruleEngine } = await import('@/lib/services/rule-enforcement-engine')
    await ruleEngine.calculateComplianceScore(violation.teamId)

    return { success: true, violation }
  } catch (error) {
    console.error('[resolveViolation] Error:', error)
    return { success: false, error: 'Failed to resolve violation' }
  }
}
