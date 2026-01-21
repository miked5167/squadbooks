/**
 * Event categorization, icons, and color mapping for the Activity/Audit page
 * This file defines how different audit events are displayed in the UI
 */

import {
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
  PiggyBank,
  FolderTree,
  Users,
  Shield,
  Receipt,
  Settings,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Upload,
  Download,
  AlertTriangle,
  Calendar,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'

/**
 * Event categories for filtering
 */
export const EventCategory = {
  TRANSACTIONS: 'TRANSACTIONS',
  APPROVALS: 'APPROVALS',
  BUDGET: 'BUDGET',
  SETTINGS: 'SETTINGS',
  USERS_ROLES: 'USERS_ROLES',
  RECEIPTS: 'RECEIPTS',
  ONBOARDING: 'ONBOARDING',
  CATEGORIES: 'CATEGORIES',
  SEASON_CLOSURE: 'SEASON_CLOSURE',
} as const

export type EventCategoryType = typeof EventCategory[keyof typeof EventCategory]

/**
 * Badge/tag variants for visual categorization
 */
export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default' | 'purple'

/**
 * Event type configuration
 */
export interface EventConfig {
  category: EventCategoryType
  icon: LucideIcon
  badgeVariant: BadgeVariant
  label: string
  description?: string
  hideByDefault?: boolean // For noisy events like onboarding steps
}

/**
 * Mapping of audit actions to event configurations
 * This is the single source of truth for how events are displayed
 */
export const EVENT_CONFIG_MAP: Record<string, EventConfig> = {
  // Transaction events
  CREATE_TRANSACTION: {
    category: EventCategory.TRANSACTIONS,
    icon: DollarSign,
    badgeVariant: 'info',
    label: 'Transaction Created',
  },
  UPDATE_TRANSACTION: {
    category: EventCategory.TRANSACTIONS,
    icon: Edit,
    badgeVariant: 'warning',
    label: 'Transaction Updated',
  },
  DELETE_TRANSACTION: {
    category: EventCategory.TRANSACTIONS,
    icon: Trash2,
    badgeVariant: 'error',
    label: 'Transaction Deleted',
  },

  // Approval events
  CREATE_APPROVAL: {
    category: EventCategory.APPROVALS,
    icon: FileText,
    badgeVariant: 'info',
    label: 'Approval Requested',
  },
  APPROVE_TRANSACTION: {
    category: EventCategory.APPROVALS,
    icon: CheckCircle,
    badgeVariant: 'success',
    label: 'Transaction Approved',
  },
  REJECT_TRANSACTION: {
    category: EventCategory.APPROVALS,
    icon: XCircle,
    badgeVariant: 'error',
    label: 'Transaction Rejected',
  },

  // Budget events
  CREATE_BUDGET_ALLOCATION: {
    category: EventCategory.BUDGET,
    icon: PiggyBank,
    badgeVariant: 'info',
    label: 'Budget Allocation Created',
  },
  UPDATE_BUDGET_ALLOCATION: {
    category: EventCategory.BUDGET,
    icon: PiggyBank,
    badgeVariant: 'warning',
    label: 'Budget Updated',
  },
  DELETE_BUDGET_ALLOCATION: {
    category: EventCategory.BUDGET,
    icon: Trash2,
    badgeVariant: 'error',
    label: 'Budget Allocation Deleted',
  },

  // Category events
  CREATE_CATEGORY: {
    category: EventCategory.CATEGORIES,
    icon: FolderTree,
    badgeVariant: 'info',
    label: 'Category Created',
  },
  UPDATE_CATEGORY: {
    category: EventCategory.CATEGORIES,
    icon: Edit,
    badgeVariant: 'warning',
    label: 'Category Updated',
  },
  DELETE_CATEGORY: {
    category: EventCategory.CATEGORIES,
    icon: Trash2,
    badgeVariant: 'error',
    label: 'Category Deleted',
  },

  // User & Role events
  CREATE_USER: {
    category: EventCategory.USERS_ROLES,
    icon: UserPlus,
    badgeVariant: 'success',
    label: 'User Added',
  },
  UPDATE_USER_ROLE: {
    category: EventCategory.USERS_ROLES,
    icon: Shield,
    badgeVariant: 'warning',
    label: 'Role Changed',
  },
  DELETE_USER: {
    category: EventCategory.USERS_ROLES,
    icon: UserMinus,
    badgeVariant: 'error',
    label: 'User Removed',
  },
  INVITE_USER: {
    category: EventCategory.USERS_ROLES,
    icon: UserPlus,
    badgeVariant: 'info',
    label: 'User Invited',
  },

  // Receipt events
  UPLOAD_RECEIPT: {
    category: EventCategory.RECEIPTS,
    icon: Upload,
    badgeVariant: 'info',
    label: 'Receipt Uploaded',
  },
  DELETE_RECEIPT: {
    category: EventCategory.RECEIPTS,
    icon: Trash2,
    badgeVariant: 'error',
    label: 'Receipt Deleted',
  },

  // Settings events
  UPDATE_TEAM_SETTINGS: {
    category: EventCategory.SETTINGS,
    icon: Settings,
    badgeVariant: 'purple',
    label: 'Settings Changed',
  },
  UPDATE_APPROVAL_SETTINGS: {
    category: EventCategory.SETTINGS,
    icon: Settings,
    badgeVariant: 'purple',
    label: 'Approval Settings Changed',
  },
  UPDATE_NOTIFICATION_SETTINGS: {
    category: EventCategory.SETTINGS,
    icon: Settings,
    badgeVariant: 'purple',
    label: 'Notification Settings Changed',
  },

  // Onboarding events (mostly hidden by default)
  ONBOARDING_START: {
    category: EventCategory.ONBOARDING,
    icon: BookOpen,
    badgeVariant: 'info',
    label: 'Onboarding Started',
    hideByDefault: false,
  },
  ONBOARDING_COMPLETE: {
    category: EventCategory.ONBOARDING,
    icon: CheckCircle,
    badgeVariant: 'success',
    label: 'Onboarding Completed',
    hideByDefault: false,
  },
  ONBOARDING_STEP: {
    category: EventCategory.ONBOARDING,
    icon: BookOpen,
    badgeVariant: 'default',
    label: 'Onboarding Step',
    hideByDefault: true, // Hide individual steps by default
  },

  // Season closure events
  SEASON_CLOSURE_START: {
    category: EventCategory.SEASON_CLOSURE,
    icon: Calendar,
    badgeVariant: 'warning',
    label: 'Season Closure Started',
  },
  SEASON_CLOSURE_COMPLETE: {
    category: EventCategory.SEASON_CLOSURE,
    icon: CheckCircle,
    badgeVariant: 'success',
    label: 'Season Closure Completed',
  },
  SEASON_REPORT_GENERATED: {
    category: EventCategory.SEASON_CLOSURE,
    icon: Download,
    badgeVariant: 'info',
    label: 'Season Report Generated',
  },
}

/**
 * Get event configuration for an action
 * Returns default config if action is not found
 */
export function getEventConfig(action: string): EventConfig {
  // Check for exact match
  if (EVENT_CONFIG_MAP[action]) {
    return EVENT_CONFIG_MAP[action]
  }

  // Check for onboarding events (ONBOARDING_*)
  if (action.startsWith('ONBOARDING_')) {
    if (action === 'ONBOARDING_START') {
      return EVENT_CONFIG_MAP.ONBOARDING_START
    }
    if (action === 'ONBOARDING_COMPLETE') {
      return EVENT_CONFIG_MAP.ONBOARDING_COMPLETE
    }
    return EVENT_CONFIG_MAP.ONBOARDING_STEP
  }

  // Default fallback
  return {
    category: EventCategory.SETTINGS,
    icon: FileText,
    badgeVariant: 'default',
    label: formatActionLabel(action),
  }
}

/**
 * Format action string to readable label
 */
export function formatActionLabel(action: string): string {
  return action
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Get all unique categories from events
 */
export function getAllCategories(): EventCategoryType[] {
  return Object.values(EventCategory)
}

/**
 * Get readable label for category
 */
export function getCategoryLabel(category: EventCategoryType): string {
  const labels: Record<EventCategoryType, string> = {
    TRANSACTIONS: 'Transactions',
    APPROVALS: 'Approvals',
    BUDGET: 'Budget Changes',
    SETTINGS: 'Settings Changes',
    USERS_ROLES: 'User & Role Activity',
    RECEIPTS: 'Receipts',
    ONBOARDING: 'Onboarding',
    CATEGORIES: 'Categories',
    SEASON_CLOSURE: 'Season Closure',
  }
  return labels[category] || category
}

/**
 * Get Tailwind classes for badge variant
 */
export function getBadgeClasses(variant: BadgeVariant): string {
  const classes = {
    success: 'bg-meadow/10 text-meadow border-meadow/20',
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    default: 'bg-gray-50 text-gray-700 border-gray-200',
  }
  return classes[variant] || classes.default
}
