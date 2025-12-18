'use client'

import { useState, useEffect } from 'react'
import { Receipt, CheckCircle2 } from 'lucide-react'

interface TeamReceiptOverrideProps {
  teamId: string
}

interface ReceiptOverrideData {
  teamId: string
  receiptGlobalThresholdOverrideCents: number | null
  association: {
    id: string
    name: string
    receiptsEnabled: boolean
    receiptGlobalThresholdCents: number
    receiptGracePeriodDays: number
    allowedTeamThresholdOverride: boolean
  }
}

export function TeamReceiptOverride({ teamId }: TeamReceiptOverrideProps) {
  const [data, setData] = useState<ReceiptOverrideData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [overrideValue, setOverrideValue] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/receipt-override`)
      if (response.ok) {
        const result: ReceiptOverrideData = await response.json()
        setData(result)
        setOverrideValue(
          result.receiptGlobalThresholdOverrideCents !== null
            ? (result.receiptGlobalThresholdOverrideCents / 100).toFixed(2)
            : ''
        )
      }
    } catch (error) {
      console.error('Error fetching receipt override:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!data) return

    setIsSaving(true)
    setMessage(null)

    try {
      const overrideCents = overrideValue ? Math.round(parseFloat(overrideValue) * 100) : null

      const response = await fetch(`/api/teams/${teamId}/receipt-override`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptGlobalThresholdOverrideCents: overrideCents,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Receipt threshold updated successfully!' })
        setIsEditing(false)
        await fetchData()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update receipt threshold' })
      }
    } catch (error) {
      console.error('Error saving receipt override:', error)
      setMessage({ type: 'error', text: 'Failed to save changes. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">Loading receipt settings...</p>
      </div>
    )
  }

  if (!data || !data.association.receiptsEnabled) {
    return null // Hide if receipts are disabled at association level
  }

  if (!data.association.allowedTeamThresholdOverride) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Receipt className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">Receipt Policy</h3>
            <p className="mt-1 text-xs text-blue-700">
              Association requires receipts for expenses $
              {(data.association.receiptGlobalThresholdCents / 100).toFixed(2)} or more. Grace
              period: {data.association.receiptGracePeriodDays} days.
            </p>
            <p className="mt-2 text-xs text-blue-600 italic">
              Team overrides are not allowed by the association.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const associationThreshold = data.association.receiptGlobalThresholdCents / 100
  const currentOverride = data.receiptGlobalThresholdOverrideCents
  const effectiveThreshold = currentOverride !== null ? currentOverride / 100 : associationThreshold

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Team Receipt Threshold</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Association Policy */}
        <div className="rounded bg-gray-50 p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Association Threshold:</span> $
            {associationThreshold.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Grace period: {data.association.receiptGracePeriodDays} days
          </p>
        </div>

        {/* Team Override */}
        {isEditing ? (
          <div>
            <label htmlFor="teamOverride" className="mb-1 block text-xs font-medium text-gray-700">
              Team Threshold (must be ≤ ${associationThreshold.toFixed(2)})
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                id="teamOverride"
                value={overrideValue}
                onChange={e => setOverrideValue(e.target.value)}
                step="0.01"
                min="0"
                max={associationThreshold}
                placeholder={associationThreshold.toFixed(2)}
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to use association threshold. Lower amount = stricter requirement.
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setOverrideValue(
                    currentOverride !== null ? (currentOverride / 100).toFixed(2) : ''
                  )
                  setMessage(null)
                }}
                disabled={isSaving}
                className="flex-1 rounded bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm text-gray-900">
              <span className="font-medium">Effective Threshold:</span> $
              {effectiveThreshold.toFixed(2)}
              {currentOverride !== null && (
                <span className="ml-2 text-xs text-green-600">(Team override active)</span>
              )}
            </p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`rounded p-2 text-xs ${
              message.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-800'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
