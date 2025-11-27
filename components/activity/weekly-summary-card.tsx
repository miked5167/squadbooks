'use client'

/**
 * Weekly Summary Card Component
 * Displays aggregated activity statistics for a period
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, CheckCircle, XCircle, Settings, UserPlus } from 'lucide-react'
import type { ActivitySummary } from '@/lib/activity/weekly-summary'

interface WeeklySummaryCardProps {
  summary: ActivitySummary
  isLoading?: boolean
}

export function WeeklySummaryCard({ summary, isLoading }: WeeklySummaryCardProps) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-navy">Loading Summary...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      label: 'Transactions',
      value: summary.transactionsCreated,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Approved',
      value: summary.transactionsApproved,
      icon: CheckCircle,
      color: 'text-meadow',
      bgColor: 'bg-meadow/10',
    },
    {
      label: 'Rejected',
      value: summary.transactionsRejected,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Budget Changes',
      value: summary.budgetChanges,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Settings Updates',
      value: summary.settingsChanges,
      icon: Settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Users Added',
      value: summary.usersAdded,
      icon: UserPlus,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <CardTitle className="text-navy">{summary.period.label}</CardTitle>
        <CardDescription>
          Overview of team activity and changes
          {summary.totalEvents > 0 && ` • ${summary.totalEvents} total events`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {summary.totalEvents === 0 ? (
          <div className="text-center py-8 text-navy/60">
            No activity during this period
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.bgColor} mb-2`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-navy">{stat.value}</div>
                    <div className="text-xs text-navy/60">{stat.label}</div>
                  </div>
                )
              })}
            </div>

            {/* Top Active Users */}
            {summary.topUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-navy mb-3">Most Active Users</h4>
                <div className="space-y-2">
                  {summary.topUsers.slice(0, 3).map((user, index) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-navy text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-navy">{user.userName}</span>
                      </div>
                      <span className="text-sm text-navy/60">{user.actionCount} actions</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            {summary.categoryBreakdown.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-navy mb-3">Activity Breakdown</h4>
                <div className="space-y-2">
                  {summary.categoryBreakdown.slice(0, 4).map((category) => (
                    <div
                      key={category.category}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-navy/70">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-navy rounded-full"
                            style={{
                              width: `${(category.count / summary.totalEvents) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-navy font-medium w-8 text-right">{category.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
