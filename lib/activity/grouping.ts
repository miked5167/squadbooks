/**
 * Activity grouping and formatting utilities
 */

import type { AuditLog, User } from '@prisma/client'

export type AuditLogWithUser = AuditLog & {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>
}

export interface GroupedAuditLogs {
  date: Date
  label: string
  events: AuditLogWithUser[]
}

/**
 * Group audit logs by calendar day
 * Returns array of groups in reverse chronological order (newest first)
 */
export function groupAuditLogsByDay(logs: AuditLogWithUser[]): GroupedAuditLogs[] {
  // Create a map of date string -> events
  const groupMap = new Map<string, AuditLogWithUser[]>()

  for (const log of logs) {
    const dateKey = getDateKey(log.createdAt)
    if (!groupMap.has(dateKey)) {
      groupMap.set(dateKey, [])
    }
    groupMap.get(dateKey)!.push(log)
  }

  // Convert map to array and sort by date (newest first)
  const groups: GroupedAuditLogs[] = []

  for (const [dateKey, events] of groupMap.entries()) {
    const date = new Date(dateKey)
    const label = formatDateLabel(date)

    groups.push({
      date,
      label,
      events: events.sort((a, b) => {
        const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.getTime()
        const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.getTime()
        return timeB - timeA
      }),
    })
  }

  // Sort groups by date (newest first)
  return groups.sort((a, b) => b.date.getTime() - a.date.getTime())
}

/**
 * Get a date key for grouping (YYYY-MM-DD)
 */
function getDateKey(date: Date | string): string {
  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format date as "Today", "Yesterday", or a formatted date
 */
export function formatDateLabel(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())

  if (targetDate.getTime() === today.getTime()) {
    return 'Today'
  } else if (targetDate.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  } else {
    // Format as "Nov 25, 2025"
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
}

/**
 * Format time as HH:MM AM/PM
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format relative time (e.g., "2 hours ago", "5 minutes ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return 'just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  } else {
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
}

/**
 * Generate event summary text from audit log
 * This creates the main description line for each event
 */
export function generateEventSummary(log: AuditLogWithUser): string {
  const metadata = log.metadata as Record<string, any> | null
  const newValues = log.newValues as Record<string, any> | null
  const oldValues = log.oldValues as Record<string, any> | null

  // Transaction events
  if (log.action === 'CREATE_TRANSACTION') {
    const vendor = metadata?.vendor || newValues?.vendor || 'unknown vendor'
    const amount = metadata?.amount || newValues?.amount || '0'
    return `created a transaction for $${amount} at ${vendor}`
  }

  if (log.action === 'UPDATE_TRANSACTION') {
    const vendor = metadata?.vendor || newValues?.vendor || oldValues?.vendor || 'unknown vendor'
    return `updated transaction at ${vendor}`
  }

  if (log.action === 'DELETE_TRANSACTION') {
    const vendor = metadata?.vendor || oldValues?.vendor || 'unknown vendor'
    const amount = metadata?.amount || oldValues?.amount || '0'
    return `deleted transaction for $${amount} at ${vendor}`
  }

  // Approval events
  if (log.action === 'APPROVE_TRANSACTION') {
    const vendor = metadata?.vendor || 'a transaction'
    const amount = metadata?.amount
    return amount
      ? `approved transaction for $${amount} at ${vendor}`
      : `approved ${vendor}`
  }

  if (log.action === 'REJECT_TRANSACTION') {
    const vendor = metadata?.vendor || 'a transaction'
    const amount = metadata?.amount
    return amount
      ? `rejected transaction for $${amount} at ${vendor}`
      : `rejected ${vendor}`
  }

  // Budget events
  if (log.action === 'CREATE_BUDGET_ALLOCATION') {
    const category = metadata?.category || newValues?.category || 'a category'
    const amount = metadata?.amount || newValues?.amount
    return amount
      ? `created budget allocation of $${amount} for ${category}`
      : `created budget allocation for ${category}`
  }

  if (log.action === 'UPDATE_BUDGET_ALLOCATION') {
    const category = metadata?.category || newValues?.category || oldValues?.category || 'a category'
    return `updated budget allocation for ${category}`
  }

  // Category events
  if (log.action === 'CREATE_CATEGORY') {
    const name = metadata?.name || newValues?.name || 'a category'
    return `created category "${name}"`
  }

  if (log.action === 'UPDATE_CATEGORY') {
    const name = metadata?.name || newValues?.name || oldValues?.name || 'a category'
    return `updated category "${name}"`
  }

  // User events
  if (log.action === 'CREATE_USER' || log.action === 'INVITE_USER') {
    const userName = metadata?.name || newValues?.name || 'a user'
    const role = metadata?.role || newValues?.role
    return role ? `added ${userName} as ${role}` : `added ${userName}`
  }

  if (log.action === 'UPDATE_USER_ROLE') {
    const userName = metadata?.name || 'a user'
    const oldRole = oldValues?.role
    const newRole = newValues?.role
    if (oldRole && newRole) {
      return `changed ${userName}'s role from ${oldRole} to ${newRole}`
    }
    return `updated ${userName}'s role`
  }

  // Settings events
  if (log.action.includes('SETTINGS')) {
    const settingType = log.action.replace('UPDATE_', '').replace('_SETTINGS', '').toLowerCase()
    return `updated ${settingType} settings`
  }

  // Onboarding events
  if (log.action === 'ONBOARDING_START') {
    return 'started onboarding'
  }

  if (log.action === 'ONBOARDING_COMPLETE') {
    return 'completed onboarding'
  }

  if (log.action.startsWith('ONBOARDING_')) {
    const step = metadata?.step || newValues?.step
    return step ? `completed onboarding step ${step}` : 'progressed through onboarding'
  }

  // Default fallback
  return log.action
    .split('_')
    .map(word => word.toLowerCase())
    .join(' ')
}
