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
export const BoardSummaryPDF = ({ data }: { data: any }) => (
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
