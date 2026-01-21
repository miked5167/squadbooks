'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  DollarSign,
  Users,
  FileCheck,
  Scale,
  Shield
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/utils'
import { toggleRuleActive, deleteRule } from '../actions'
import { useRouter } from 'next/navigation'

type Rule = {
  id: string
  ruleType: string
  name: string
  description: string | null
  isActive: boolean
  config: any
  approvalTiers: any
  requiredExpenses: any
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

const ruleTypeConfig: Record<string, { label: string; icon: typeof DollarSign; color: string }> = {
  MAX_BUDGET: { label: 'Max Budget', icon: DollarSign, color: 'bg-blue-100 text-blue-800' },
  MAX_ASSESSMENT: { label: 'Max Assessment', icon: Users, color: 'bg-purple-100 text-purple-800' },
  MAX_BUYOUT: { label: 'Max Buyout', icon: DollarSign, color: 'bg-orange-100 text-orange-800' },
  APPROVAL_TIERS: { label: 'Approval Tiers', icon: FileCheck, color: 'bg-green-100 text-green-800' },
  ZERO_BALANCE: { label: 'Zero Balance', icon: Scale, color: 'bg-yellow-100 text-yellow-800' },
  REQUIRED_EXPENSES: { label: 'Required Expenses', icon: FileCheck, color: 'bg-indigo-100 text-indigo-800' },
  SIGNING_AUTHORITY: { label: 'Signing Authority', icon: Users, color: 'bg-pink-100 text-pink-800' },
  COACH_COMPENSATION: { label: 'Coach Compensation', icon: DollarSign, color: 'bg-teal-100 text-teal-800' },
}

export function RuleListTable({ rules, associationId, associationCurrency }: RuleListTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleActive = async (ruleId: string, currentActive: boolean) => {
    setLoadingId(ruleId)
    await toggleRuleActive(ruleId, !currentActive)
    router.refresh()
    setLoadingId(null)
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    setLoadingId(ruleId)
    await deleteRule(ruleId)
    router.refresh()
    setLoadingId(null)
  }

  const getRuleTypeDisplay = (ruleType: string) => {
    const config = ruleTypeConfig[ruleType] || {
      label: ruleType,
      icon: Shield,
      color: 'bg-gray-100 text-gray-800'
    }
    const Icon = config.icon
    return (
      <Badge variant="outline" className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getRuleValueDisplay = (rule: Rule) => {
    const config = rule.config as any

    switch (rule.ruleType) {
      case 'MAX_BUDGET':
      case 'MAX_ASSESSMENT':
      case 'MAX_BUYOUT':
        return config?.maxAmount
          ? formatCurrency(config.maxAmount, associationCurrency)
          : '-'
      case 'APPROVAL_TIERS':
        const tiers = rule.approvalTiers as any[]
        return tiers?.length ? `${tiers.length} tier(s)` : '-'
      case 'REQUIRED_EXPENSES':
        const expenses = rule.requiredExpenses as string[]
        return expenses?.length ? `${expenses.length} required` : '-'
      case 'ZERO_BALANCE':
        return config?.targetDate || 'End of season'
      case 'SIGNING_AUTHORITY':
        return config?.minSignatures ? `${config.minSignatures} signatures` : '-'
      case 'COACH_COMPENSATION':
        return config?.maxTotal
          ? formatCurrency(config.maxTotal, associationCurrency)
          : '-'
      default:
        return '-'
    }
  }

  if (rules.length === 0) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No rules configured</h3>
        <p className="text-gray-500">
          Create your first governance rule to start enforcing financial policies across teams.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50 hover:bg-gray-50">
          <TableHead className="font-semibold">Rule Name</TableHead>
          <TableHead className="font-semibold">Type</TableHead>
          <TableHead className="font-semibold">Value/Config</TableHead>
          <TableHead className="font-semibold text-center">Overrides</TableHead>
          <TableHead className="font-semibold text-center">Violations</TableHead>
          <TableHead className="font-semibold text-center">Active</TableHead>
          <TableHead className="font-semibold text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule) => (
          <TableRow key={rule.id} className={!rule.isActive ? 'opacity-50' : ''}>
            <TableCell>
              <div>
                <div className="font-medium text-gray-900">{rule.name}</div>
                {rule.description && (
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {rule.description}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>{getRuleTypeDisplay(rule.ruleType)}</TableCell>
            <TableCell className="font-medium">{getRuleValueDisplay(rule)}</TableCell>
            <TableCell className="text-center">
              {rule._count.overrides > 0 ? (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  {rule._count.overrides}
                </Badge>
              ) : (
                <span className="text-gray-400">0</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              {rule._count.violations > 0 ? (
                <Badge variant="outline" className="bg-red-50 text-red-700 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {rule._count.violations}
                </Badge>
              ) : (
                <span className="text-gray-400">0</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              <Switch
                checked={rule.isActive}
                onCheckedChange={() => handleToggleActive(rule.id, rule.isActive)}
                disabled={loadingId === rule.id}
              />
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`/association/${associationId}/rules/${rule.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Rule
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(rule.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Rule
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
