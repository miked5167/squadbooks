'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Clock,
  XCircle,
} from 'lucide-react'
import { CoachCompExceptionDialog, type CoachCompStatus } from './CoachCompExceptionDialog'

interface CoachCompStatusCardProps {
  teamId: string
  associationId: string
  season: string | null
}

export function CoachCompStatusCard({ teamId, associationId, season }: CoachCompStatusCardProps) {
  const [status, setStatus] = useState<CoachCompStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/teams/${teamId}/coach-compensation-status?associationId=${associationId}${season ? `&season=${season}` : ''}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch coach compensation status')
      }

      const result = await response.json()
      setStatus(result.data)
    } catch (error) {
      console.error('Error fetching coach comp status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [teamId, associationId, season])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coach Compensation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status || !status.hasPolicy) {
    return null // Don't show card if no policy is active
  }

  const formatCents = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const capDollars = formatCents(status.cap)
  const actualDollars = formatCents(status.actual)
  const remainingCents = Math.max(0, status.cap - status.actual)
  const remainingDollars = formatCents(remainingCents)

  const isExceeded = status.actual > status.cap
  const isApproaching = status.percentUsed >= 90 && !isExceeded
  const isOk = !isExceeded && !isApproaching

  const getStatusIcon = () => {
    if (isExceeded) return <AlertCircle className="h-5 w-5 text-red-600" />
    if (isApproaching) return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    return <CheckCircle2 className="h-5 w-5 text-green-600" />
  }

  const getStatusText = () => {
    if (isExceeded) return 'Cap Exceeded'
    if (isApproaching) return 'Approaching Cap'
    return 'Within Cap'
  }

  const getStatusColor = () => {
    if (isExceeded) return 'text-red-600'
    if (isApproaching) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getProgressColor = () => {
    if (isExceeded) return 'bg-red-600'
    if (isApproaching) return 'bg-yellow-500'
    return 'bg-green-600'
  }

  const getExceptionBadge = () => {
    if (!status.hasException) return null

    const badges = {
      PENDING: (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Exception Pending
        </Badge>
      ),
      APPROVED: (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Exception Approved
        </Badge>
      ),
      DENIED: (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Exception Denied
        </Badge>
      ),
    }

    return status.exceptionStatus ? badges[status.exceptionStatus] : null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Coach Compensation Cap
                {getExceptionBadge()}
              </CardTitle>
              <CardDescription>
                {status.ageGroup && status.skillLevel
                  ? `${status.ageGroup} ${status.skillLevel} cap`
                  : 'Team cap'}
                {season && ` - ${season}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={`font-semibold ${getStatusColor()}`}>{getStatusText()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-medium">{status.percentUsed.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(status.percentUsed, 100)} className={getProgressColor()} />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Cap Amount</div>
              <div className="text-lg font-semibold">${capDollars}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Actual Spent</div>
              <div className="text-lg font-semibold">${actualDollars}</div>
            </div>
          </div>

          {/* Remaining or Overage */}
          {isExceeded ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Over budget by ${formatCents(status.actual - status.cap)}</strong>
                <br />
                <span className="text-sm">
                  You have exceeded your coach compensation cap. Please request an exception or
                  adjust your spending.
                </span>
              </AlertDescription>
            </Alert>
          ) : isApproaching ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>${remainingDollars} remaining</strong>
                <br />
                <span className="text-sm">
                  You are approaching your cap limit. Consider requesting an exception if you need
                  additional funding.
                </span>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-sm text-muted-foreground">
              <strong className="text-green-600">${remainingDollars}</strong> remaining in your
              coach compensation budget
            </div>
          )}

          {/* Exception Request Button */}
          {(isExceeded || isApproaching || status.exceptionStatus === 'DENIED') && (
            <Button
              variant={isExceeded ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setExceptionDialogOpen(true)}
            >
              <FileQuestion className="h-4 w-4 mr-2" />
              {status.hasException && status.exceptionStatus === 'PENDING'
                ? 'Update Exception Request'
                : status.hasException && status.exceptionStatus === 'DENIED'
                ? 'Resubmit Exception Request'
                : 'Request Exception'}
            </Button>
          )}

          {/* Approved Exception Info */}
          {status.exceptionStatus === 'APPROVED' && status.exceptionDelta && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Exception approved: +${formatCents(status.exceptionDelta)}</strong>
                <br />
                <span className="text-sm">
                  Your effective cap has been increased to $
                  {formatCents(status.cap + status.exceptionDelta)}
                </span>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <CoachCompExceptionDialog
        open={exceptionDialogOpen}
        onOpenChange={setExceptionDialogOpen}
        status={status}
        teamId={teamId}
        associationId={associationId}
        onSuccess={fetchStatus}
      />
    </>
  )
}
