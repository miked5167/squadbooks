/**
 * Compliance Snapshot Report API Route
 *
 * POST /api/associations/[associationId]/reports/compliance-snapshot
 * Generates a PDF report focused on compliance metrics:
 * - Association overview
 * - Compliance percentages (bank connected, reconciled, etc.)
 * - Active alerts summary by type
 * - Teams with compliance issues
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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
    width: '60%',
    fontWeight: 'bold',
  },
  value: {
    width: '40%',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  metricCard: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  alertSummary: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
  },
  alertRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  alertLabel: {
    width: '70%',
    fontSize: 10,
  },
  alertCount: {
    width: '30%',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  statusGood: {
    color: '#16a34a',
  },
  statusWarning: {
    color: '#eab308',
  },
  statusBad: {
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
const ComplianceSnapshotPDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Compliance Snapshot</Text>
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

      {/* Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Teams Monitored:</Text>
          <Text style={styles.value}>{data.totals.totalTeams}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Teams with Data:</Text>
          <Text style={styles.value}>{data.totals.teamsWithSnapshots}</Text>
        </View>
      </View>

      {/* Compliance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Bank Connected</Text>
            <Text
              style={[
                styles.metricValue,
                data.compliance.bankConnectedPct >= 80
                  ? styles.statusGood
                  : data.compliance.bankConnectedPct >= 50
                  ? styles.statusWarning
                  : styles.statusBad,
              ]}
            >
              {data.compliance.bankConnectedPct.toFixed(0)}%
            </Text>
            <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
              {data.compliance.bankConnectedCount} of {data.totals.teamsWithSnapshots} teams
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Recently Reconciled</Text>
            <Text
              style={[
                styles.metricValue,
                data.compliance.reconciledPct >= 70
                  ? styles.statusGood
                  : data.compliance.reconciledPct >= 40
                  ? styles.statusWarning
                  : styles.statusBad,
              ]}
            >
              {data.compliance.reconciledPct.toFixed(0)}%
            </Text>
            <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
              Within last 30 days
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pending Approvals</Text>
            <Text
              style={[
                styles.metricValue,
                data.compliance.avgPendingApprovals < 5
                  ? styles.statusGood
                  : data.compliance.avgPendingApprovals < 10
                  ? styles.statusWarning
                  : styles.statusBad,
              ]}
            >
              {data.compliance.avgPendingApprovals.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
              Average per team
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Missing Receipts</Text>
            <Text
              style={[
                styles.metricValue,
                data.compliance.avgMissingReceipts < 3
                  ? styles.statusGood
                  : data.compliance.avgMissingReceipts < 8
                  ? styles.statusWarning
                  : styles.statusBad,
              ]}
            >
              {data.compliance.avgMissingReceipts.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
              Average per team
            </Text>
          </View>
        </View>
      </View>

      {/* Active Alerts */}
      {data.alerts.totalAlerts > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Alerts Summary</Text>
          <View style={styles.alertSummary}>
            <View style={styles.alertRow}>
              <Text style={styles.alertLabel}>Total Active Alerts:</Text>
              <Text style={styles.alertCount}>{data.alerts.totalAlerts}</Text>
            </View>
            <View style={styles.alertRow}>
              <Text style={[styles.alertLabel, styles.statusBad]}>Critical:</Text>
              <Text style={[styles.alertCount, styles.statusBad]}>
                {data.alerts.criticalCount}
              </Text>
            </View>
            <View style={styles.alertRow}>
              <Text style={[styles.alertLabel, styles.statusWarning]}>Warning:</Text>
              <Text style={[styles.alertCount, styles.statusWarning]}>
                {data.alerts.warningCount}
              </Text>
            </View>
          </View>

          {/* Alerts by Type */}
          {data.alerts.byType.length > 0 && (
            <View style={{ marginTop: 15 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>
                Alerts by Type
              </Text>
              {data.alerts.byType.map((alert: any, index: number) => (
                <View key={index} style={styles.alertRow}>
                  <Text style={styles.alertLabel}>{alert.type}:</Text>
                  <Text style={styles.alertCount}>{alert.count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {data.recommendations.map((rec: string, index: number) => (
          <Text key={index} style={{ marginBottom: 6, fontSize: 10 }}>
            • {rec}
          </Text>
        ))}
      </View>

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch data
    const teams = await prisma.associationTeam.findMany({
      where: { associationId },
    })

    const teamIds = teams.map((t) => t.id)

    // Get latest snapshots
    const latestSnapshots = await prisma.$queryRaw<
      Array<{
        bank_connected: boolean | null
        bank_reconciled_through: Date | null
        pending_approvals: number | null
        missing_receipts: number | null
      }>
    >`
      SELECT DISTINCT ON (association_team_id)
        bank_connected,
        bank_reconciled_through,
        pending_approvals,
        missing_receipts
      FROM team_financial_snapshots
      WHERE association_team_id = ANY(${teamIds}::uuid[])
      ORDER BY association_team_id, snapshot_at DESC
    `

    // Calculate compliance metrics
    const bankConnectedCount = latestSnapshots.filter((s) => s.bank_connected).length
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const reconciledCount = latestSnapshots.filter(
      (s) => s.bank_reconciled_through && new Date(s.bank_reconciled_through) >= thirtyDaysAgo
    ).length

    const totalPendingApprovals = latestSnapshots.reduce(
      (sum, s) => sum + (s.pending_approvals || 0),
      0
    )
    const totalMissingReceipts = latestSnapshots.reduce(
      (sum, s) => sum + (s.missing_receipts || 0),
      0
    )

    const compliance = {
      bankConnectedCount,
      bankConnectedPct:
        latestSnapshots.length > 0 ? (bankConnectedCount / latestSnapshots.length) * 100 : 0,
      reconciledPct:
        latestSnapshots.length > 0 ? (reconciledCount / latestSnapshots.length) * 100 : 0,
      avgPendingApprovals:
        latestSnapshots.length > 0 ? totalPendingApprovals / latestSnapshots.length : 0,
      avgMissingReceipts:
        latestSnapshots.length > 0 ? totalMissingReceipts / latestSnapshots.length : 0,
    }

    // Get active alerts
    const alerts = await prisma.alert.findMany({
      where: {
        associationId,
        status: 'active',
      },
    })

    const criticalAlerts = alerts.filter((a) => a.severity === 'critical')
    const warningAlerts = alerts.filter((a) => a.severity === 'warning')

    // Group alerts by type
    const alertsByType = alerts.reduce((acc: any, alert) => {
      const existing = acc.find((a: any) => a.type === alert.alertType)
      if (existing) {
        existing.count++
      } else {
        acc.push({ type: alert.alertType, count: 1 })
      }
      return acc
    }, [])

    // Generate recommendations
    const recommendations: string[] = []
    if (compliance.bankConnectedPct < 80) {
      recommendations.push(
        `${(100 - compliance.bankConnectedPct).toFixed(0)}% of teams need to connect their bank accounts for automated reconciliation.`
      )
    }
    if (compliance.reconciledPct < 70) {
      recommendations.push(
        'Many teams have not reconciled their bank statements recently. Consider sending a reminder.'
      )
    }
    if (compliance.avgPendingApprovals >= 5) {
      recommendations.push(
        'Teams have pending approvals that require attention to maintain smooth operations.'
      )
    }
    if (criticalAlerts.length > 0) {
      recommendations.push(
        `${criticalAlerts.length} critical alert(s) require immediate attention.`
      )
    }
    if (recommendations.length === 0) {
      recommendations.push('All teams are showing good compliance! Keep up the great work.')
    }

    // Prepare PDF data
    const pdfData = {
      association: associationUser.association,
      totals: {
        totalTeams: teams.length,
        teamsWithSnapshots: latestSnapshots.length,
      },
      compliance,
      alerts: {
        totalAlerts: alerts.length,
        criticalCount: criticalAlerts.length,
        warningCount: warningAlerts.length,
        byType: alertsByType.sort((a: any, b: any) => b.count - a.count).slice(0, 5),
      },
      recommendations,
    }

    // Generate PDF
    const pdfDocument = <ComplianceSnapshotPDF data={pdfData} />
    const pdfBuffer = await pdf(pdfDocument).toBuffer()

    // Save report metadata (optional - check if Report model exists)
    try {
      await prisma.report.create({
        data: {
          associationId: associationId,
          generatedBy: associationUser.id,
          reportType: 'compliance_snapshot',
        },
      })
    } catch (e) {
      // Report model may not exist in schema, ignore error
      console.log('Could not save report metadata:', e)
    }

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Compliance-Snapshot-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating compliance snapshot report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
