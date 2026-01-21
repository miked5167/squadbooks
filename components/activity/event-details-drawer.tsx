'use client'

/**
 * Event Details Drawer Component
 * Shows detailed information about a specific audit log event
 */

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ExternalLink, User as UserIcon, Clock, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { AuditLogWithUser } from '@/lib/activity/grouping'
import { getEventConfig, getBadgeClasses } from '@/lib/activity/event-config'
import { formatTime, formatRelativeTime } from '@/lib/activity/grouping'

interface EventDetailsDrawerProps {
  event: AuditLogWithUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDetailsDrawer({ event, open, onOpenChange }: EventDetailsDrawerProps) {
  if (!event) return null

  const config = getEventConfig(event.action)
  const Icon = config.icon
  const metadata = event.metadata as Record<string, any> | null
  const oldValues = event.oldValues as Record<string, any> | null
  const newValues = event.newValues as Record<string, any> | null

  // Determine if this is a transaction-related event
  const isTransaction = event.entityType === 'Transaction' || event.action.includes('TRANSACTION')
  const isApproval = event.action.includes('APPROVE') || event.action.includes('REJECT')
  const isBudget = event.action.includes('BUDGET')
  const isSettings = event.action.includes('SETTINGS')
  const isUserRole = event.action.includes('USER') || event.action.includes('ROLE')

  // Extract common fields
  const vendor = metadata?.vendor || newValues?.vendor || oldValues?.vendor
  const amount = metadata?.amount || newValues?.amount || oldValues?.amount
  const category = metadata?.category || newValues?.category || oldValues?.category
  const status = metadata?.status || newValues?.status || oldValues?.status

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white">
        <SheetHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${getBadgeClasses(config.badgeVariant)}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <SheetTitle>{config.label}</SheetTitle>
              <SheetDescription>
                {formatRelativeTime(event.createdAt)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* User Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              User Information
            </h3>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-navy/60">Name</span>
                <span className="font-medium text-navy">{event.user.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/60">Email</span>
                <span className="text-navy">{event.user.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/60">Role</span>
                <Badge variant="outline" className="capitalize">
                  {event.user.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Event Details
            </h3>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-navy/60">Action</span>
                <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                  {event.action}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/60">Entity Type</span>
                <span className="text-navy">{event.entityType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/60">Entity ID</span>
                <span className="font-mono text-xs text-navy/70">
                  {event.entityId.substring(0, 12)}...
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/60">Timestamp</span>
                <span className="text-navy">
                  {new Date(event.createdAt).toLocaleDateString()} at {formatTime(event.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction-specific details */}
          {isTransaction && (vendor || amount || category) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Transaction Details</h3>
              <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                {vendor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-navy/60">Vendor</span>
                    <span className="font-medium text-navy">{vendor}</span>
                  </div>
                )}
                {amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-navy/60">Amount</span>
                    <span className="font-semibold text-navy">${amount}</span>
                  </div>
                )}
                {category && (
                  <div className="flex justify-between text-sm">
                    <span className="text-navy/60">Category</span>
                    <span className="text-navy">{category}</span>
                  </div>
                )}
                {status && (
                  <div className="flex justify-between text-sm">
                    <span className="text-navy/60">Status</span>
                    <Badge variant="outline" className="capitalize">
                      {status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Before/After Diff */}
          {oldValues && newValues && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Changes</h3>
              <div className="space-y-3">
                {Object.keys(newValues).map(key => {
                  const oldValue = oldValues[key]
                  const newValue = newValues[key]

                  // Skip if values are the same
                  if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
                    return null
                  }

                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs font-semibold text-navy/60 uppercase mb-2">
                        {key}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-xs text-navy/50 mb-1">Before</div>
                          <div className="text-sm text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
                            {formatValue(oldValue)}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-navy/30 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-navy/50 mb-1">After</div>
                          <div className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                            {formatValue(newValue)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Additional Metadata */}
          {metadata && Object.keys(metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-navy/60 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-navy font-medium">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Details */}
          {(event.ipAddress || event.userAgent) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Technical Details</h3>
              <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                {event.ipAddress && (
                  <div className="flex justify-between text-sm">
                    <span className="text-navy/60">IP Address</span>
                    <span className="font-mono text-xs text-navy">{event.ipAddress}</span>
                  </div>
                )}
                {event.userAgent && (
                  <div className="text-sm">
                    <span className="text-navy/60">User Agent</span>
                    <p className="font-mono text-xs text-navy/70 mt-1 break-all">
                      {event.userAgent}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isTransaction && (
            <div className="pt-4">
              <Link href={`/expenses/${event.entityId}`} onClick={() => onOpenChange(false)}>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Transaction
                </Button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Format a value for display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}
