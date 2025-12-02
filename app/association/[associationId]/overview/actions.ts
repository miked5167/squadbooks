'use server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface OverviewData {
  association: {
    id: string
    name: string
    abbreviation: string | null
    provinceState: string | null
    season: string | null
  } | null
  teams: Array<{
    id: string
    teamName: string
    division: string | null
    isActive: boolean
    treasurerName: string | null
    treasurerEmail: string | null
    connectedAt: Date | null
    lastSyncedAt: Date | null
    team: {
      id: string
      name: string
      level: string
      budgetTotal: number
    } | null
    latestSnapshot: {
      id: string
      healthStatus: string
      healthScore: number | null
      budgetTotal: number | null
      spent: number | null
      remaining: number | null
      percentUsed: number | null
      pendingApprovals: number | null
      missingReceipts: number | null
      snapshotAt: Date
    } | null
  }>
  recentAlerts: Array<{
    id: string
    teamId: string | null
    teamName: string | null
    type: string
    title: string
    severity: string
    createdAt: Date
  }>
}

export async function getOverviewData(associationId: string): Promise<OverviewData> {
  try {
    // Fetch association details
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        provinceState: true,
        season: true,
      },
    })

    if (!association) {
      return {
        association: null,
        teams: [],
        recentAlerts: [],
      }
    }

    // Fetch all teams linked to this association with their latest snapshots
    const associationTeams = await prisma.associationTeam.findMany({
      where: {
        associationId,
        isActive: true,
      },
      select: {
        id: true,
        teamName: true,
        division: true,
        isActive: true,
        treasurerName: true,
        treasurerEmail: true,
        connectedAt: true,
        lastSyncedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            level: true,
            budgetTotal: true,
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
            budgetTotal: true,
            spent: true,
            remaining: true,
            percentUsed: true,
            pendingApprovals: true,
            missingReceipts: true,
            snapshotAt: true,
          },
        },
      },
      orderBy: {
        teamName: 'asc',
      },
    })

    // Transform the data to include the latest snapshot
    const teams = associationTeams.map(at => ({
      id: at.id,
      teamName: at.teamName,
      division: at.division,
      isActive: at.isActive,
      treasurerName: at.treasurerName,
      treasurerEmail: at.treasurerEmail,
      connectedAt: at.connectedAt,
      lastSyncedAt: at.lastSyncedAt,
      team: at.team,
      latestSnapshot: at.snapshots[0] || null,
    }))

    // Fetch recent alerts (last 7 days, up to 10 alerts)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const alerts = await prisma.alert.findMany({
      where: {
        associationId,
        createdAt: {
          gte: sevenDaysAgo,
        },
        resolvedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        team: {
          select: {
            teamName: true,
          },
        },
      },
    })

    const recentAlerts = alerts.map(alert => ({
      id: alert.id,
      teamId: alert.associationTeamId,
      teamName: alert.team?.teamName || null,
      type: alert.alertType,
      title: alert.title,
      severity: alert.severity,
      createdAt: alert.createdAt,
    }))

    return {
      association,
      teams,
      recentAlerts,
    }
  } catch (error) {
    console.error('Error fetching overview data:', error)
    return {
      association: null,
      teams: [],
      recentAlerts: [],
    }
  }
}
