'use client'

/**
 * Potential Issues Card Component
 * Displays detected anomalies and suspicious patterns
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { PotentialIssue } from '@/lib/activity/potential-issues'
import { getSeverityBadgeClasses, getSeverityIconColor } from '@/lib/activity/potential-issues'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface PotentialIssuesCardProps {
  issues: PotentialIssue[]
  isLoading?: boolean
}

export function PotentialIssuesCard({ issues, isLoading }: PotentialIssuesCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (isLoading) {
    return (
      <Card className="border-0 shadow-card border-l-4 border-l-yellow-500">
        <CardHeader>
          <CardTitle className="text-navy flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Loading Potential Issues...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (issues.length === 0) {
    return (
      <Card className="border-0 shadow-card border-l-4 border-l-meadow">
        <CardHeader>
          <CardTitle className="text-navy flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-meadow" />
            Potential Issues
          </CardTitle>
          <CardDescription>
            No issues detected - everything looks good!
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const highSeverityCount = issues.filter(i => i.severity === 'high').length
  const mediumSeverityCount = issues.filter(i => i.severity === 'medium').length
  const lowSeverityCount = issues.filter(i => i.severity === 'low').length

  return (
    <Card className="border-0 shadow-card border-l-4 border-l-yellow-500">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-navy flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Potential Issues
              </CardTitle>
              <CardDescription>
                {issues.length} {issues.length === 1 ? 'issue' : 'issues'} detected
                {highSeverityCount > 0 && ` • ${highSeverityCount} high priority`}
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Severity Summary */}
          {isExpanded && (
            <div className="flex gap-2 mt-3">
              {highSeverityCount > 0 && (
                <Badge className={getSeverityBadgeClasses('high')}>
                  {highSeverityCount} High
                </Badge>
              )}
              {mediumSeverityCount > 0 && (
                <Badge className={getSeverityBadgeClasses('medium')}>
                  {mediumSeverityCount} Medium
                </Badge>
              )}
              {lowSeverityCount > 0 && (
                <Badge className={getSeverityBadgeClasses('low')}>
                  {lowSeverityCount} Low
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            <div className="space-y-3">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${getSeverityIconColor(issue.severity)}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className="font-semibold text-navy">{issue.title}</h4>
                      <Badge className={getSeverityBadgeClasses(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-navy/70 mb-2">{issue.description}</p>
                    <div className="flex items-center gap-2 text-xs text-navy/50">
                      <span>{issue.entityType}</span>
                      <span>•</span>
                      <span>{issue.detectedAt.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link href={issue.link} className="flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
