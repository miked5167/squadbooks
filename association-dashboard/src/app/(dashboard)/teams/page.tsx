/**
 * Teams List Page
 *
 * Displays a searchable, filterable, sortable table of all teams with:
 * - Search by team name
 * - Filter by health status
 * - Column sorting
 * - Pagination (50 per page)
 * - Click to view team details
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Team item type
interface TeamItem {
  id: string
  teamName: string
  division: string | null
  season: string | null
  healthStatus: string | null
  budgetTotal: number | null
  spent: number | null
  remaining: number | null
  percentUsed: number | null
  lastActivity: string | null
  redFlagCount: number
  lastSynced: string | null
}

// Response type
interface TeamsListData {
  teams: TeamItem[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

type SortField =
  | 'teamName'
  | 'division'
  | 'healthStatus'
  | 'percentUsed'
  | 'spent'
  | 'lastActivity'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'healthy' | 'needs_attention' | 'at_risk'

export default function TeamsPage() {
  const { userId, getToken } = useAuth()
  const router = useRouter()

  // State
  const [data, setData] = useState<TeamsListData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [associationId, setAssociationId] = useState<string | null>(null)

  // Filters and sorting
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortField>('teamName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Get association ID (from user record)
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
        // For now, we'll use a placeholder
        // In production, we'd fetch this from the user's profile
        setAssociationId('temp-id') // Temporary for development
      }
    }
    if (userId) {
      getAssociation()
    }
  }, [userId, getToken])

  // Fetch teams data
  const fetchTeams = useCallback(async () => {
    if (!associationId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '50',
        status: statusFilter,
        sortBy,
        sortDir,
      })

      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      }

      const response = await fetch(
        `/api/associations/${associationId}/teams?${params.toString()}`,
        {
          cache: 'no-store',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch teams')
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
  }, [associationId, page, statusFilter, debouncedSearch, sortBy, sortDir])

  // Fetch teams when filters change
  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
    setPage(1)
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
        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">
          View and manage all teams in your association
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Tabs
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as StatusFilter)
                setPage(1)
              }}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="healthy">Healthy</TabsTrigger>
                <TabsTrigger value="needs_attention">Needs Attention</TabsTrigger>
                <TabsTrigger value="at_risk">At Risk</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {data ? `${data.pagination.totalCount} Team${data.pagination.totalCount !== 1 ? 's' : ''}` : 'Teams'}
              </CardTitle>
              <CardDescription>
                Click on a team to view details
              </CardDescription>
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
          ) : data.teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-2">No teams found</p>
              {(search || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader
                        label="Team Name"
                        field="teamName"
                        currentSort={sortBy}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Division"
                        field="division"
                        currentSort={sortBy}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Status"
                        field="healthStatus"
                        currentSort={sortBy}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                      <TableHead className="text-right">Budget</TableHead>
                      <SortableHeader
                        label="Spent"
                        field="spent"
                        currentSort={sortBy}
                        currentDir={sortDir}
                        onSort={handleSort}
                        className="text-right"
                      />
                      <TableHead className="text-right">Remaining</TableHead>
                      <SortableHeader
                        label="% Used"
                        field="percentUsed"
                        currentSort={sortBy}
                        currentDir={sortDir}
                        onSort={handleSort}
                        className="text-right"
                      />
                      <SortableHeader
                        label="Last Activity"
                        field="lastActivity"
                        currentSort={sortBy}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                      <TableHead className="text-center">Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.teams.map((team) => (
                      <TableRow
                        key={team.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(team.id)}
                      >
                        <TableCell className="font-medium">
                          <div>
                            <div>{team.teamName}</div>
                          </div>
                        </TableCell>
                        <TableCell>{team.division || '-'}</TableCell>
                        <TableCell>
                          {team.healthStatus ? (
                            <HealthBadge status={team.healthStatus} />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {team.budgetTotal
                            ? `$${team.budgetTotal.toLocaleString()}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {team.spent ? `$${team.spent.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {team.remaining
                            ? `$${team.remaining.toLocaleString()}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {team.percentUsed !== null
                            ? `${team.percentUsed.toFixed(0)}%`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {team.lastActivity ? (
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(team.lastActivity), {
                                addSuffix: true,
                              })}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {team.redFlagCount > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              {team.redFlagCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 50 + 1} to{' '}
                  {Math.min(page * 50, data.pagination.totalCount)} of{' '}
                  {data.pagination.totalCount} teams
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(data.pagination.totalPages)}
                    disabled={page === data.pagination.totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Sortable Table Header Component
interface SortableHeaderProps {
  label: string
  field: SortField
  currentSort: SortField
  currentDir: SortDir
  onSort: (field: SortField) => void
  className?: string
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort === field

  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <span>{label}</span>
        {isActive && (
          <>
            {currentDir === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
          </>
        )}
      </button>
    </TableHead>
  )
}

// Health Status Badge
function HealthBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    healthy: {
      label: 'Healthy',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    needs_attention: {
      label: 'Needs Attention',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    at_risk: {
      label: 'At Risk',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  }

  const variant = variants[status] || variants.healthy

  return (
    <Badge variant="outline" className={`text-xs ${variant.className}`}>
      {variant.label}
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
