/**
 * Hooks for managing exceptions (validation-first workflow)
 */

import { useState, useEffect, useCallback } from 'react'
import type { TransactionWithValidation, ResolveExceptionInput } from '@/lib/types/exceptions'
import { toast } from 'sonner'

export function useExceptions() {
  const [transactions, setTransactions] = useState<TransactionWithValidation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/exceptions')
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const refetch = useCallback(async () => {
    await fetchTransactions()
  }, [fetchTransactions])

  return {
    transactions,
    loading,
    error,
    refetch,
  }
}

export function useResolveException() {
  const [loading, setLoading] = useState(false)

  const resolve = useCallback(async (input: ResolveExceptionInput): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await fetch('/api/exceptions/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to resolve exception')
      }

      toast.success('Exception resolved successfully')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { resolve, loading }
}
