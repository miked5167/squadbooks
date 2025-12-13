/**
 * Version Badge Component
 *
 * Displays budget version number with optional change summary
 */

import { Badge } from '@/components/ui/badge'
import { GitBranch, AlertCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from 'date-fns'

interface VersionBadgeProps {
  versionNumber: number
  changeSummary?: string | null
  createdAt?: Date
  showChangeSummary?: boolean
}

export function VersionBadge({
  versionNumber,
  changeSummary,
  createdAt,
  showChangeSummary = true,
}: VersionBadgeProps) {
  const hasChanges = versionNumber > 1 && changeSummary

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1.5">
          <GitBranch className="w-3 h-3" />
          Version {versionNumber}
        </Badge>
        {createdAt && (
          <span className="text-xs text-muted-foreground">
            Last updated {format(new Date(createdAt), 'MMM d, yyyy')}
          </span>
        )}
      </div>

      {hasChanges && showChangeSummary && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">What Changed</p>
            <p className="text-sm text-blue-800">{changeSummary}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact version badge with tooltip
 */
export function VersionBadgeCompact({
  versionNumber,
  changeSummary,
}: {
  versionNumber: number
  changeSummary?: string | null
}) {
  if (versionNumber === 1 || !changeSummary) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <GitBranch className="w-3 h-3" />
        v{versionNumber}
      </Badge>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="flex items-center gap-1 cursor-help">
            <GitBranch className="w-3 h-3" />
            v{versionNumber}
            <AlertCircle className="w-3 h-3 text-blue-600" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <p className="font-medium mb-1">What Changed:</p>
          <p className="text-sm">{changeSummary}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
