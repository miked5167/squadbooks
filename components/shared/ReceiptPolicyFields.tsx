'use client'

import { Receipt } from 'lucide-react'

export interface ReceiptPolicyFieldsData {
  receiptsEnabled: boolean
  receiptGlobalThresholdCents: number
  receiptGracePeriodDays: number
  allowedTeamThresholdOverride: boolean
}

interface ReceiptPolicyFieldsProps {
  data: ReceiptPolicyFieldsData
  onChange: (data: ReceiptPolicyFieldsData) => void
  showHeader?: boolean
  compact?: boolean
}

export function ReceiptPolicyFields({
  data,
  onChange,
  showHeader = true,
  compact = false,
}: ReceiptPolicyFieldsProps) {
  const centsToDollars = (cents: number) => (cents / 100).toFixed(2)
  const dollarsToCents = (dollars: string) => Math.round(parseFloat(dollars || '0') * 100)

  const updateField = <K extends keyof ReceiptPolicyFieldsData>(
    field: K,
    value: ReceiptPolicyFieldsData[K]
  ) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {showHeader && (
        <div className={compact ? 'mb-3' : 'mb-4'}>
          <div className="mb-2 flex items-center gap-2">
            <Receipt className={compact ? 'h-4 w-4 text-blue-600' : 'h-5 w-5 text-blue-600'} />
            <h3 className={compact ? 'text-base font-semibold text-gray-900' : 'text-lg font-bold text-gray-900'}>
              Receipt Requirements
            </h3>
          </div>
          <p className="text-xs text-gray-600">
            Configure receipt requirements for team expenses
          </p>
        </div>
      )}

      {/* Enable Receipt Requirements */}
      <div>
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={data.receiptsEnabled}
            onChange={e => updateField('receiptsEnabled', e.target.checked)}
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

      {/* Conditional Fields - Only show when receipts are enabled */}
      {data.receiptsEnabled && (
        <>
          {/* Global Receipt Threshold */}
          <div>
            <label htmlFor="receiptThreshold" className="mb-1 block text-sm font-medium text-gray-700">
              Receipt Required for Expenses Over
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                id="receiptThreshold"
                value={centsToDollars(data.receiptGlobalThresholdCents)}
                onChange={e =>
                  updateField('receiptGlobalThresholdCents', dollarsToCents(e.target.value))
                }
                step="0.01"
                min="0"
                className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Receipts required for all expenses equal to or above this amount
            </p>
          </div>

          {/* Grace Period */}
          <div>
            <label htmlFor="gracePeriod" className="mb-1 block text-sm font-medium text-gray-700">
              Grace Period (days)
            </label>
            <input
              type="number"
              id="gracePeriod"
              value={data.receiptGracePeriodDays}
              onChange={e => updateField('receiptGracePeriodDays', parseInt(e.target.value || '0'))}
              min="0"
              max="365"
              className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                checked={data.allowedTeamThresholdOverride}
                onChange={e => updateField('allowedTeamThresholdOverride', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Allow teams to set stricter receipt requirements
                </span>
                <p className="mt-1 text-xs text-gray-500">
                  Teams can lower the threshold (require receipts for smaller amounts), but cannot
                  make it less strict
                </p>
              </div>
            </label>
          </div>

          {/* Info Note */}
          {!compact && (
            <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs text-blue-800">
                <strong>Recommended:</strong> $100 threshold with 7-day grace period works for most
                associations. You can adjust these settings later in Association Settings.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
