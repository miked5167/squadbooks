'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface BudgetApproval {
  id: string
  description: string | null
  approvalType: string
  amount: number
  acknowledgedCount: number
  requiredCount: number
  progressPercentage: number
  expiresAt: string | null
  pendingFamilies: string[]
}

interface BudgetApprovalStatusProps {
  approvals: BudgetApproval[]
  totalAmount: number
}

export function BudgetApprovalStatus({ approvals, totalAmount }: BudgetApprovalStatusProps) {
  const [expandedApprovals, setExpandedApprovals] = useState<Set<string>>(new Set())

  if (approvals.length === 0) {
    return null
  }

  const toggleExpanded = (approvalId: string) => {
    setExpandedApprovals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(approvalId)) {
        newSet.delete(approvalId)
      } else {
        newSet.add(approvalId)
      }
      return newSet
    })
  }

  const getApprovalTypeBadge = (type: string) => {
    switch (type) {
      case 'INITIAL':
        return <Badge variant="default" className="text-xs">Initial Budget</Badge>
      case 'REVISION':
        return <Badge variant="secondary" className="text-xs">Revision</Badge>
      case 'REPORT':
        return <Badge className="bg-blue-500 text-xs">Report</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>
    }
  }

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null

    const expiry = new Date(expiresAt)
    const now = new Date()

    if (expiry < now) {
      return <span className="text-red-600 font-medium">Expired</span>
    }

    const timeRemaining = formatDistanceToNow(expiry, { addSuffix: true })
    const hoursRemaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursRemaining < 24) {
      return <span className="text-red-600 font-medium">Expires {timeRemaining}</span>
    } else if (hoursRemaining < 72) {
      return <span className="text-amber-600 font-medium">Expires {timeRemaining}</span>
    }

    return <span className="text-navy/70">Expires {timeRemaining}</span>
  }

  return (
    <Card className="border-0 shadow-card mb-6 bg-amber-50 border-l-4 border-l-amber-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-navy">
                {approvals.length} {approvals.length === 1 ? 'Budget Approval' : 'Budget Approvals'} Pending
              </CardTitle>
              <p className="text-sm text-navy/70 mt-1">
                Total amount: ${totalAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} awaiting family acknowledgment
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {approvals.map((approval) => {
          const isExpanded = expandedApprovals.has(approval.id)
          const pendingCount = approval.requiredCount - approval.acknowledgedCount

          return (
            <div
              key={approval.id}
              className="bg-white rounded-lg border border-amber-200 overflow-hidden"
            >
              {/* Approval Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-navy/60" />
                      <h4 className="font-medium text-navy">
                        {approval.description || 'Budget Approval'}
                      </h4>
                      {getApprovalTypeBadge(approval.approvalType)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-navy/70">
                      <span className="font-medium">
                        ${approval.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      {approval.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {getTimeRemaining(approval.expiresAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/budget-approvals/${approval.id}`}>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap">
                      View Details
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-navy">
                      {approval.acknowledgedCount} of {approval.requiredCount} families acknowledged
                    </span>
                    <span className="text-navy/70">{approval.progressPercentage}%</span>
                  </div>
                  <Progress value={approval.progressPercentage} className="h-2" />

                  {pendingCount > 0 && (
                    <button
                      onClick={() => toggleExpanded(approval.id)}
                      className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800 font-medium mt-2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide pending families ({pendingCount})
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show pending families ({pendingCount})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Pending Families List */}
              {isExpanded && approval.pendingFamilies.length > 0 && (
                <div className="border-t border-amber-200 bg-amber-50/50 p-4">
                  <h5 className="text-sm font-medium text-navy mb-2">
                    Families Pending Acknowledgment:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {approval.pendingFamilies.map((familyName, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-navy/80 bg-white px-3 py-1.5 rounded border border-amber-100"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {familyName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
