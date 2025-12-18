'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingDown, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

interface ExceptionMetrics {
  totalExceptions: number
  resolvedExceptions: number
  pendingExceptions: number
  resolutionRate: number
  bySeverity: {
    CRITICAL: number
    HIGH: number
    MEDIUM: number
    LOW: number
  }
  averageResolutionTimeHours: number | null
  resolutionMethods: {
    OVERRIDE: number
    CORRECT: number
    REVALIDATE: number
  }
  topViolations: Array<{
    code: string
    count: number
    message: string
  }>
}

export function ExceptionAnalytics() {
  const [metrics, setMetrics] = useState<ExceptionMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get last 30 days of analytics
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const response = await fetch(
        `/api/exceptions/analytics?startDate=${thirtyDaysAgo.toISOString()}&includeTrends=false`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setMetrics(data.metrics)
    } catch (err) {
      console.error('Error fetching exception analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-navy">Analytics (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-navy/40" />
        </CardContent>
      </Card>
    )
  }

  if (error || !metrics) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-navy">Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error || 'No analytics data available'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-navy">Analytics (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resolution Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy/70 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Resolution Rate
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-navy">
                {metrics.resolutionRate.toFixed(1)}%
              </span>
              {metrics.resolutionRate >= 80 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-orange-600" />
              )}
            </div>
          </div>
          <div className="text-xs text-navy/50">
            {metrics.resolvedExceptions} of {metrics.totalExceptions} exceptions resolved
          </div>
        </div>

        {/* Average Resolution Time */}
        {metrics.averageResolutionTimeHours !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-navy/70 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Avg. Resolution Time
              </span>
              <span className="text-lg font-bold text-navy">
                {metrics.averageResolutionTimeHours < 24
                  ? `${metrics.averageResolutionTimeHours.toFixed(1)}h`
                  : `${(metrics.averageResolutionTimeHours / 24).toFixed(1)}d`}
              </span>
            </div>
          </div>
        )}

        {/* Severity Breakdown */}
        <div className="space-y-2">
          <span className="text-sm text-navy/70 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            By Severity
          </span>
          <div className="grid grid-cols-2 gap-2">
            {metrics.bySeverity.CRITICAL > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                <span className="text-xs font-medium text-red-800">Critical</span>
                <span className="text-sm font-bold text-red-900">{metrics.bySeverity.CRITICAL}</span>
              </div>
            )}
            {metrics.bySeverity.HIGH > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                <span className="text-xs font-medium text-orange-800">High</span>
                <span className="text-sm font-bold text-orange-900">{metrics.bySeverity.HIGH}</span>
              </div>
            )}
            {metrics.bySeverity.MEDIUM > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <span className="text-xs font-medium text-yellow-800">Medium</span>
                <span className="text-sm font-bold text-yellow-900">{metrics.bySeverity.MEDIUM}</span>
              </div>
            )}
            {metrics.bySeverity.LOW > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <span className="text-xs font-medium text-blue-800">Low</span>
                <span className="text-sm font-bold text-blue-900">{metrics.bySeverity.LOW}</span>
              </div>
            )}
          </div>
        </div>

        {/* Resolution Methods */}
        {metrics.resolvedExceptions > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-navy/70">Resolution Methods</span>
            <div className="space-y-1">
              {Object.entries(metrics.resolutionMethods).map(([method, count]) => {
                if (count === 0) return null
                const percentage = ((count / metrics.resolvedExceptions) * 100).toFixed(0)
                return (
                  <div key={method} className="flex items-center justify-between text-xs">
                    <span className="text-navy/60 capitalize">{method.toLowerCase()}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-navy/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-navy/40 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-navy/80 font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top Violations */}
        {metrics.topViolations.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-navy/70">Common Issues</span>
            <div className="space-y-1">
              {metrics.topViolations.slice(0, 3).map((violation) => (
                <div
                  key={violation.code}
                  className="flex items-start gap-2 px-2 py-1.5 bg-navy/5 rounded-md"
                >
                  <Badge variant="outline" className="text-[10px] shrink-0 border-navy/20">
                    {violation.count}
                  </Badge>
                  <span className="text-xs text-navy/70 line-clamp-2">{violation.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
