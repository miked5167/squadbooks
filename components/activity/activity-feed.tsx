'use client'

/**
 * Activity Feed Component
 * Displays grouped audit log events with day headers
 */

import { Badge } from '@/components/ui/badge'
import { formatTime, generateEventSummary, type AuditLogWithUser } from '@/lib/activity/grouping'
import { getEventConfig, getBadgeClasses } from '@/lib/activity/event-config'

interface ActivityFeedProps {
  events: AuditLogWithUser[]
  onEventClick: (event: AuditLogWithUser) => void
}

export function ActivityFeed({ events, onEventClick }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-lg font-semibold text-navy mb-2">No events found</h3>
        <p className="text-navy/60 max-w-sm mx-auto">
          Try adjusting your filters or search criteria
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const config = getEventConfig(event.action)
        const Icon = config.icon
        const summary = generateEventSummary(event)

        return (
          <button
            key={event.id}
            onClick={() => onEventClick(event)}
            className="w-full text-left flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onEventClick(event)
              }
            }}
            tabIndex={0}
          >
            {/* Icon */}
            <div className={`mt-1 p-2 rounded-lg flex-shrink-0 ${getBadgeClasses(config.badgeVariant)}`}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* User name and action */}
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-navy">{event.user.name}</span>
                <span className="text-sm text-navy/70">{summary}</span>
              </div>

              {/* Entity info */}
              <div className="text-sm text-navy/60 mb-2">
                {event.entityType}
                {event.entityId && (
                  <>
                    {' • '}
                    <span className="font-mono text-xs">{event.entityId.substring(0, 8)}</span>
                  </>
                )}
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-navy/50">
                <span>{formatTime(event.createdAt)}</span>
              </div>
            </div>

            {/* Badge */}
            <div className="flex-shrink-0">
              <Badge className={getBadgeClasses(config.badgeVariant)}>
                {config.label}
              </Badge>
            </div>
          </button>
        )
      })}
    </div>
  )
}
