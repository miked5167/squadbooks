'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAlertsData, type NormalizedAlert, type AlertSeverity } from './actions'
import { AssociationNav } from '@/app/components/AssociationNav'
import { SeverityBadge } from '@/app/components/SeverityBadge'
import { EmptyState } from '@/app/components/EmptyState'

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

function AlertCard({ alert }: { alert: NormalizedAlert }) {
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
        <Link
          href={alert.link}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Team Details →
        </Link>
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

      {/* Navigation */}
      {associationId && <AssociationNav associationId={associationId} />}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="grid grid-cols-1 gap-4">
            {filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
