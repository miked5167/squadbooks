'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

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
export const ComplianceSnapshotPDF = ({ data }: { data: any }) => (
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
