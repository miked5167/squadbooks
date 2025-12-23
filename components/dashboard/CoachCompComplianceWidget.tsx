'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Settings,
  TrendingUp,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TeamComplianceStatus {
  teamId: string
  teamName: string
  ageGroup: string | null
  skillLevel: string | null
  cap: number
  actual: number
  percentUsed: number
  status: 'OK' | 'APPROACHING' | 'EXCEEDED'
  hasException: boolean
  exceptionStatus?: 'PENDING' | 'APPROVED' | 'DENIED'
}

interface CoachCompComplianceWidgetProps {
  associationId: string
}

export function CoachCompComplianceWidget({ associationId }: CoachCompComplianceWidgetProps) {
  const [teams, setTeams] = useState<TeamComplianceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [hasPolicy, setHasPolicy] = useState(false)

  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        const response = await fetch(
          `/api/associations/${associationId}/coach-compensation-compliance`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch compliance data')
        }

        const result = await response.json()
        setHasPolicy(result.hasPolicy)
        setTeams(result.teams || [])
      } catch (error) {
        console.error('Error fetching coach comp compliance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompliance()
  }, [associationId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coach Compensation Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasPolicy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coach Compensation Compliance</CardTitle>
          <CardDescription>Monitor team spending against coach compensation caps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Policy Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set up coach compensation limits to track team spending
            </p>
            <Link href={`/association/${associationId}/rules/coach-compensation`}>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Configure Policy
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCents = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXCEEDED':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Exceeded
          </Badge>
        )
      case 'APPROACHING':
        return (
          <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3" />
            Approaching
          </Badge>
        )
      case 'OK':
      default:
        return (
          <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
            <CheckCircle2 className="h-3 w-3" />
            Within Cap
          </Badge>
        )
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'EXCEEDED':
        return 'bg-red-600'
      case 'APPROACHING':
        return 'bg-yellow-500'
      default:
        return 'bg-green-600'
    }
  }

  const exceededCount = teams.filter((t) => t.status === 'EXCEEDED').length
  const approachingCount = teams.filter((t) => t.status === 'APPROACHING').length
  const okCount = teams.filter((t) => t.status === 'OK').length

  // Sort teams: exceeded first, then approaching, then OK
  const sortedTeams = [...teams].sort((a, b) => {
    const statusOrder = { EXCEEDED: 0, APPROACHING: 1, OK: 2 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Coach Compensation Compliance</CardTitle>
            <CardDescription>Team spending vs. coach compensation caps</CardDescription>
          </div>
          <Link href={`/association/${associationId}/rules/coach-compensation`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Badges */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-600"></div>
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">{exceededCount}</strong> Exceeded
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">{approachingCount}</strong> Approaching
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-600"></div>
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">{okCount}</strong> Within Cap
            </span>
          </div>
        </div>

        {/* Teams Table */}
        {teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No teams found with coach compensation data</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Cap</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeams.slice(0, 10).map((team) => (
                  <TableRow key={team.teamId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{team.teamName}</div>
                        {team.ageGroup && team.skillLevel && (
                          <div className="text-xs text-muted-foreground">
                            {team.ageGroup} {team.skillLevel}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${formatCents(team.cap)}</TableCell>
                    <TableCell className="text-right">${formatCents(team.actual)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress
                          value={Math.min(team.percentUsed, 100)}
                          className={`h-2 ${getProgressColor(team.status)}`}
                        />
                        <div className="text-xs text-muted-foreground">
                          {team.percentUsed.toFixed(1)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(team.status)}
                        {team.hasException && team.exceptionStatus === 'PENDING' && (
                          <Badge variant="outline" className="text-xs">
                            Exception Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/association/${associationId}/teams/${team.teamId}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {teams.length > 10 && (
          <div className="mt-4 text-center">
            <Link href={`/association/${associationId}/rules/coach-compensation`}>
              <Button variant="outline" size="sm">
                View All Teams
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
