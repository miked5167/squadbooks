/**
 * Budget Status Panel Component
 *
 * Right-side panel showing budget status, version info, and actions
 */

import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Lock,
  CheckCircle2,
  Users,
  AlertTriangle,
  Edit,
  Eye,
  Clock,
  FileText,
} from 'lucide-react'
import { BudgetStatus } from '@prisma/client'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface BudgetStatusPanelProps {
  status: BudgetStatus
  versionNumber: number
  presentedVersionNumber: number | null
  changeSummary?: string | null
  createdAt: Date
  updatedAt: Date
  lockedAt?: Date | null
  isParentView?: boolean
  actions?: ReactNode
  className?: string
}

function getStatusConfig(status: BudgetStatus): {
  icon: React.ElementType
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
} {
  switch (status) {
    case BudgetStatus.DRAFT:
      return {
        icon: Edit,
        label: 'Draft',
        description: 'Budget is being edited',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      }
    case BudgetStatus.REVIEW:
      return {
        icon: AlertTriangle,
        label: 'In Review',
        description: 'Awaiting coach approval',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
      }
    case BudgetStatus.TEAM_APPROVED:
      return {
        icon: CheckCircle2,
        label: 'Team Approved',
        description: 'Coach approved, ready to present',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      }
    case BudgetStatus.PRESENTED:
      return {
        icon: Users,
        label: 'Presented to Parents',
        description: 'Awaiting parent approvals',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      }
    case BudgetStatus.APPROVED:
      return {
        icon: CheckCircle2,
        label: 'Approved',
        description: 'Threshold met, ready to lock',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      }
    case BudgetStatus.LOCKED:
      return {
        icon: Lock,
        label: 'Locked',
        description: 'Budget is final and immutable',
        color: 'text-navy',
        bgColor: 'bg-navy/5',
        borderColor: 'border-navy/20',
      }
  }
}

export function BudgetStatusPanel({
  status,
  versionNumber,
  presentedVersionNumber,
  changeSummary,
  _createdAt,
  updatedAt,
  lockedAt,
  isParentView = false,
  actions,
  className,
}: BudgetStatusPanelProps) {
  const config = getStatusConfig(status)
  const StatusIcon = config.icon

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status Card */}
      <Card className={cn('border-2', config.borderColor, config.bgColor)}>
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg', config.bgColor, config.borderColor, 'border')}>
              <StatusIcon className={cn('w-5 h-5', config.color)} />
            </div>
            <div className="flex-1">
              <CardTitle className={cn('text-base font-semibold', config.color)}>
                {config.label}
              </CardTitle>
              <CardDescription className={cn('text-sm mt-1', config.color)}>
                {config.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {isParentView && (
          <CardContent className="pt-0">
            <Badge
              variant="secondary"
              className="bg-navy/10 text-navy hover:bg-navy/10"
            >
              <Eye className="w-3 h-3 mr-1" />
              Read-only View
            </Badge>
          </CardContent>
        )}
      </Card>

      {/* Version Info Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-navy">
            Version Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy/60">Current Version</span>
            <Badge variant="outline" className="font-mono">
              v{versionNumber}
            </Badge>
          </div>

          {presentedVersionNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-navy/60">Presented Version</span>
              <Badge variant="secondary" className="font-mono">
                v{presentedVersionNumber}
              </Badge>
            </div>
          )}

          {changeSummary && (
            <>
              <Separator className="bg-navy/10" />
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-navy/60">
                  <FileText className="w-3 h-3" />
                  <span>Change Summary</span>
                </div>
                <p className="text-sm text-navy">{changeSummary}</p>
              </div>
            </>
          )}

          <Separator className="bg-navy/10" />

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-navy/60">
              <Clock className="w-3 h-3" />
              <span>
                Last updated:{' '}
                {new Date(updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {lockedAt && (
              <div className="flex items-center gap-2 text-navy/60">
                <Lock className="w-3 h-3" />
                <span>
                  Locked:{' '}
                  {new Date(lockedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      {actions && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-navy">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">{actions}</CardContent>
        </Card>
      )}

      {/* Version History Button */}
      <Button
        variant="outline"
        className="w-full border-navy/20 text-navy hover:bg-navy/5"
        asChild
      >
        <Link href={`#version-history`}>
          <FileText className="w-4 h-4 mr-2" />
          Version History
        </Link>
      </Button>
    </div>
  )
}
