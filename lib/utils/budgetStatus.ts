/**
 * Budget status utility functions
 * Provides helpers for calculating budget health, status, and colors
 */

export type BudgetStatus = 'under' | 'on-track' | 'warning' | 'over'

/**
 * Color palette for budget status (aligned with HuddleBooks brand)
 */
export const budgetColors = {
  // Primary (Navy Blue - Trust & Professionalism)
  primary: '#003F87',

  // Status Colors
  success: '#10B981',    // Under budget (green)
  warning: '#F59E0B',    // 70-90% spent (amber)
  danger: '#EF4444',     // Over budget (red)
  neutral: '#64748B',    // On track / default (cool gray)

  // UI Colors
  background: '#FFFFFF',
  backgroundAlt: '#F9FAFB',
  border: '#E5E7EB',
  text: '#1F2937',
  textMuted: '#6B7280',
} as const

/**
 * Calculate budget status based on allocated and spent amounts
 * @param allocated - Budgeted amount in dollars
 * @param spent - Spent amount in dollars
 * @returns Status: 'under', 'on-track', 'warning', or 'over'
 */
export function getBudgetStatus(allocated: number, spent: number): BudgetStatus {
  if (allocated === 0) return 'on-track'
  if (spent > allocated) return 'over'

  const percentSpent = (spent / allocated) * 100

  if (percentSpent >= 90) return 'warning'
  if (percentSpent >= 70) return 'warning'
  if (percentSpent === 100) return 'on-track'

  return 'under'
}

/**
 * Get color for a budget status
 * @param status - Budget status
 * @returns Hex color string
 */
export function getStatusColor(status: BudgetStatus): string {
  switch (status) {
    case 'under':
      return budgetColors.success
    case 'on-track':
      return budgetColors.neutral
    case 'warning':
      return budgetColors.warning
    case 'over':
      return budgetColors.danger
  }
}

/**
 * Get background color for a status badge
 * @param status - Budget status
 * @returns Tailwind class string for background color
 */
export function getStatusBgClass(status: BudgetStatus): string {
  switch (status) {
    case 'under':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'on-track':
      return 'bg-gray-50 text-gray-700 border-gray-200'
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'over':
      return 'bg-red-50 text-red-700 border-red-200'
  }
}

/**
 * Get progress bar color based on percentage spent
 * @param percentSpent - Percentage of budget spent
 * @returns Tailwind class string for progress bar color
 */
export function getProgressBarColor(percentSpent: number): string {
  if (percentSpent >= 90) return 'bg-red-500'
  if (percentSpent >= 70) return 'bg-amber-500'
  return 'bg-green-500'
}

/**
 * Get status label text
 * @param status - Budget status
 * @param difference - Dollar amount difference (remaining if under, overage if over)
 * @returns Human-readable status label
 */
export function getStatusLabel(status: BudgetStatus, difference: number): string {
  const absDiff = Math.abs(difference)

  switch (status) {
    case 'under':
      return `$${absDiff.toLocaleString()} Under Budget`
    case 'on-track':
      return 'On Track'
    case 'warning':
      return 'Approaching Limit'
    case 'over':
      return `$${absDiff.toLocaleString()} Over Budget`
  }
}

/**
 * Group categories by heading
 * @param categories - Array of budget categories
 * @returns Object grouped by heading with totals
 */
export interface CategoryWithHeading {
  categoryId: string
  categoryName: string
  categoryHeading: string
  categoryColor: string
  allocated: number
  spent: number
  pending: number
  remaining: number
  percentage: number
  projectedPercentage: number
}

export interface CategoryGroup {
  heading: string
  color: string
  totalAllocated: number
  totalSpent: number
  totalPending: number
  totalRemaining: number
  percentUsed: number
  categories: CategoryWithHeading[]
  status: BudgetStatus
  isExpanded?: boolean
}

export function groupCategoriesByHeading(categories: CategoryWithHeading[]): CategoryGroup[] {
  // Group categories by heading
  const grouped = categories.reduce((acc, cat) => {
    const heading = cat.categoryHeading
    if (!acc[heading]) {
      acc[heading] = {
        heading,
        color: cat.categoryColor,
        totalAllocated: 0,
        totalSpent: 0,
        totalPending: 0,
        totalRemaining: 0,
        percentUsed: 0,
        categories: [],
        status: 'on-track' as BudgetStatus,
      }
    }

    acc[heading].totalAllocated += cat.allocated
    acc[heading].totalSpent += cat.spent
    acc[heading].totalPending += cat.pending
    acc[heading].totalRemaining += cat.remaining
    acc[heading].categories.push(cat)

    return acc
  }, {} as Record<string, CategoryGroup>)

  // Calculate percentages and status for each group
  const groups = Object.values(grouped).map(group => {
    const percentUsed = group.totalAllocated > 0
      ? (group.totalSpent / group.totalAllocated) * 100
      : 0

    const status = getBudgetStatus(group.totalAllocated, group.totalSpent)

    // Default: expand groups that are over budget or approaching limit
    const isExpanded = status === 'over' || status === 'warning'

    return {
      ...group,
      percentUsed,
      status,
      isExpanded,
    }
  })

  // Sort groups: over budget first, then by allocated amount
  return groups.sort((a, b) => {
    // Over budget groups first
    if (a.status === 'over' && b.status !== 'over') return -1
    if (a.status !== 'over' && b.status === 'over') return 1

    // Then by warning status
    if (a.status === 'warning' && b.status !== 'warning') return -1
    if (a.status !== 'warning' && b.status === 'warning') return 1

    // Then by allocated amount (largest first)
    return b.totalAllocated - a.totalAllocated
  })
}

/**
 * Format currency with optional currency code
 * @param amount - Amount to format
 * @param currency - Optional ISO 4217 currency code (defaults to CAD)
 */
export function formatCurrency(amount: number, currency: string = 'CAD'): string {
  // Determine locale based on currency
  const locale = currency === 'USD' ? 'en-US' : 'en-CA'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
