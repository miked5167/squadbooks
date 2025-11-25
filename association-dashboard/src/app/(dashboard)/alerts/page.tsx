/**
 * Alerts Page
 *
 * Displays all active alerts with:
 * - Filtering by severity (warning/critical)
 * - Sorting by severity and created date
 * - Click to view team details
 * - Alert resolution capability
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Alert item type
interface AlertItem {
  id: string
  teamId: string
  teamName: string
  alertType: string
  severity: string
  title: string
  description: string | null
  createdAt: string
  lastTriggeredAt: string
  status: string
}

// Response type
interface AlertsData {
  alerts: AlertItem[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

type SeverityFilter = 'all' | 'warning' | 'critical'

export default function AlertsPage() {
  const { userId, getToken } = useAuth()
  const router = useRouter()

  // State
  const [data, setData] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [associationId, setAssociationId] = useState<string | null>(null)

  // Filters
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [page, setPage] = useState(1)

  // Resolution dialog
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolvingAlert, setResolvingAlert] = useState<AlertItem | null>(null)
  const [resolving, setResolving] = useState(false)

  // Get association ID
  useEffect(() => {
    async function getAssociation() {
      try {
        const token = await getToken()
        const response = await fetch('/api/user/association', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const result = await response.json()
          setAssociationId(result.associationId)
        }
      } catch (err) {
        console.error('Error fetching association:', err)
      }
    }
    if (userId) {
      getAssociation()
    }
  }, [userId, getToken])

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!associationId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '50',
        severity: severityFilter,
      })

      const response = await fetch(
        `/api/associations/${associationId}/alerts?${params.toString()}`,
        {
          cache: 'no-store',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error.message)
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [associationId, page, severityFilter])

  // Fetch alerts when filters change
  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Handle resolve alert
  const handleResolve = async () => {
    if (!resolvingAlert) return

    setResolving(true)
    try {
      const response = await fetch(`/api/alerts/${resolvingAlert.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error('Failed to resolve alert')
      }

      // Refresh alerts list
      await fetchAlerts()

      // Close dialog
      setResolveDialogOpen(false)
      setResolvingAlert(null)
    } catch (err) {
      console.error('Error resolving alert:', err)
      alert('Failed to resolve alert. Please try again.')
    } finally {
      setResolving(false)
    }
  }

  // Handle row click
  const handleRowClick = (teamId: string) => {
    router.push(`/teams/${teamId}`)
  }

  if (!userId) {
    return null
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">
          Monitor and manage alerts across all teams
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={severityFilter}
            onValueChange={(value) => {
              setSeverityFilter(value as SeverityFilter)
              setPage(1)
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All Alerts</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="warning">Warning</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {data
                  ? `${data.pagination.totalCount} Active Alert${
                      data.pagination.totalCount !== 1 ? 's' : ''
                    }`
                  : 'Active Alerts'}
              </CardTitle>
              <CardDescription>Click on a row to view team details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center py-8 text-destructive">
              <p>{error}</p>
            </div>
          ) : loading || !data ? (
            <TableSkeleton />
          ) : data.alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mb-3" />
              <h3 className="text-lg font-semibold mb-1">No Active Alerts!</h3>
              <p className="text-sm text-muted-foreground">
                All teams are looking good.
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Alert Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Triggered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.alerts.map((alert) => (
                      <TableRow
                        key={alert.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(alert.teamId)}
                      >
                        <TableCell>
                          <SeverityBadge severity={alert.severity} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {alert.teamName}
                        </TableCell>
                        <TableCell className="text-sm">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {alert.alertType}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{alert.title}</div>
                            {alert.description && (
                              <div className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">
                                {alert.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(alert.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.lastTriggeredAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setResolvingAlert(alert)
                              setResolveDialogOpen(true)
                            }}
                          >
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 50 + 1} to{' '}
                    {Math.min(page * 50, data.pagination.totalCount)} of{' '}
                    {data.pagination.totalCount} alerts
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {page} of {data.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Resolve Alert Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Are you sure you want to resolve this alert? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {resolvingAlert && (
            <div className="py-4">
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Team:</span>{' '}
                  <span className="text-sm">{resolvingAlert.teamName}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Alert:</span>{' '}
                  <span className="text-sm">{resolvingAlert.title}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Severity:</span>{' '}
                  <SeverityBadge severity={resolvingAlert.severity} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
              disabled={resolving}
            >
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={resolving}>
              {resolving ? 'Resolving...' : 'Resolve Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Severity Badge Component
function SeverityBadge({ severity }: { severity: string }) {
  const isWarning = severity === 'warning'
  const isCritical = severity === 'critical'

  return (
    <Badge
      variant={isCritical ? 'destructive' : 'outline'}
      className={
        isWarning ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''
      }
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      {severity}
    </Badge>
  )
}

// Table Loading Skeleton
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 flex-1" />
        </div>
      ))}
    </div>
  )
}
