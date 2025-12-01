'use client'

import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Users, AlertCircle } from 'lucide-react'

interface ComplianceStats {
  totalTeams: number
  compliant: number
  atRisk: number
  nonCompliant: number
  averageScore: number
  totalViolations: number
}

interface ComplianceOverviewProps {
  stats: ComplianceStats | null
}

export function ComplianceOverview({ stats }: ComplianceOverviewProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  const complianceRate = stats.totalTeams > 0
    ? Math.round((stats.compliant / stats.totalTeams) * 100)
    : 100

  const statCards = [
    {
      label: 'Total Teams',
      value: stats.totalTeams,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Compliant',
      value: stats.compliant,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `${complianceRate}% compliance rate`,
    },
    {
      label: 'At Risk',
      value: stats.atRisk,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Non-Compliant',
      value: stats.nonCompliant,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Average Score',
      value: Math.round(stats.averageScore),
      suffix: '/100',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Active Violations',
      value: stats.totalViolations,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              {stat.suffix && (
                <p className="text-lg font-medium text-gray-500">{stat.suffix}</p>
              )}
            </div>
            {stat.subtitle && (
              <p className="text-sm text-gray-500 mt-2">{stat.subtitle}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
