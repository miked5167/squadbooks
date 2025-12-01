'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Clock,
  Calendar,
  ExternalLink,
  Copy,
  DollarSign,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { FamilyAcknowledgmentList } from './FamilyAcknowledgmentList'
import { toast } from 'sonner'

interface Acknowledgment {
  id: string
  familyName: string
  acknowledged: boolean
  acknowledgedAt: Date | null
}

interface BudgetApproval {
  id: string
  season: string
  budgetTotal: number
  approvalType: string
  description: string | null
  status: string
  createdAt: Date
  completedAt: Date | null
  expiresAt: Date | null
  team: {
    name: string
    level: string
  }
  creator: {
    name: string
  }
  acknowledgments: Acknowledgment[]
}

interface BudgetApprovalCardProps {
  approval: BudgetApproval
}

export function BudgetApprovalCard({ approval }: BudgetApprovalCardProps) {
  const acknowledgedCount = approval.acknowledgments.filter((a) => a.acknowledged).length
  const totalCount = approval.acknowledgments.length
  const progressPercentage = totalCount > 0 ? (acknowledgedCount / totalCount) * 100 : 0
  const acknowledged = approval.acknowledgments.filter((a) => a.acknowledged)
  const pending = approval.acknowledgments.filter((a) => !a.acknowledged)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-green-500 hover:bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case 'EXPIRED':
        return (
          <Badge variant="destructive">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        )
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INITIAL':
        return <Badge variant="default">Initial Budget</Badge>
      case 'REPORT':
        return <Badge className="bg-blue-500 hover:bg-blue-500">Financial Report</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const copyLinkToClipboard = async () => {
    const url = `${window.location.origin}/budget-approvals/${approval.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <Card className="overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
      {/* Compact Header */}
      <div className="bg-cream border-b border-navy/10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Left Side - Title and Budget */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {getTypeBadge(approval.approvalType)}
              {getStatusBadge(approval.status)}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-navy mb-1 truncate">
              {approval.team.name} - {approval.season}
            </h3>
            {approval.description && (
              <p className="text-sm text-navy/70 line-clamp-2">{approval.description}</p>
            )}
          </div>

          {/* Right Side - Budget Amount */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-xs text-navy/60">
              <DollarSign className="h-3 w-3" />
              <span>Budget Total</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-navy">
              ${Number(approval.budgetTotal).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Date Info and Actions Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4 pt-4 border-t border-navy/10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-navy/60">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              Created {format(new Date(approval.createdAt), 'MMM d, yyyy')}
            </div>
            {approval.expiresAt && (
              <div className="flex items-center gap-1 text-orange-600">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                Due {format(new Date(approval.expiresAt), 'MMM d, yyyy')}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLinkToClipboard}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Link
            </Button>
            <Link href={`/budget-approvals/${approval.id}`}>
              <Button variant="default" size="sm" className="text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4 sm:p-6">
        {/* Inline Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-navy">Acknowledgment Progress</p>
            <p className="text-sm font-semibold text-navy">
              {acknowledgedCount} of {totalCount} ({Math.round(progressPercentage)}%)
            </p>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          {approval.status === 'COMPLETED' && approval.completedAt && (
            <p className="text-xs sm:text-sm text-green-600 mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
              Completed on {format(new Date(approval.completedAt), 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>

        {/* Collapsible Family Lists */}
        <div className="space-y-4">
          <FamilyAcknowledgmentList acknowledgments={acknowledged} type="acknowledged" />
          <FamilyAcknowledgmentList acknowledgments={pending} type="pending" />
        </div>
      </CardContent>
    </Card>
  )
}
