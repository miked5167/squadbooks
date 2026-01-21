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

    // Get all teams with their latest snapshots (same as teams page)
    const associationTeams = await prisma.associationTeam.findMany({
      where: {
        associationId,
        isActive: true,
      },
      include: {
        team: {
          include: {
            violations: {
              where: {
                resolved: false,
              },
            },
          },
        },
        snapshots: {
          orderBy: {
            snapshotAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            healthStatus: true,
            healthScore: true,
            snapshotAt: true,
          },
        },
      },
    })

    // Calculate statistics using snapshot healthStatus (same as teams page)
    const teams = associationTeams
      .filter(at => at.team)
      .map(at => {
        const latestSnapshot = at.snapshots[0] || null
        return {
          id: at.id, // Use associationTeam.id to match team detail page route
          name: at.teamName,
          division: at.division,
          healthStatus: latestSnapshot?.healthStatus || null,
          healthScore: latestSnapshot?.healthScore || null,
          activeViolations: at.team!.violations.length,
        }
      })

    const stats = {
      totalTeams: teams.length,
      compliant: teams.filter(t => t.healthStatus === 'healthy').length,
      atRisk: teams.filter(t => t.healthStatus === 'needs_attention').length,
      nonCompliant: teams.filter(t => t.healthStatus === 'at_risk').length,
      averageScore:
        teams.length > 0
          ? teams.reduce((sum, t) => sum + (t.healthScore || 100), 0) / teams.length
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
