'use client'

import { useState, useEffect } from 'react'
import { Receipt, AlertTriangle } from 'lucide-react'

interface ReceiptPolicyFormProps {
  associationId: string
}

interface ReceiptPolicyData {
  receiptsEnabled: boolean
  receiptGlobalThresholdCents: number
  receiptGracePeriodDays: number
  receiptCategoryThresholdsEnabled: boolean
  receiptCategoryOverrides: Record<string, { thresholdCents?: number; exempt?: boolean }>
  allowedTeamThresholdOverride: boolean
}

export default function ReceiptPolicyForm({ associationId }: ReceiptPolicyFormProps) {
  const [formData, setFormData] = useState<ReceiptPolicyData>({
    receiptsEnabled: true,
    receiptGlobalThresholdCents: 10000, // $100.00
    receiptGracePeriodDays: 7,
    receiptCategoryThresholdsEnabled: false,
    receiptCategoryOverrides: {},
    allowedTeamThresholdOverride: false,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch current receipt policy
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch(`/api/association/${associationId}/receipt-policy`)
        if (response.ok) {
          const data = await response.json()
          setFormData({
            receiptsEnabled: data.receiptsEnabled ?? true,
            receiptGlobalThresholdCents: data.receiptGlobalThresholdCents ?? 10000,
            receiptGracePeriodDays: data.receiptGracePeriodDays ?? 7,
            receiptCategoryThresholdsEnabled: data.receiptCategoryThresholdsEnabled ?? false,
            receiptCategoryOverrides: data.receiptCategoryOverrides ?? {},
            allowedTeamThresholdOverride: data.allowedTeamThresholdOverride ?? false,
          })
        }
      } catch (error) {
        console.error('Error fetching receipt policy:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPolicy()
  }, [associationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/association/${associationId}/receipt-policy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Receipt policy updated successfully!' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update receipt policy' })
      }
    } catch (error) {
      console.error('Error updating receipt policy:', error)
      setMessage({ type: 'error', text: 'Failed to update receipt policy. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const centsToDollars = (cents: number) => (cents / 100).toFixed(2)
  const dollarsToCents = (dollars: string) => Math.round(parseFloat(dollars || '0') * 100)

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Loading receipt policy...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-white p-6">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Receipt Policy</h2>
          </div>
          <p className="text-sm text-gray-600">
            Configure association-wide receipt requirements for team expenses
          </p>
        </div>

        <div className="space-y-4">
          {/* Enable Receipt Requirements */}
          <div>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.receiptsEnabled}
                onChange={e =>
                  setFormData(prev => ({ ...prev, receiptsEnabled: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Require receipts for expenses
                </span>
                <p className="mt-1 text-xs text-gray-500">
                  When disabled, receipt requirements are turned off for all teams
                </p>
              </div>
            </label>
          </div>

          {/* Global Receipt Threshold */}
          {formData.receiptsEnabled && (
            <>
              <div>
                <label
                  htmlFor="receiptThreshold"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Receipt Required for Expenses Over
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    id="receiptThreshold"
                    value={centsToDollars(formData.receiptGlobalThresholdCents)}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        receiptGlobalThresholdCents: dollarsToCents(e.target.value),
                      }))
                    }
                    step="0.01"
                    min="0"
                    className="w-32 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Receipts required for all expenses equal to or above this amount
                </p>
              </div>

              {/* Grace Period */}
              <div>
                <label
                  htmlFor="gracePeriod"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Grace Period (days)
                </label>
                <input
                  type="number"
                  id="gracePeriod"
                  value={formData.receiptGracePeriodDays}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      receiptGracePeriodDays: parseInt(e.target.value || '0'),
                    }))
                  }
                  min="0"
                  max="365"
                  className="w-32 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of days after transaction date before receipt becomes mandatory
                </p>
              </div>

              {/* Allow Team Overrides */}
              <div>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.allowedTeamThresholdOverride}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        allowedTeamThresholdOverride: e.target.checked,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">
                      Allow teams to set stricter receipt requirements
                    </span>
                    <p className="mt-1 text-xs text-gray-500">
                      Teams can lower the threshold (require receipts for smaller amounts), but
                      cannot make it less strict
                    </p>
                  </div>
                </label>
              </div>

              {/* Category-Specific Thresholds (Future Enhancement) */}
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-800">
                      Category-Specific Thresholds
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Category-specific thresholds and exemptions will be available in a future
                      update. For now, the global threshold applies to all expense categories.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Policy Note */}
          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Receipt policy changes apply immediately to new transactions.
              Existing transactions are re-validated using the grace period from their original
              transaction date.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button & Messages */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isSubmitting ? 'Saving...' : 'Save Receipt Policy'}
        </button>

        {/* Message */}
        {message && (
          <div
            className={`mt-3 rounded-md p-3 ${
              message.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-800'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </form>
  )
}
