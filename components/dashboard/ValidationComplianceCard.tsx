'use client'

/**
 * Validation Compliance Dashboard Card
 *
 * Displays validation-first compliance metrics:
 * - Exception counts by severity
 * - Compliance rate
 * - Average time to resolve exceptions
 * - Top violation types
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'

interface ValidationAnalytics {
  overview: {
    compliance: {
      totalTransactions: number
      validatedTransactions: number
      exceptionsActive: number
      exceptionsResolved: number
      compliantTransactions: number
      complianceRate: number
    }
    exceptionsBySeverity: {
      critical: number
      high: number
      medium: number
      low: number
      total: number
    }
    resolutionTime: {
      averageHours: number
      averageDays: number
      medianHours: number
      count: number
    }
    topViolations: Array<{
      code: string
      count: number
      severity: string
      message: string
    }>
  }
  overrideStats: {
    total: number
    bySeverity: Record<string, number>
    byRole: Record<string, number>
  }
}

export function ValidationComplianceCard() {
  const [analytics, setAnalytics] = useState<ValidationAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      const res = await fetch('/api/validation-analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch validation analytics:', error)
      toast.error('Failed to load compliance metrics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card className="border-0 shadow-card">
        <CardContent className="py-8 text-center text-navy/60">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>No validation data available</p>
        </CardContent>
      </Card>
    )
  }

  const { overview, overrideStats } = analytics
  const { compliance, exceptionsBySeverity, resolutionTime, topViolations } = overview

  const getComplianceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600'
    if (rate >= 85) return 'text-blue-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'HIGH':
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      case 'MEDIUM':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'LOW':
        return <AlertCircle className="w-4 h-4 text-blue-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-navy">
              <Shield className="w-5 h-5" />
              Validation Compliance
            </CardTitle>
            <CardDescription>Transaction validation metrics and exception tracking</CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getComplianceColor(compliance.complianceRate)}`}>
              {compliance.complianceRate}%
            </div>
            <div className="text-xs text-navy/60">Compliance Rate</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Compliance Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-navy/70">Compliant Transactions</span>
            <span className="font-semibold text-navy">
              {compliance.compliantTransactions} / {compliance.totalTransactions}
            </span>
          </div>
          <Progress value={compliance.complianceRate} className="h-2" />
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-navy/60">
                Validated: <span className="font-semibold">{compliance.validatedTransactions}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-yellow-600" />
              <span className="text-navy/60">
                Exceptions: <span className="font-semibold">{compliance.exceptionsActive}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-blue-600" />
              <span className="text-navy/60">
                Resolved: <span className="font-semibold">{compliance.exceptionsResolved}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Exceptions by Severity */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-navy">Exceptions by Severity</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs text-red-700 font-medium">Critical</span>
                </div>
                <span className="text-lg font-bold text-red-600">
                  {exceptionsBySeverity.critical}
                </span>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-orange-700 font-medium">High</span>
                </div>
                <span className="text-lg font-bold text-orange-600">
                  {exceptionsBySeverity.high}
                </span>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs text-yellow-700 font-medium">Medium</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">
                  {exceptionsBySeverity.medium}
                </span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-700 font-medium">Low</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{exceptionsBySeverity.low}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Time */}
        {resolutionTime.count > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-navy flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Average Time to Resolve
            </h4>
            <div className="bg-navy/5 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-navy">
                    {resolutionTime.averageDays < 1
                      ? `${resolutionTime.averageHours}h`
                      : `${resolutionTime.averageDays}d`}
                  </div>
                  <div className="text-xs text-navy/60">Average</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-navy">
                    {resolutionTime.medianHours < 24
                      ? `${resolutionTime.medianHours}h`
                      : `${Math.round(resolutionTime.medianHours / 24)}d`}
                  </div>
                  <div className="text-xs text-navy/60">Median</div>
                </div>
              </div>
              <div className="text-xs text-center text-navy/60 mt-2">
                Based on {resolutionTime.count} resolved exceptions
              </div>
            </div>
          </div>
        )}

        {/* Top Violations */}
        {topViolations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-navy">Top Violation Types</h4>
            <div className="space-y-2">
              {topViolations.slice(0, 5).map((violation, index) => (
                <div
                  key={violation.code}
                  className="flex items-center justify-between p-2 rounded-lg bg-navy/5"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getSeverityIcon(violation.severity)}
                    <span className="text-sm text-navy truncate">{violation.message}</span>
                  </div>
                  <Badge variant="secondary" className="ml-2 flex-shrink-0">
                    {violation.count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Override Statistics */}
        {overrideStats.total > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-navy/70 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Total Overrides Applied
              </span>
              <span className="font-semibold text-navy">{overrideStats.total}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
