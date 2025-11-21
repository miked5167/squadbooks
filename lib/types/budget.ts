/**
 * Budget type definitions for TeamTreasure dashboard components
 */

export interface BudgetCategory {
  id: string
  name: string
  heading: string // For grouping (Ice Time, Equipment, etc.)
  color: string // Hex color for visualization
  allocated: number // in cents
  spent: number // in cents
  remaining: number // in cents
  percentUsed: number // calculated: (spent/allocated) * 100
  trend?: number // percentage change vs last month
  lastExpenseDate?: Date
  transactionCount: number
}

export interface BudgetSummary {
  totalBudget: number // in cents
  totalSpent: number // in cents
  totalRemaining: number // in cents
  percentUsed: number
  categoriesOnTrack: number
  categoriesWarning: number
  categoriesOverBudget: number
  projectedSurplusDeficit: number // in cents
  season: string
  lastUpdated: Date
}

export interface BudgetHeadingGroup {
  heading: string
  color: string
  allocated: number // in cents
  spent: number // in cents
  percentOfTotal: number
}

/**
 * Utility function to format currency from cents to display string
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/**
 * Utility function to get health status based on percent used
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical'

export function getHealthStatus(percentUsed: number): HealthStatus {
  if (percentUsed <= 85) return 'healthy'
  if (percentUsed <= 95) return 'warning'
  return 'critical'
}

/**
 * Utility function to get color for health status
 */
export function getHealthColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return '#10B981' // green
    case 'warning':
      return '#F59E0B' // amber
    case 'critical':
      return '#EF4444' // red
  }
}

/**
 * Category heading colors - matches design system
 */
export const HEADING_COLORS: Record<string, string> = {
  'Ice Time': '#0EA5E9', // blue
  'Equipment': '#8B5CF6', // purple
  'Coaching': '#F59E0B', // amber
  'Travel': '#10B981', // green
  'League': '#EC4899', // pink
  'Operations': '#6366F1', // indigo
  'Tournament': '#14B8A6', // teal
}

/**
 * Get color for a category heading
 */
export function getHeadingColor(heading: string): string {
  return HEADING_COLORS[heading] || '#6B7280' // default gray
}
