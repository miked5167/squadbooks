'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface Acknowledgment {
  id: string
  familyName: string
  acknowledged: boolean
  acknowledgedAt: Date | null
}

interface FamilyAcknowledgmentListProps {
  acknowledgments: Acknowledgment[]
  type: 'acknowledged' | 'pending'
}

export function FamilyAcknowledgmentList({
  acknowledgments,
  type,
}: FamilyAcknowledgmentListProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isAcknowledged = type === 'acknowledged'

  if (acknowledgments.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-dashed border-navy/20">
        <p className="text-sm text-navy/50 italic text-center">
          {isAcknowledged ? 'No acknowledgments yet' : 'All families have acknowledged'}
        </p>
      </div>
    )
  }

  const icon = isAcknowledged ? (
    <CheckCircle2 className="h-4 w-4 text-green-600" />
  ) : (
    <Clock className="h-4 w-4 text-orange-600" />
  )

  const bgColor = isAcknowledged ? 'bg-green-50' : 'bg-orange-50'
  const borderColor = isAcknowledged ? 'border-green-200' : 'border-orange-200'
  const badgeVariant = isAcknowledged ? 'default' : 'secondary'
  const badgeClassName = isAcknowledged
    ? 'bg-green-100 text-green-700 hover:bg-green-100'
    : 'bg-orange-100 text-orange-700 hover:bg-orange-100'

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`rounded-lg border ${borderColor} ${bgColor} overflow-hidden`}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 hover:bg-black/5"
          >
            <div className="flex items-center gap-2">
              {icon}
              <span className="text-sm font-semibold text-navy">
                {isAcknowledged ? 'Acknowledged' : 'Pending'} ({acknowledgments.length})
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-navy/60" />
            ) : (
              <ChevronDown className="h-4 w-4 text-navy/60" />
            )}
          </Button>
        </CollapsibleTrigger>

        {/* Collapsed View - Scrollable Pills */}
        {!isOpen && acknowledgments.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-navy/20 scrollbar-track-transparent">
              {acknowledgments.slice(0, 10).map((ack) => (
                <Badge
                  key={ack.id}
                  variant={badgeVariant}
                  className={`${badgeClassName} whitespace-nowrap flex-shrink-0`}
                >
                  {ack.familyName}
                </Badge>
              ))}
              {acknowledgments.length > 10 && (
                <Badge
                  variant="outline"
                  className="whitespace-nowrap flex-shrink-0 bg-white"
                >
                  +{acknowledgments.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Expanded View - Full List */}
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {acknowledgments.map((ack) => (
                <li
                  key={ack.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded-lg border border-navy/10"
                >
                  <span className="text-sm font-medium text-navy">
                    {ack.familyName}
                  </span>
                  {ack.acknowledgedAt && (
                    <span className="text-xs text-navy/60 mt-1 sm:mt-0">
                      {format(new Date(ack.acknowledgedAt), 'MMM d, h:mm a')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
