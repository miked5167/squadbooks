'use client'

import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, XCircle, ChevronRight } from 'lucide-react'

type Team = {
  id: string
  name: string
  division: string | null
  healthStatus: string | null
  healthScore: number | null
  activeViolations: number
}

interface TeamComplianceTableProps {
  teams: Team[]
  associationId: string
}

const healthStatusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  healthy: {
    label: 'Compliant',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  needs_attention: {
    label: 'Needs Attention',
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  at_risk: {
    label: 'At Risk',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
}

export function TeamComplianceTable({ teams, associationId }: TeamComplianceTableProps) {
  const router = useRouter()

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
          Unknown
        </Badge>
      )
    }

    const config = healthStatusConfig[status] || healthStatusConfig.healthy
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (teams.length === 0) {
    return (
      <div className="p-8 text-center">
        <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
        <p className="text-gray-500">
          There are no active teams in this association to monitor.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50 hover:bg-gray-50">
          <TableHead className="font-semibold">Team</TableHead>
          <TableHead className="font-semibold">Division</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold text-center">Health Score</TableHead>
          <TableHead className="font-semibold text-center">Violations</TableHead>
          <TableHead className="font-semibold text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.map((team) => (
          <TableRow
            key={team.id}
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => router.push(`/association/${associationId}/teams/${team.id}`)}
          >
            <TableCell className="font-medium text-gray-900">{team.name}</TableCell>
            <TableCell className="text-gray-600">{team.division || '-'}</TableCell>
            <TableCell>{getStatusBadge(team.healthStatus)}</TableCell>
            <TableCell className="text-center">
              <span className={`font-semibold ${getScoreColor(team.healthScore)}`}>
                {team.healthScore !== null ? `${team.healthScore}%` : '-'}
              </span>
            </TableCell>
            <TableCell className="text-center">
              {team.activeViolations > 0 ? (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {team.activeViolations}
                </Badge>
              ) : (
                <span className="text-gray-400">0</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <ChevronRight className="h-4 w-4 text-gray-400 inline" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
