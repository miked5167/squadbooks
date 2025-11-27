import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { PendingApproval, PendingApprovalWithRisk } from '../types/approvals'
import { calculateRiskLevel } from '../utils/approval-risk'

/**
 * Hook to fetch pending approvals
 */
export function usePendingApprovals() {
  const [approvals, setApprovals] = useState<PendingApprovalWithRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/approvals?status=pending')

      if (!res.ok) {
        throw new Error('Failed to load approvals')
      }

      const data = await res.json()

      // Add risk calculation to each approval
      const approvalsWithRisk = (data.approvals as PendingApproval[]).map(calculateRiskLevel)

      setApprovals(approvalsWithRisk)
    } catch (err) {
      console.error('Failed to fetch approvals:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load approvals'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  return {
    approvals,
    loading,
    error,
    refetch: fetchApprovals,
  }
}

/**
 * Hook to approve a single approval
 */
export function useApproveApproval() {
  const [loading, setLoading] = useState(false)

  const approve = useCallback(async (approvalId: string, comment?: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: comment || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to approve transaction')
      }

      toast.success('Transaction approved!')
      return true
    } catch (err) {
      console.error('Failed to approve:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve transaction'
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { approve, loading }
}

/**
 * Hook to reject a single approval
 */
export function useRejectApproval() {
  const [loading, setLoading] = useState(false)

  const reject = useCallback(async (approvalId: string, comment: string) => {
    if (!comment || comment.trim().length === 0) {
      toast.error('Please provide a reason for rejection')
      return false
    }

    setLoading(true)
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

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reject transaction')
      }

      toast.success('Transaction rejected')
      return true
    } catch (err) {
      console.error('Failed to reject:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject transaction'
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { reject, loading }
}

/**
 * Hook to approve multiple approvals in bulk
 */
export function useBulkApprove() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const bulkApprove = useCallback(async (approvalIds: string[], comment?: string) => {
    setLoading(true)
    setProgress({ current: 0, total: approvalIds.length })

    const results = {
      succeeded: [] as string[],
      failed: [] as string[],
    }

    for (let i = 0; i < approvalIds.length; i++) {
      const approvalId = approvalIds[i]
      setProgress({ current: i + 1, total: approvalIds.length })

      try {
        const res = await fetch(`/api/approvals/${approvalId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: comment || undefined,
          }),
        })

        if (res.ok) {
          results.succeeded.push(approvalId)
        } else {
          results.failed.push(approvalId)
        }
      } catch (err) {
        console.error(`Failed to approve ${approvalId}:`, err)
        results.failed.push(approvalId)
      }
    }

    setLoading(false)

    // Show results
    if (results.succeeded.length === approvalIds.length) {
      toast.success(`Successfully approved ${results.succeeded.length} transactions`)
    } else if (results.succeeded.length > 0) {
      toast.warning(
        `Approved ${results.succeeded.length} of ${approvalIds.length} transactions. ${results.failed.length} failed.`
      )
    } else {
      toast.error('Failed to approve transactions')
    }

    return results
  }, [])

  return { bulkApprove, loading, progress }
}

/**
 * Hook to reject multiple approvals in bulk
 */
export function useBulkReject() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const bulkReject = useCallback(async (approvalIds: string[], comment: string) => {
    if (!comment || comment.trim().length === 0) {
      toast.error('Please provide a reason for rejection')
      return { succeeded: [], failed: approvalIds }
    }

    setLoading(true)
    setProgress({ current: 0, total: approvalIds.length })

    const results = {
      succeeded: [] as string[],
      failed: [] as string[],
    }

    for (let i = 0; i < approvalIds.length; i++) {
      const approvalId = approvalIds[i]
      setProgress({ current: i + 1, total: approvalIds.length })

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
          results.succeeded.push(approvalId)
        } else {
          results.failed.push(approvalId)
        }
      } catch (err) {
        console.error(`Failed to reject ${approvalId}:`, err)
        results.failed.push(approvalId)
      }
    }

    setLoading(false)

    // Show results
    if (results.succeeded.length === approvalIds.length) {
      toast.success(`Successfully rejected ${results.succeeded.length} transactions`)
    } else if (results.succeeded.length > 0) {
      toast.warning(
        `Rejected ${results.succeeded.length} of ${approvalIds.length} transactions. ${results.failed.length} failed.`
      )
    } else {
      toast.error('Failed to reject transactions')
    }

    return results
  }, [])

  return { bulkReject, loading, progress }
}
