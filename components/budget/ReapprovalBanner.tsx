/**
 * Re-approval Banner Component
 *
 * Shows when budget has been updated since parent's last approval
 */

import { AlertTriangle } from 'lucide-react'

interface ReapprovalBannerProps {
  currentVersionNumber: number
  lastApprovedVersion?: number
}

export function ReapprovalBanner({
  currentVersionNumber,
  lastApprovedVersion,
}: ReapprovalBannerProps) {
  // Only show if parent previously approved an older version
  if (!lastApprovedVersion || lastApprovedVersion >= currentVersionNumber) {
    return null
  }

  return (
    <div className="flex items-start gap-3 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-yellow-900 mb-1">
          Budget Updated
        </p>
        <p className="text-sm text-yellow-800">
          The budget has been updated since you approved it. You previously approved Version{' '}
          {lastApprovedVersion}, but Version {currentVersionNumber} is now available. Please
          review the changes and re-approve.
        </p>
      </div>
    </div>
  )
}
