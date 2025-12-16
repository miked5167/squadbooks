'use client'

import { useState } from 'react'
import { Shield, CheckCircle2, XCircle, Edit, Trash2, Users, Target } from 'lucide-react'
import { toggleRuleActive, deleteRule } from '../actions'
import { useRouter } from 'next/navigation'
import { RuleForm } from './RuleForm'
import { Badge } from '@/components/ui/badge'
import type { TeamType, AgeDivision, CompetitiveLevel } from '@/lib/validations/rule-schemas'

interface Rule {
  id: string
  ruleType: string
  name: string
  description: string | null
  isActive: boolean
  config: any
  approvalTiers: any
  requiredExpenses: any
  signingAuthorityComposition: any
  teamTypeFilter: TeamType[] | null
  ageDivisionFilter: AgeDivision[] | null
  competitiveLevelFilter: CompetitiveLevel[] | null
  createdAt: Date
  _count: {
    overrides: number
    violations: number
  }
}

interface RuleListTableProps {
  rules: Rule[]
  associationId: string
  associationCurrency: string
}

const teamTypeLabels: Record<TeamType, string> = {
  HOUSE_LEAGUE: "House League",
  REPRESENTATIVE: "Rep/Travel",
  ADULT_RECREATIONAL: "Adult Rec",
  OTHER: "Other",
}

const ageDivisionLabels: Record<AgeDivision, string> = {
  U7: "U7",
  U9: "U9",
  U11: "U11",
  U13: "U13",
  U15: "U15",
  U18: "U18",
  OTHER: "Other",
}

const competitiveLevelLabels: Record<CompetitiveLevel, string> = {
  AAA: "AAA",
  AA: "AA",
  A: "A",
  BB: "BB",
  B: "B",
  MD: "MD",
  HOUSE_RECREATIONAL: "House/Rec",
  NOT_APPLICABLE: "N/A",
  OTHER: "Other",
}

export function RuleListTable({ rules, associationId, associationCurrency }: RuleListTableProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  const getRuleTypeDisplay = (ruleType: string) => {
    const types: Record<string, { label: string; color: string }> = {
      MAX_BUDGET: { label: 'Max Budget', color: 'bg-blue-100 text-blue-800' },
      MAX_ASSESSMENT: { label: 'Max Assessment', color: 'bg-purple-100 text-purple-800' },
      MAX_BUYOUT: { label: 'Max Buyout', color: 'bg-pink-100 text-pink-800' },
      ZERO_BALANCE: { label: 'Zero Balance', color: 'bg-green-100 text-green-800' },
      APPROVAL_TIERS: { label: 'Approval Tiers', color: 'bg-yellow-100 text-yellow-800' },
      REQUIRED_EXPENSES: { label: 'Required Expenses', color: 'bg-indigo-100 text-indigo-800' },
      SIGNING_AUTHORITY_COMPOSITION: { label: 'Signing Authority', color: 'bg-teal-100 text-teal-800' },
    }
    return types[ruleType] || { label: ruleType, color: 'bg-gray-100 text-gray-800' }
  }

  const getRuleDetails = (rule: Rule) => {
    switch (rule.ruleType) {
      case 'MAX_BUDGET':
      case 'MAX_ASSESSMENT':
      case 'MAX_BUYOUT':
        return `$${rule.config?.maxAmount?.toLocaleString() || 'N/A'}`
      case 'ZERO_BALANCE':
        return 'Budget must balance'
      case 'APPROVAL_TIERS':
        const tiers = rule.approvalTiers as any[]
        return tiers ? `${tiers.length} tiers configured` : 'Not configured'
      case 'REQUIRED_EXPENSES':
        const expenses = rule.requiredExpenses as string[]
        return expenses ? `${expenses.length} categories required` : 'Not configured'
      case 'SIGNING_AUTHORITY_COMPOSITION':
        return 'GTHL compliance'
      default:
        return 'See details'
    }
  }

  const getFilterDisplay = (rule: Rule) => {
    const hasFilters =
      (rule.teamTypeFilter && rule.teamTypeFilter.length > 0) ||
      (rule.ageDivisionFilter && rule.ageDivisionFilter.length > 0) ||
      (rule.competitiveLevelFilter && rule.competitiveLevelFilter.length > 0)

    if (!hasFilters) {
      return (
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm text-gray-600">All Teams</span>
        </div>
      )
    }

    const allFilters = [
      ...(rule.teamTypeFilter || []).map(type => teamTypeLabels[type]),
      ...(rule.ageDivisionFilter || []).map(div => ageDivisionLabels[div]),
      ...(rule.competitiveLevelFilter || []).map(level => competitiveLevelLabels[level]),
    ]

    if (allFilters.length === 0) {
      return (
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm text-gray-600">All Teams</span>
        </div>
      )
    }

    // Show first 2 badges, then "+X more" if there are more
    const displayFilters = allFilters.slice(0, 2)
    const remainingCount = allFilters.length - 2

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <Target className="w-3.5 h-3.5 text-blue-600" />
        {displayFilters.map((label, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {label}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-gray-500">+{remainingCount} more</span>
        )}
      </div>
    )
  }

  const handleToggleActive = async (ruleId: string, currentState: boolean) => {
    setLoading(ruleId)
    const result = await toggleRuleActive(ruleId, !currentState)
    setLoading(null)

    if (result.success) {
      router.refresh()
    } else {
      alert('Failed to update rule status')
    }
  }

  const handleDelete = async (ruleId: string, ruleName: string) => {
    if (!confirm(`Are you sure you want to delete the rule "${ruleName}"? This will deactivate the rule.`)) {
      return
    }

    setLoading(ruleId)
    const result = await deleteRule(ruleId)
    setLoading(null)

    if (result.success) {
      router.refresh()
    } else {
      alert('Failed to delete rule')
    }
  }

  if (rules.length === 0) {
    return (
      <div className="p-12 text-center">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rules Configured</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Get started by creating your first governance rule. Rules help ensure all teams follow
          your association's financial policies.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rule
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Applies To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Impact
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rules.map((rule) => {
            const typeDisplay = getRuleTypeDisplay(rule.ruleType)
            return (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{rule.name}</p>
                    {rule.description && (
                      <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeDisplay.color}`}>
                    {typeDisplay.label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{getRuleDetails(rule)}</p>
                </td>
                <td className="px-6 py-4">
                  {getFilterDisplay(rule)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(rule.id, rule.isActive)}
                    disabled={loading === rule.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {rule.isActive ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-green-700">Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Inactive</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {rule._count.overrides > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {rule._count.overrides} override{rule._count.overrides !== 1 ? 's' : ''}
                      </span>
                    )}
                    {rule._count.violations > 0 && (
                      <span className="text-orange-600">
                        {rule._count.violations} violation{rule._count.violations !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Edit rule"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id, rule.name)}
                      disabled={loading === rule.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>

    {editingRule && (
      <RuleForm
        associationId={associationId}
        associationCurrency={associationCurrency}
        open={!!editingRule}
        onOpenChange={(open) => !open && setEditingRule(null)}
        existingRule={editingRule}
      />
    )}
  </>
  )
}
