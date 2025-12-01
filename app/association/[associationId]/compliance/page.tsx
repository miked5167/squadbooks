import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getComplianceData } from './actions'
import { ComplianceOverview } from './components/ComplianceOverview'
import { TeamComplianceTable } from './components/TeamComplianceTable'
import { CheckCircle2 } from 'lucide-react'

interface PageProps {
  params: Promise<{
    associationId: string
  }>
}

export default async function CompliancePage({ params }: PageProps) {
  const { associationId } = await params
  const { association, teams, stats } = await getComplianceData(associationId)

  if (!association) {
    notFound()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-orange-600" />
          Compliance Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor compliance across all teams in {association.name}
        </p>
      </div>

      {/* Overview Stats */}
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading stats...</div>}>
        <ComplianceOverview stats={stats} />
      </Suspense>

      {/* Teams Table */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg">
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading teams...</div>}>
          <TeamComplianceTable
            teams={teams}
            associationId={associationId}
          />
        </Suspense>
      </div>
    </div>
  )
}
