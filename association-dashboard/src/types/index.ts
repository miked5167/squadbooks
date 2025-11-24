/**
 * Common Types for Association Command Center
 */

// ============================================
// HEALTH STATUS
// ============================================
export type HealthStatus = 'healthy' | 'needs_attention' | 'at_risk'

export type RedFlag = {
  code: string
  message: string
  severity: 'warning' | 'critical'
}

// ============================================
// ALERTS
// ============================================
export type AlertType =
  | 'budget_utilization'
  | 'bank_reconciliation'
  | 'pending_approvals'
  | 'inactivity'

export type AlertSeverity = 'warning' | 'critical'

export type AlertStatus = 'active' | 'resolved'

// ============================================
// REPORTS
// ============================================
export type ReportType = 'board_summary' | 'compliance_snapshot'

// ============================================
// API RESPONSES
// ============================================
export type ApiResponse<T> =
  | {
      data: T
      error: null
    }
  | {
      data: null
      error: {
        code: string
        message: string
      }
    }

// ============================================
// PAGINATION
// ============================================
export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============================================
// DASHBOARD DATA
// ============================================
export type TeamHealthSummary = {
  teamId: string
  teamName: string
  division: string | null
  healthStatus: HealthStatus
  budgetTotal: number
  spent: number
  remaining: number
  percentUsed: number
  lastActivity: Date | null
  redFlagCount: number
}

export type AssociationOverview = {
  associationId: string
  name: string
  season: string
  dataAsOf: Date
  totals: {
    teamCount: number
    statusCounts: {
      healthy: number
      needsAttention: number
      atRisk: number
    }
    budgetTotal: number
    spent: number
    remaining: number
  }
  topAttentionTeams: TeamHealthSummary[]
  recentAlerts: AlertSummary[]
}

export type AlertSummary = {
  id: string
  teamName: string
  alertType: AlertType
  severity: AlertSeverity
  title: string
  createdAt: Date
}
