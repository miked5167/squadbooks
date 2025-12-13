/**
 * Approval Progress Component
 *
 * Shows parent approval progress with threshold indicator
 */

import { Progress } from '@/components/ui/progress'
import { ApprovalProgress as ApprovalProgressType, ThresholdMode } from '@/lib/types/budget-workflow'
import { CheckCircle2, Users, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ApprovalProgressProps {
  progress: ApprovalProgressType
  showCard?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ApprovalProgress({
  progress,
  showCard = false,
  size = 'md',
}: ApprovalProgressProps) {
  const { approvedCount, eligibleCount, percentApproved, thresholdMet, thresholdMode, thresholdValue } = progress

  const thresholdDescription = thresholdMode === ThresholdMode.COUNT
    ? `Locks after ${thresholdValue} ${thresholdValue === 1 ? 'family approves' : 'families approve'}`
    : `Locks at ${thresholdValue}% approval`

  const progressColor = thresholdMet
    ? 'bg-green-600'
    : percentApproved >= 50
    ? 'bg-blue-600'
    : 'bg-gray-400'

  const content = (
    <div className="space-y-3">
      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="text-muted-foreground" />
          <span className="font-semibold text-navy">
            {approvedCount} of {eligibleCount} families approved
          </span>
        </div>
        {thresholdMet && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Threshold Met</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <Progress
          value={Math.min(percentApproved, 100)}
          className={size === 'sm' ? 'h-2' : 'h-3'}
          indicatorClassName={progressColor}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{percentApproved.toFixed(1)}% approved</span>
          <span>{eligibleCount - approvedCount} remaining</span>
        </div>
      </div>

      {/* Threshold Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="w-4 h-4" />
        <span>{thresholdDescription}</span>
      </div>

      {/* Threshold Met Message */}
      {thresholdMet && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm font-medium text-green-900">
            ✓ Approval threshold has been met. Budget is ready to lock.
          </p>
        </div>
      )}
    </div>
  )

  if (showCard) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
            <Users className="w-4 h-4" />
            Parent Approval Progress
          </CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    )
  }

  return content
}

/**
 * Compact approval progress for inline display
 */
export function ApprovalProgressCompact({ progress }: { progress: ApprovalProgressType }) {
  const { approvedCount, eligibleCount, percentApproved, thresholdMet } = progress

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {approvedCount}/{eligibleCount}
        </span>
      </div>
      <div className="flex-1 max-w-[200px]">
        <Progress
          value={Math.min(percentApproved, 100)}
          className="h-2"
          indicatorClassName={thresholdMet ? 'bg-green-600' : undefined}
        />
      </div>
      <span className="text-sm text-muted-foreground">
        {percentApproved.toFixed(0)}%
      </span>
    </div>
  )
}
