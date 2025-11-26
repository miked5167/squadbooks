/**
 * Audit & Compliance Page
 * View audit logs and compliance information (Treasurer/Auditor only)
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ScrollText, Download, Filter, Search } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

interface AuditLogEntry {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  changes: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function AuditPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)

  // Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [userId, setUserId] = useState('')
  const [action, setAction] = useState('')

  // Fetch audit logs
  useEffect(() => {
    fetchLogs()
  }, [offset])

  async function fetchLogs() {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })

      if (startDate) params.append('startDate', new Date(startDate).toISOString())
      if (endDate) params.append('endDate', new Date(endDate).toISOString())
      if (userId) params.append('userId', userId)
      if (action) params.append('action', action)

      const res = await fetch(`/api/settings/audit-log?${params}`)
      if (!res.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      const data = await res.json()

      // Check if audit log is not yet implemented
      if (data.message) {
        toast({
          title: 'Feature Not Yet Available',
          description: data.message,
          variant: 'default',
        })
      }

      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load audit logs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleFilter() {
    setOffset(0)
    fetchLogs()
  }

  function handleReset() {
    setStartDate('')
    setEndDate('')
    setUserId('')
    setAction('')
    setOffset(0)
    fetchLogs()
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                <ScrollText className="w-6 h-6" />
                Audit & Compliance
              </h2>
              <p className="text-sm text-navy/60 mt-1">
                View and export audit logs for compliance purposes
              </p>
            </div>
            <Button variant="outline" disabled>
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="m-6">
          <ScrollText className="h-4 w-4" />
          <AlertTitle>Audit Trail</AlertTitle>
          <AlertDescription className="text-sm">
            All administrative actions, financial transactions, and user changes are logged for
            audit purposes. Logs are retained for compliance and can be exported for external
            review.
          </AlertDescription>
        </Alert>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-navy" />
            <h3 className="font-semibold text-navy">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-sm">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="text-sm">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="action" className="text-sm">
                Action Type
              </Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="REJECT">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Apply
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          {logs.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-navy">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-navy">{log.user.name}</div>
                      <div className="text-xs text-navy/60">{log.user.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-navy">
                      {log.entityType}
                    </td>
                    <td className="px-6 py-4 text-sm text-navy/60">
                      <pre className="text-xs max-w-xs overflow-hidden text-ellipsis">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <ScrollText className="w-12 h-12 mx-auto text-navy/20 mb-4" />
              <p className="text-navy/60 mb-2">No audit logs found</p>
              <p className="text-sm text-navy/40">
                Audit logs will appear here once the AuditLog model is implemented in the
                database
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-navy/60">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} logs
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + limit >= total}
                onClick={() => setOffset(offset + limit)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
