'use server'

import { prisma } from '@/lib/prisma'

export async function getComplianceData(associationId: string) {
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
      return { association: null, teams: [], stats: null }
    }

    // Get all teams with their compliance status
    const associationTeams = await prisma.associationTeam.findMany({
      where: {
        associationId,
        isActive: true,
      },
      include: {
        team: {
          include: {
            complianceStatus: true,
            violations: {
              where: {
                resolved: false,
              },
            },
          },
        },
      },
    })

    // Calculate statistics
    const teams = associationTeams
      .filter(at => at.team)
      .map(at => ({
        id: at.team!.id,
        name: at.teamName,
        division: at.division,
        complianceStatus: at.team!.complianceStatus,
        activeViolations: at.team!.violations.length,
      }))

    const stats = {
      totalTeams: teams.length,
      compliant: teams.filter(t => t.complianceStatus?.status === 'COMPLIANT').length,
      atRisk: teams.filter(t => t.complianceStatus?.status === 'AT_RISK').length,
      nonCompliant: teams.filter(t => t.complianceStatus?.status === 'NON_COMPLIANT').length,
      averageScore: teams.length > 0
        ? teams.reduce((sum, t) => sum + (t.complianceStatus?.complianceScore || 100), 0) / teams.length
        : 100,
      totalViolations: teams.reduce((sum, t) => sum + t.activeViolations, 0),
    }

    return {
      association,
      teams,
      stats,
    }
  } catch (error) {
    console.error('[getComplianceData] Error:', error)
    return { association: null, teams: [], stats: null }
  }
}
