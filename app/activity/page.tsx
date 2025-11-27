'use client'

/**
 * Enhanced Activity & Audit Page
 * Comprehensive audit log viewer with filtering, grouping, and oversight features
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-dev-auth'
import dynamic from 'next/dynamic'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ActivityFeed } from '@/components/activity/activity-feed'
import { EventDetailsDrawer } from '@/components/activity/event-details-drawer'
import { WeeklySummaryCard } from '@/components/activity/weekly-summary-card'
import { PotentialIssuesCard } from '@/components/activity/potential-issues-card'
import { groupAuditLogsByDay, type AuditLogWithUser, type GroupedAuditLogs } from '@/lib/activity/grouping'
import type { ActivitySummary } from '@/lib/activity/weekly-summary'
import type { PotentialIssue } from '@/lib/activity/potential-issues'
import type { ActivityFilters } from '@/components/activity/activity-filters'

// Import ActivityFiltersBar without SSR to prevent hydration issues with Radix Select
const ActivityFiltersBar = dynamic(
  () => import('@/components/activity/activity-filters').then((mod) => mod.ActivityFiltersBar),
  { ssr: false }
)

export default function ActivityPage() {
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLogWithUser[]>([])
  const [groupedLogs, setGroupedLogs] = useState<GroupedAuditLogs[]>([])
  const [summary, setSummary] = useState<ActivitySummary | null>(null)
  const [issues, setIssues] = useState<PotentialIssue[]>([])
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([])
  const [selectedEvent, setSelectedEvent] = useState<AuditLogWithUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 25

  // Filter state
  const [filters, setFilters] = useState<ActivityFilters>({
    search: '',
    userId: null,
    categories: [],
    dateRange: '7days',
    hideOnboarding: true,
  })

  // Fetch team members for filter dropdown
  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        const response = await fetch('/api/team/members')
        if (response.ok) {
          const data = await response.json()
          setTeamMembers(data.members || [])
        }
      } catch (error) {
        console.error('Error fetching team members:', error)
      }
    }

    if (userId) {
      fetchTeamMembers()
    }
  }, [userId])

  // Fetch summary and issues
  useEffect(() => {
    async function fetchSummary() {
      try {
        const period = filters.dateRange === 'today' ? 'day' : filters.dateRange === '30days' ? 'month' : 'week'
        const response = await fetch(`/api/activity/summary?period=${period}`)
        if (response.ok) {
          const data = await response.json()
          setSummary(data.summary)
          setIssues(data.issues || [])
        }
      } catch (error) {
        console.error('Error fetching summary:', error)
      }
    }

    if (userId) {
      fetchSummary()
    }
  }, [userId, filters.dateRange])

  // Fetch audit logs with filters
  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true)
      try {
        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
          hideOnboarding: filters.hideOnboarding.toString(),
        })

        if (filters.search) {
          params.append('search', filters.search)
        }

        if (filters.userId) {
          params.append('userId', filters.userId)
        }

        if (filters.categories.length > 0) {
          params.append('categories', filters.categories.join(','))
        }

        // Map date range to dates
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        switch (filters.dateRange) {
          case 'today':
            params.append('startDate', today.toISOString())
            break
          case '7days':
            params.append('startDate', new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
            break
          case '30days':
            params.append('startDate', new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
            break
          // 'all' - no date filter
        }

        const response = await fetch(`/api/activity/logs?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setLogs(data.logs || [])
          setTotalPages(data.pagination?.totalPages || 1)
          setTotalCount(data.pagination?.totalCount || 0)

          // Group logs by day
          const grouped = groupAuditLogsByDay(data.logs || [])
          setGroupedLogs(grouped)
        }
      } catch (error) {
        console.error('Error fetching logs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchLogs()
    }
  }, [userId, filters, currentPage])

  const handleEventClick = (event: AuditLogWithUser) => {
    setSelectedEvent(event)
    setDrawerOpen(true)
  }

  const handleFiltersChange = (newFilters: ActivityFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppSidebar />

      <main className="ml-64 px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-display-2 text-navy mb-2">Activity & Audit</h1>
          <p className="text-lg text-navy/70">
            Monitor team activity, track changes, and maintain oversight
          </p>
        </div>

        {/* Weekly Summary */}
        <div className="mb-6">
          <WeeklySummaryCard summary={summary!} isLoading={!summary} />
        </div>

        {/* Potential Issues */}
        <div className="mb-6">
          <PotentialIssuesCard issues={issues} isLoading={!summary} />
        </div>

        {/* Activity Feed */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-navy">Activity Feed</CardTitle>
            <CardDescription>
              Detailed audit log of all team actions and changes
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="sticky top-0 bg-white z-10 -mx-6 px-6 py-4 border-b">
              <ActivityFiltersBar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                teamMembers={teamMembers}
                totalResults={totalCount}
              />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grouped Events */}
            {!isLoading && groupedLogs.length > 0 && (
              <div className="space-y-8">
                {groupedLogs.map((group) => (
                  <div key={group.date.toISOString()}>
                    {/* Day Header */}
                    <div className="sticky top-[140px] bg-white z-[5] pb-3">
                      <h3 className="text-lg font-semibold text-navy border-b-2 border-navy/10 pb-2">
                        {group.label}
                      </h3>
                    </div>

                    {/* Events for this day */}
                    <ActivityFeed
                      events={group.events}
                      onEventClick={handleEventClick}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && groupedLogs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">No activity found</h3>
                <p className="text-navy/60 max-w-sm mx-auto">
                  {filters.search || filters.userId || filters.categories.length > 0
                    ? 'Try adjusting your filters or search criteria'
                    : 'Team activity and changes will appear here as actions are taken'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="text-sm text-navy/60">
                  Page {currentPage} of {totalPages} • {totalCount} total events
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Event Details Drawer */}
      <EventDetailsDrawer
        event={selectedEvent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  )
}
