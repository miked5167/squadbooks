import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getRulesData } from './actions'
import { RuleListTable } from './components/RuleListTable'
import { AddRuleButton } from './components/AddRuleButton'
import { Shield, Info } from 'lucide-react'

interface PageProps {
  params: Promise<{
    associationId: string
  }>
}

export default async function RulesPage({ params }: PageProps) {
  const { associationId } = await params
  const { association, rules } = await getRulesData(associationId)

  if (!association) {
    notFound()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-orange-600" />
              Governance Rules
            </h1>
            <p className="text-gray-600 mt-2">
              Configure financial governance policies for all teams in {association.name}
            </p>
          </div>
          <AddRuleButton associationId={associationId} />
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How Governance Rules Work</p>
            <p className="text-blue-700">
              Rules defined here are automatically enforced across all teams. Teams cannot submit
              budgets or transactions that violate active rules. You can grant team-specific overrides
              when exceptions are needed.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading rules...</div>}>
          <RuleListTable
            rules={rules}
            associationId={associationId}
          />
        </Suspense>
      </div>
    </div>
  )
}
