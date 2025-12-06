/**
 * Board Summary Report API Route
 *
 * POST /api/associations/[associationId]/reports/board-summary
 * Generates a PDF report for board meetings with:
 * - Association overview (name, season, generation date)
 * - KPI summary (total teams, health distribution)
 * - Budget totals and averages
 * - At-risk teams requiring attention
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import React from 'react'

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1 solid #ccc',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  kpiCard: {
    width: '23%',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  kpiLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #eee',
    fontSize: 10,
  },
  col1: { width: '30%' },
  col2: { width: '15%' },
  col3: { width: '20%' },
  col4: { width: '15%' },
  col5: { width: '20%' },
  statusHealthy: {
    color: '#16a34a',
  },
  statusWarning: {
    color: '#eab308',
  },
  statusCritical: {
    color: '#dc2626',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
})

// PDF Document Component
const BoardSummaryPDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Board Financial Summary</Text>
        <Text style={styles.subtitle}>{data.association.name}</Text>
        <Text style={styles.subtitle}>Season: {data.association.season || 'N/A'}</Text>
        <Text style={styles.subtitle}>
          Generated: {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* KPI Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Teams</Text>
            <Text style={styles.kpiValue}>{data.totals.totalTeams}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Healthy</Text>
            <Text style={[styles.kpiValue, styles.statusHealthy]}>
              {data.statusCounts.healthy}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Needs Attention</Text>
            <Text style={[styles.kpiValue, styles.statusWarning]}>
              {data.statusCounts.needsAttention}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>At Risk</Text>
            <Text style={[styles.kpiValue, styles.statusCritical]}>
              {data.statusCounts.atRisk}
            </Text>
          </View>
        </View>
      </View>

      {/* Budget Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Budget:</Text>
          <Text style={styles.value}>
            ${data.budgetTotals.totalBudget.toLocaleString()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Spent:</Text>
          <Text style={styles.value}>
            ${data.budgetTotals.totalSpent.toLocaleString()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Remaining:</Text>
          <Text style={styles.value}>
            ${data.budgetTotals.totalRemaining.toLocaleString()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Average Budget Utilization:</Text>
          <Text style={styles.value}>
            {data.budgetTotals.averagePercentUsed.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* At-Risk Teams */}
      {data.atRiskTeams.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teams Requiring Attention</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Team Name</Text>
              <Text style={styles.col2}>Division</Text>
              <Text style={styles.col3}>Status</Text>
              <Text style={styles.col4}>% Used</Text>
              <Text style={styles.col5}>Red Flags</Text>
            </View>
            {data.atRiskTeams.map((team: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.col1}>{team.teamName}</Text>
                <Text style={styles.col2}>{team.division || '-'}</Text>
                <Text
                  style={[
                    styles.col3,
                    team.healthStatus === 'at_risk'
                      ? styles.statusCritical
                      : styles.statusWarning,
                  ]}
                >
                  {team.healthStatus === 'at_risk' ? 'At Risk' : 'Needs Attention'}
                </Text>
                <Text style={styles.col4}>
                  {team.percentUsed !== null ? `${team.percentUsed.toFixed(0)}%` : '-'}
                </Text>
                <Text style={styles.col5}>{team.redFlagCount} flag(s)</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        Generated with HuddleBooks Association Command Center
      </Text>
    </Page>
  </Document>
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate request
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const { associationId } = resolvedParams

    // Check user authorization
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        clerkUserId: userId,
        associationId: associationId,
      },
      include: {
        association: true,
      },
    })

    if (!associationUser || !associationUser.association) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch overview data
    const teams = await prisma.associationTeam.findMany({
      where: {
        associationId: associationId,
      },
      select: {
        id: true,
        teamName: true,
        division: true,
      },
    })

    const teamIds = teams.map((t) => t.id)

    // Get latest snapshots
    const latestSnapshots = await prisma.$queryRaw<
      Array<{
        association_team_id: string
        health_status: string
        budget_total: number | null
        spent: number | null
        remaining: number | null
        percent_used: number | null
        red_flags: any
      }>
    >`
      SELECT DISTINCT ON (association_team_id)
        association_team_id,
        health_status,
        budget_total,
        spent,
        remaining,
        percent_used,
        red_flags
      FROM team_financial_snapshots
      WHERE association_team_id = ANY(${teamIds}::uuid[])
      ORDER BY association_team_id, snapshot_at DESC
    `

    // Calculate totals
    const totals = {
      totalTeams: teams.length,
      activeTeams: teams.length,
    }

    const statusCounts = {
      healthy: latestSnapshots.filter((s) => s.health_status === 'healthy').length,
      needsAttention: latestSnapshots.filter((s) => s.health_status === 'needs_attention').length,
      atRisk: latestSnapshots.filter((s) => s.health_status === 'at_risk').length,
    }

    const budgetTotals = latestSnapshots.reduce(
      (acc, snapshot) => {
        acc.totalBudget += Number(snapshot.budget_total || 0)
        acc.totalSpent += Number(snapshot.spent || 0)
        acc.totalRemaining += Number(snapshot.remaining || 0)
        return acc
      },
      { totalBudget: 0, totalSpent: 0, totalRemaining: 0 }
    )

    const validPercentages = latestSnapshots
      .map((s) => Number(s.percent_used || 0))
      .filter((p) => p > 0)
    const averagePercentUsed =
      validPercentages.length > 0
        ? validPercentages.reduce((a, b) => a + b, 0) / validPercentages.length
        : 0

    // Get at-risk teams
    const teamsWithSnapshots = latestSnapshots.map((snapshot) => {
      const team = teams.find((t) => t.id === snapshot.association_team_id)
      return {
        ...team,
        ...snapshot,
        redFlagCount: Array.isArray(snapshot.red_flags) ? snapshot.red_flags.length : 0,
      }
    })

    const atRiskTeams = teamsWithSnapshots
      .filter((t) => t.health_status !== 'healthy')
      .sort((a, b) => {
        if (a.health_status === 'at_risk' && b.health_status !== 'at_risk') return -1
        if (a.health_status !== 'at_risk' && b.health_status === 'at_risk') return 1
        return Number(b.percent_used || 0) - Number(a.percent_used || 0)
      })
      .slice(0, 15)

    // Prepare data for PDF
    const pdfData = {
      association: associationUser.association,
      totals,
      statusCounts,
      budgetTotals: {
        ...budgetTotals,
        averagePercentUsed,
      },
      atRiskTeams: atRiskTeams.map((t) => ({
        teamName: t.teamName,
        division: t.division,
        healthStatus: t.health_status,
        percentUsed: t.percent_used ? Number(t.percent_used) : null,
        redFlagCount: t.redFlagCount,
      })),
    }

    // Generate PDF
    const pdfDocument = <BoardSummaryPDF data={pdfData} />
    const pdfBuffer = await pdf(pdfDocument).toBuffer()

    // Save report metadata (optional - check if Report model exists)
    try {
      await prisma.report.create({
        data: {
          associationId: associationId,
          generatedBy: associationUser.id,
          reportType: 'board_summary',
        },
      })
    } catch (e) {
      // Report model may not exist in schema, ignore error
      logger.info('Could not save report metadata', e as Error)
    }

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Board-Summary-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    logger.error('Error generating board summary report', error as Error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
