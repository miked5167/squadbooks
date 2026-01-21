'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { resolveViolation } from '../actions'

type Violation = {
  id: string
  severity: string
  violationType: string
  message: string
  details: any
  resolved: boolean
  resolvedAt: Date | null
  resolvedBy: string | null
  resolutionNotes: string | null
  createdAt: Date
  team: {
    id: string
    name: string
  } | null
  rule: {
    id: string
    name: string
    ruleType: string
  } | null
}

interface ViolationLogTableProps {
  violations: Violation[]
  associationId: string
}

const severityConfig: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
  CRITICAL: {
    label: 'Critical',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  ERROR: {
    label: 'Error',
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  WARNING: {
    label: 'Warning',
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  INFO: {
    label: 'Info',
    icon: AlertCircle,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
}

export function ViolationLogTable({ violations, associationId }: ViolationLogTableProps) {
  const router = useRouter()
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const getSeverityBadge = (severity: string) => {
    const config = severityConfig[severity] || severityConfig.WARNING
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleResolve = async () => {
    if (!selectedViolation) return

    setLoading(true)
    const result = await resolveViolation(
      selectedViolation.id,
      'current-user', // TODO: Get actual user ID
      resolutionNotes
    )
    setLoading(false)

    if (result.success) {
      setResolveModalOpen(false)
      setSelectedViolation(null)
      setResolutionNotes('')
      router.refresh()
    }
  }

  const openResolveModal = (violation: Violation) => {
    setSelectedViolation(violation)
    setResolutionNotes('')
    setResolveModalOpen(true)
  }

  if (violations.length === 0) {
    return (
      <div className="p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No violations</h3>
        <p className="text-gray-500">
          All teams are in compliance with governance rules.
        </p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold">Team</TableHead>
            <TableHead className="font-semibold">Rule</TableHead>
            <TableHead className="font-semibold">Severity</TableHead>
            <TableHead className="font-semibold">Message</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {violations.map((violation) => (
            <TableRow
              key={violation.id}
              className={violation.resolved ? 'opacity-60' : ''}
            >
              <TableCell className="text-gray-600">
                {format(new Date(violation.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="font-medium text-gray-900">
                {violation.team?.name || 'Unknown Team'}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">
                    {violation.rule?.name || 'Unknown Rule'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {violation.rule?.ruleType || violation.violationType}
                  </div>
                </div>
              </TableCell>
              <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
              <TableCell className="max-w-xs">
                <p className="text-sm text-gray-700 truncate">{violation.message}</p>
              </TableCell>
              <TableCell className="text-center">
                {violation.resolved ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Resolved
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 gap-1">
                    <Clock className="h-3 w-3" />
                    Open
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {!violation.resolved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openResolveModal(violation)}
                  >
                    Resolve
                  </Button>
                )}
                {violation.resolved && violation.resolutionNotes && (
                  <span className="text-xs text-gray-500">
                    {format(new Date(violation.resolvedAt!), 'MMM d')}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Violation</DialogTitle>
            <DialogDescription>
              Mark this violation as resolved and add any notes about the resolution.
            </DialogDescription>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900">
                  {selectedViolation.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedViolation.team?.name} - {selectedViolation.rule?.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolutionNotes">Resolution Notes</Label>
                <Textarea
                  id="resolutionNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this violation was resolved..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setResolveModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleResolve} disabled={loading}>
                  {loading ? 'Resolving...' : 'Mark as Resolved'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
