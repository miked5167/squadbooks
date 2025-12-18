'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react'

interface Approval {
  id: string
  status: string
  createdAt: string
  comment?: string
  transaction: {
    id: string
    type: string
    amount: number
    vendor: string
    description?: string
    transactionDate: string
    category: {
      name: string
      heading: string
      color: string
    }
    creator: {
      name: string
      email: string
    }
  }
}

export default function ApprovalsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, string>>({})

  // Fetch approvals
  useEffect(() => {
    async function fetchApprovals() {
      try {
        const res = await fetch('/api/approvals?status=pending')
        if (res.ok) {
          const data = await res.json()
          setApprovals(data.approvals)
        } else {
          toast.error('Failed to load approvals')
        }
      } catch (err) {
        console.error('Failed to fetch approvals:', err)
        toast.error('Failed to load approvals')
      } finally {
        setLoading(false)
      }
    }
    fetchApprovals()
  }, [])

  // Highlight specific approval if coming from email
  useEffect(() => {
    const highlightId = searchParams?.get('highlight')
    if (highlightId && !loading) {
      const element = document.getElementById(`approval-${highlightId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.classList.add('ring-2', 'ring-meadow', 'ring-offset-2')
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-meadow', 'ring-offset-2')
        }, 3000)
      }
    }
  }, [searchParams, loading])

  const handleApprove = async (approvalId: string) => {
    setProcessingId(approvalId)
    try {
      const res = await fetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: comments[approvalId] || undefined,
        }),
      })

      if (res.ok) {
        toast.success('Transaction approved!')
        // Remove from list
        setApprovals(approvals.filter(a => a.id !== approvalId))
        // Clear comment
        setComments({ ...comments, [approvalId]: '' })
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to approve transaction')
      }
    } catch (err) {
      console.error('Failed to approve:', err)
      toast.error('Failed to approve transaction')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (approvalId: string) => {
    const comment = comments[approvalId]
    if (!comment || comment.trim().length === 0) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setProcessingId(approvalId)
    try {
      const res = await fetch(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: comment.trim(),
        }),
      })

      if (res.ok) {
        toast.success('Transaction rejected')
        // Remove from list
        setApprovals(approvals.filter(a => a.id !== approvalId))
        // Clear comment
        setComments({ ...comments, [approvalId]: '' })
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to reject transaction')
      }
    } catch (err) {
      console.error('Failed to reject:', err)
      toast.error('Failed to reject transaction')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <AppSidebar />
        <main className="ml-64 px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-navy" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppSidebar />

      {/* Main Content */}
      <main className="ml-64 px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-navy hover:text-navy-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-2 text-navy mb-2">Pending Approvals</h1>
          <p className="text-lg text-navy/70">
            Review and approve or reject expense transactions over $200
          </p>
        </div>

        {/* Approvals List */}
        {approvals.length === 0 ? (
          <Card className="border-0 shadow-card">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">All caught up!</h3>
                <p className="text-navy/60">
                  No pending approvals at this time
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {approvals.map((approval) => (
              <Card
                key={approval.id}
                id={`approval-${approval.id}`}
                className="border-0 shadow-card transition-all"
              >
                <CardHeader className="bg-gradient-to-r from-golden/10 to-golden/5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-golden" />
                        <CardTitle className="text-xl text-navy">
                          ${Number(approval.transaction.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </CardTitle>
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold text-white"
                          style={{ backgroundColor: approval.transaction.category.color }}
                        >
                          {approval.transaction.category.name}
                        </span>
                      </div>
                      <CardDescription className="text-base">
                        {approval.transaction.type} • {approval.transaction.vendor}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Transaction Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-cream rounded-lg">
                    <div>
                      <span className="text-sm text-navy/60 block mb-1">Created By</span>
                      <span className="text-navy font-medium">
                        {approval.transaction.creator.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-navy/60 block mb-1">Transaction Date</span>
                      <span className="text-navy font-medium">
                        {new Date(approval.transaction.transactionDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-navy/60 block mb-1">Category</span>
                      <span className="text-navy font-medium">
                        {approval.transaction.category.heading} → {approval.transaction.category.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-navy/60 block mb-1">Submitted</span>
                      <span className="text-navy font-medium">
                        {new Date(approval.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {approval.transaction.description && (
                      <div className="md:col-span-2">
                        <span className="text-sm text-navy/60 block mb-1">Description</span>
                        <p className="text-navy">{approval.transaction.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Comment/Reason */}
                  <div className="mb-4">
                    <Label htmlFor={`comment-${approval.id}`} className="mb-2 flex items-center gap-2">
                      <span>Comment (Optional for approval, required for rejection)</span>
                      {comments[approval.id] && comments[approval.id].trim().length === 0 && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Required for rejection
                        </span>
                      )}
                    </Label>
                    <Textarea
                      id={`comment-${approval.id}`}
                      rows={2}
                      maxLength={500}
                      value={comments[approval.id] || ''}
                      onChange={(e) =>
                        setComments({ ...comments, [approval.id]: e.target.value })
                      }
                      placeholder="Add a comment or reason for your decision..."
                      disabled={processingId === approval.id}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(approval.id)}
                      disabled={processingId !== null}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processingId === approval.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(approval.id)}
                      disabled={processingId !== null}
                      variant="destructive"
                      className="flex-1"
                    >
                      {processingId === approval.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-navy/20 text-navy hover:bg-navy/5"
                    >
                      <Link href={`/transactions/${approval.transaction.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
