'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAlertsData, type NormalizedAlert, type AlertSeverity } from './actions'
import { SeverityBadge } from '@/app/components/SeverityBadge'
import { EmptyState } from '@/app/components/EmptyState'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: Promise<{
    associationId: string
  }>
}

type FilterType = 'ALL' | 'PENDING_APPROVAL' | 'MISSING_RECEIPT' | 'OVERSPEND' | 'FLAGS'

function getSeverityStyles(severity: AlertSeverity) {
  const styles = {
    HIGH: 'border-red-300 bg-red-50',
    MEDIUM: 'border-yellow-300 bg-yellow-50',
    LOW: 'border-gray-300 bg-gray-50',
  }
  return styles[severity] || styles.LOW
}

function getSeverityBadge(severity: AlertSeverity) {
  const badges = {
    HIGH: 'bg-red-100 text-red-800 border-red-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LOW: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  return badges[severity] || badges.LOW
}

function getAlertTypeLabel(type: string) {
  const labels: Record<string, string> = {
    PENDING_APPROVAL: 'Pending Approval',
    MISSING_RECEIPT: 'Missing Receipt',
    OVERSPEND: 'Budget Overspend',
    HIGH_BUDGET_USAGE: 'High Budget Usage',
    CRITICAL_HEALTH: 'Critical Health',
    WARNING_HEALTH: 'Warning Health',
    MULTIPLE_PENDING: 'Multiple Pending',
    MULTIPLE_RECEIPTS: 'Multiple Receipts',
  }
  return labels[type] || type.replace(/_/g, ' ')
}

function AlertCard({ alert, onResolve }: { alert: NormalizedAlert; onResolve: (alert: NormalizedAlert) => void }) {
  return (
    <div className={`border-2 rounded-lg p-5 ${getSeverityStyles(alert.severity)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <SeverityBadge severity={alert.severity} />
            <span className="text-sm font-medium text-gray-600">
              {getAlertTypeLabel(alert.type)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{alert.teamName}</h3>
          <p className="text-gray-700">{alert.message}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {new Date(alert.createdAt).toLocaleDateString()} at {new Date(alert.createdAt).toLocaleTimeString()}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onResolve(alert)
            }}
            className="text-sm"
          >
            Resolve
          </Button>
          <Link
            href={alert.link}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Team Details →
          </Link>
        </div>
      </div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
          active ? 'bg-blue-500' : 'bg-gray-200 text-gray-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

export default function AlertsPage({ params }: PageProps) {
  const [associationId, setAssociationId] = useState<string | null>(null)
  const [association, setAssociation] = useState<{ id: string; name: string } | null>(null)
  const [alerts, setAlerts] = useState<NormalizedAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL')

  // Resolution dialog state
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolvingAlert, setResolvingAlert] = useState<NormalizedAlert | null>(null)
  const [resolving, setResolving] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setAssociationId(resolvedParams.associationId)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    async function loadData() {
      if (!associationId) return

      setLoading(true)
      const data = await getAlertsData(associationId)
      setAssociation(data.association)
      setAlerts(data.alerts)
      setLoading(false)
    }
    loadData()
  }, [associationId])

  // Function to reload alerts data
  const reloadAlerts = async () => {
    if (!associationId) return
    const data = await getAlertsData(associationId)
    setAlerts(data.alerts)
  }

  // Handle resolve alert
  const handleResolve = async () => {
    if (!resolvingAlert || !associationId) return

    setResolving(true)
    try {
      const response = await fetch(
        `/api/associations/${associationId}/alerts/${resolvingAlert.id}/resolve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to resolve alert')
      }

      // Refresh alerts list
      await reloadAlerts()

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

  // Handle opening resolve dialog
  const handleOpenResolveDialog = (alert: NormalizedAlert) => {
    setResolvingAlert(alert)
    setResolveDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      </div>
    )
  }

  if (!association) {
    notFound()
  }

  // Filter alerts based on active filter
  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === 'ALL') return true
    if (activeFilter === 'PENDING_APPROVAL') {
      return alert.type === 'PENDING_APPROVAL' || alert.type === 'MULTIPLE_PENDING'
    }
    if (activeFilter === 'MISSING_RECEIPT') {
      return alert.type === 'MISSING_RECEIPT' || alert.type === 'MULTIPLE_RECEIPTS'
    }
    if (activeFilter === 'OVERSPEND') {
      return alert.type === 'OVERSPEND' || alert.type === 'HIGH_BUDGET_USAGE'
    }
    if (activeFilter === 'FLAGS') {
      return alert.type === 'CRITICAL_HEALTH' || alert.type === 'WARNING_HEALTH'
    }
    return true
  })

  // Count alerts by type for filter badges
  const pendingCount = alerts.filter(
    (a) => a.type === 'PENDING_APPROVAL' || a.type === 'MULTIPLE_PENDING'
  ).length
  const receiptCount = alerts.filter(
    (a) => a.type === 'MISSING_RECEIPT' || a.type === 'MULTIPLE_RECEIPTS'
  ).length
  const overspendCount = alerts.filter(
    (a) => a.type === 'OVERSPEND' || a.type === 'HIGH_BUDGET_USAGE'
  ).length
  const flagsCount = alerts.filter(
    (a) => a.type === 'CRITICAL_HEALTH' || a.type === 'WARNING_HEALTH'
  ).length

  // Pagination calculations
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Link
              href={`/association/${associationId}/overview`}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              ← Back to Overview
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alerts & Issues</h1>
              <p className="text-gray-600 mt-2">{association.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Total Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{alerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <FilterButton
              active={activeFilter === 'ALL'}
              onClick={() => setActiveFilter('ALL')}
              count={alerts.length}
            >
              All Alerts
            </FilterButton>
            <FilterButton
              active={activeFilter === 'PENDING_APPROVAL'}
              onClick={() => setActiveFilter('PENDING_APPROVAL')}
              count={pendingCount}
            >
              Pending Approvals
            </FilterButton>
            <FilterButton
              active={activeFilter === 'MISSING_RECEIPT'}
              onClick={() => setActiveFilter('MISSING_RECEIPT')}
              count={receiptCount}
            >
              Missing Receipts
            </FilterButton>
            <FilterButton
              active={activeFilter === 'OVERSPEND'}
              onClick={() => setActiveFilter('OVERSPEND')}
              count={overspendCount}
            >
              Overspend
            </FilterButton>
            <FilterButton
              active={activeFilter === 'FLAGS'}
              onClick={() => setActiveFilter('FLAGS')}
              count={flagsCount}
            >
              Health Flags
            </FilterButton>
          </div>
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <EmptyState
            title={activeFilter === 'ALL' ? 'No alerts right now' : 'No alerts in this category'}
            description={activeFilter === 'ALL'
              ? 'All teams are within budget and up to date on receipts. 🎉'
              : 'There are no alerts matching this filter.'}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {paginatedAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onResolve={handleOpenResolveDialog} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                <div className="flex flex-1 justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredAlerts.length)}</span> of{' '}
                      <span className="font-medium">{filteredAlerts.length}</span> alerts
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      ← Previous
                    </Button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
                  <span className="text-sm">{resolvingAlert.message}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Severity:</span>{' '}
                  <SeverityBadge severity={resolvingAlert.severity} />
                </div>
                <div>
                  <span className="text-sm font-medium">Type:</span>{' '}
                  <span className="text-sm">{getAlertTypeLabel(resolvingAlert.type)}</span>
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
