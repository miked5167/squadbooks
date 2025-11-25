/**
 * Reports Page
 *
 * Allows association admins to generate PDF reports:
 * - Board Financial Summary
 * - Compliance Snapshot
 * - Report history/audit trail
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Report {
  id: string
  reportType: string
  generatedAt: string
  generatedBy: string
}

export default function ReportsPage() {
  const { userId } = useAuth()
  const [associationId, setAssociationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [boardLoading, setBoardLoading] = useState(false)
  const [complianceLoading, setComplianceLoading] = useState(false)

  // Get association ID (placeholder for now)
  useEffect(() => {
    if (userId) {
      // In production, we'd fetch this from the user's profile
      setAssociationId('temp-id') // Temporary for development
    }
  }, [userId])

  // Generate Board Summary Report
  const generateBoardSummary = async () => {
    if (!associationId) return

    setBoardLoading(true)
    try {
      const response = await fetch('/api/reports/board-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ associationId }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      // Download PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Board-Summary-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error generating board summary:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setBoardLoading(false)
    }
  }

  // Generate Compliance Snapshot Report
  const generateComplianceSnapshot = async () => {
    if (!associationId) return

    setComplianceLoading(true)
    try {
      const response = await fetch('/api/reports/compliance-snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ associationId }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      // Download PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Compliance-Snapshot-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error generating compliance snapshot:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setComplianceLoading(false)
    }
  }

  if (!userId) {
    return null
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate PDF reports for board meetings and compliance audits
        </p>
      </div>

      {/* Available Reports */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Board Financial Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Board Financial Summary</CardTitle>
                  <CardDescription>For board meetings</CardDescription>
                </div>
              </div>
              <Badge variant="outline">PDF</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">This report includes:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Total teams and health distribution</li>
                <li>Budget totals and average utilization</li>
                <li>Teams requiring immediate attention</li>
                <li>Top red flags across the association</li>
              </ul>
            </div>

            <div className="pt-2 border-t">
              <Button
                className="w-full"
                onClick={generateBoardSummary}
                disabled={boardLoading}
              >
                {boardLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Snapshot */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Compliance Snapshot</CardTitle>
                  <CardDescription>For audits & compliance</CardDescription>
                </div>
              </div>
              <Badge variant="outline">PDF</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">This report includes:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Bank connection and reconciliation rates</li>
                <li>Average pending approvals per team</li>
                <li>Missing receipts summary</li>
                <li>Active alerts breakdown by type</li>
                <li>Compliance recommendations</li>
              </ul>
            </div>

            <div className="pt-2 border-t">
              <Button
                className="w-full"
                onClick={generateComplianceSnapshot}
                disabled={complianceLoading}
              >
                {complianceLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <CardTitle className="text-blue-900">Report Generation Tips</CardTitle>
              <CardDescription className="text-blue-700">
                Best practices for using reports
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-2">
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Reports are generated with the most recent data from the last daily snapshot</li>
            <li>Board Summary reports are ideal for monthly board meetings</li>
            <li>Compliance Snapshots should be generated quarterly for audit purposes</li>
            <li>PDFs are automatically downloaded to your default downloads folder</li>
            <li>Reports are board-ready and can be printed or shared directly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
