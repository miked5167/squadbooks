'use client'

import { CheckCircle, AlertTriangle, XCircle, Users, TrendingUp } from 'lucide-react'

interface ComplianceOverviewProps {
  stats: {
    totalTeams: number
    compliant: number
    atRisk: number
    nonCompliant: number
    averageScore: number
    totalViolations: number
  } | null
}

export function ComplianceOverview({ stats }: ComplianceOverviewProps) {
  if (!stats) {
    return (
      <div className="p-8 text-center text-gray-500">
        Unable to load compliance statistics
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Teams',
      value: stats.totalTeams,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'Compliant',
      value: stats.compliant,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
      subtext: stats.totalTeams > 0
        ? `${Math.round((stats.compliant / stats.totalTeams) * 100)}%`
        : '0%',
    },
    {
      title: 'Needs Attention',
      value: stats.atRisk,
      icon: AlertTriangle,
      color: 'bg-yellow-50 text-yellow-600',
      iconBg: 'bg-yellow-100',
    },
    {
      title: 'At Risk',
      value: stats.nonCompliant,
      icon: XCircle,
      color: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-100',
    },
    {
      title: 'Average Score',
      value: Math.round(stats.averageScore),
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
      suffix: '%',
    },
    {
      title: 'Active Violations',
      value: stats.totalViolations,
      icon: AlertTriangle,
      color: stats.totalViolations > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-600',
      iconBg: stats.totalViolations > 0 ? 'bg-orange-100' : 'bg-gray-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={`${card.color} rounded-lg p-4 border`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-80">{card.title}</span>
              <div className={`${card.iconBg} p-1.5 rounded-full`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{card.value}</span>
              {card.suffix && <span className="text-lg">{card.suffix}</span>}
              {card.subtext && (
                <span className="text-sm opacity-70 ml-1">({card.subtext})</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
