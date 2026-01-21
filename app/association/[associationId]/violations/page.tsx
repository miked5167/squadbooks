import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getViolationsData } from './actions'
import { ViolationLogTable } from './components/ViolationLogTable'
import { AlertTriangle } from 'lucide-react'

interface PageProps {
  params: Promise<{
    associationId: string
  }>
}

export default async function ViolationsPage({ params }: PageProps) {
  const { associationId } = await params
  const { association, violations, summary } = await getViolationsData(associationId)

  if (!association) {
    notFound()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-orange-600" />
          Violation Log
        </h1>
        <p className="text-gray-600 mt-2">
          Track and resolve governance rule violations across {association.name}
        </p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Violations</p>
            <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-sm font-medium text-red-600 mb-2">Critical</p>
            <p className="text-3xl font-bold text-red-900">{summary.critical}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <p className="text-sm font-medium text-orange-600 mb-2">Errors</p>
            <p className="text-3xl font-bold text-orange-900">{summary.errors}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-sm font-medium text-yellow-600 mb-2">Warnings</p>
            <p className="text-3xl font-bold text-yellow-900">{summary.warnings}</p>
          </div>
        </div>
      )}

      {/* Violations Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading violations...</div>}>
          <ViolationLogTable
            violations={violations}
            associationId={associationId}
          />
        </Suspense>
      </div>
    </div>
  )
}
