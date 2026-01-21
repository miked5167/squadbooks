'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, Loader2, ShieldCheck } from 'lucide-react'
import { getTeamCompliance } from '@/app/transactions/actions'

interface ComplianceWidgetProps {
  teamId: string
}

export function ComplianceWidget({ teamId }: ComplianceWidgetProps) {
  const [loading, setLoading] = useState(true)
  const [compliance, setCompliance] = useState<{
    score: number
    status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT'
    violations: Array<{
      severity: string
      description: string
      ruleName: string
    }>
  } | null>(null)

  useEffect(() => {
    async function fetchCompliance() {
      setLoading(true)
      try {
        const result = await getTeamCompliance()
        if (result.success && result.score !== null && result.status) {
          setCompliance({
            score: result.score,
            status: result.status,
            violations: result.violations || [],
          })
        }
      } catch (error) {
        console.error('Failed to fetch compliance:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCompliance()
  }, [teamId])

  if (loading) {
    return (
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-navy flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Association Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-navy" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!compliance) {
    return null // No compliance data available
  }

  const getStatusBadge = () => {
    switch (compliance.status) {
      case 'COMPLIANT':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100">
            <CheckCircle2 className="w-5 h-5 text-green-700" />
            <span className="font-semibold text-green-900">Compliant</span>
          </div>
        )
      case 'AT_RISK':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-100">
            <AlertTriangle className="w-5 h-5 text-yellow-700" />
            <span className="font-semibold text-yellow-900">At Risk</span>
          </div>
        )
      case 'NON_COMPLIANT':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100">
            <XCircle className="w-5 h-5 text-red-700" />
            <span className="font-semibold text-red-900">Non-Compliant</span>
          </div>
        )
    }
  }

  const getScoreColor = () => {
    if (compliance.score >= 90) return 'text-green-600'
    if (compliance.score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = () => {
    if (compliance.score >= 90) return 'bg-green-600'
    if (compliance.score >= 70) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-navy flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Association Compliance
            </CardTitle>
            <CardDescription className="mt-1">
              Your team's compliance with association rules
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {/* Compliance Score */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-navy/70">Compliance Score</span>
            <span className={`text-3xl font-bold ${getScoreColor()}`}>
              {compliance.score}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${compliance.score}%` }}
            />
          </div>
        </div>

        {/* Violations Summary */}
        {compliance.violations.length > 0 ? (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-semibold text-navy">Active Violations</h4>
            <div className="space-y-2">
              {compliance.violations.slice(0, 3).map((violation, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    violation.severity === 'CRITICAL'
                      ? 'bg-red-50 border-red-200'
                      : violation.severity === 'ERROR'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {violation.severity === 'CRITICAL' ? (
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    ) : violation.severity === 'ERROR' ? (
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">
                        {violation.ruleName}
                      </p>
                      <p className="text-xs text-gray-700 mt-0.5">
                        {violation.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {compliance.violations.length > 3 && (
                <p className="text-xs text-navy/60 text-center">
                  +{compliance.violations.length - 3} more violation{compliance.violations.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-900">No active violations</span>
          </div>
        )}

        {/* Action Button - Only show if violations exist */}
        {compliance.violations.length > 0 && (
          <Button asChild className="w-full bg-navy hover:bg-navy-medium text-white">
            <Link href="/compliance">
              View Full Compliance Report
              <ArrowUpRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        )}

        {/* Info Message for Compliant Teams */}
        {compliance.violations.length === 0 && (
          <p className="text-xs text-center text-navy/60 mt-2">
            Keep up the great work! Your team is fully compliant with all association rules.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
