'use client'

import { useState } from 'react'
import { updateAssociation, type UpdateAssociationPayload } from '../actions'
import { SUPPORTED_CURRENCIES, getCurrencyFromCountry } from '@/lib/utils/currency'
import { Shield, AlertTriangle } from 'lucide-react'

interface AssociationSettingsFormProps {
  association: {
    id: string
    name: string
    abbreviation: string | null
    provinceState: string | null
    country: string | null
    currency: string
    season: string | null
    logoUrl: string | null
    preSeasonBudgetDeadline: Date | null
    preSeasonBudgetsRequired: number | null
    preSeasonBudgetAutoApprove: boolean
    createdAt: Date
    updatedAt: Date
  }
  associationId: string
}

export default function AssociationSettingsForm({
  association,
  associationId,
}: AssociationSettingsFormProps) {
  const [formData, setFormData] = useState<UpdateAssociationPayload>({
    name: association.name,
    abbreviation: association.abbreviation || '',
    provinceState: association.provinceState || '',
    country: association.country || '',
    currency: association.currency || 'CAD',
    season: association.season || '',
    logoUrl: association.logoUrl || '',
    preSeasonBudgetDeadline: association.preSeasonBudgetDeadline
      ? new Date(association.preSeasonBudgetDeadline).toISOString().slice(0, 16)
      : '',
    preSeasonBudgetsRequired: association.preSeasonBudgetsRequired?.toString() || '',
    preSeasonBudgetAutoApprove: association.preSeasonBudgetAutoApprove,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      await updateAssociation(associationId, formData)
      setMessage({ type: 'success', text: 'Association settings updated successfully!' })
    } catch (error) {
      console.error('Error updating association:', error)
      setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof UpdateAssociationPayload, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // Auto-suggest currency when country changes
      if (field === 'country' && value) {
        const suggestedCurrency = getCurrencyFromCountry(value)
        updated.currency = suggestedCurrency
      }

      return updated
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section A: Association Profile */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Association Profile</h2>
          <p className="mt-1 text-sm text-gray-600">
            Basic identity and default settings for your association
          </p>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name || ''}
              onChange={e => handleChange('name', e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Abbreviation */}
          <div>
            <label htmlFor="abbreviation" className="mb-1 block text-sm font-medium text-gray-700">
              Abbreviation
            </label>
            <input
              type="text"
              id="abbreviation"
              value={formData.abbreviation || ''}
              onChange={e => handleChange('abbreviation', e.target.value)}
              maxLength={32}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Province / State */}
          <div>
            <label htmlFor="provinceState" className="mb-1 block text-sm font-medium text-gray-700">
              Province / State
            </label>
            <input
              type="text"
              id="provinceState"
              value={formData.provinceState || ''}
              onChange={e => handleChange('provinceState', e.target.value)}
              maxLength={64}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="mb-1 block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              type="text"
              id="country"
              value={formData.country || ''}
              onChange={e => handleChange('country', e.target.value)}
              maxLength={64}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="mb-1 block text-sm font-medium text-gray-700">
              Currency <span className="text-red-500">*</span>
            </label>
            <select
              id="currency"
              value={formData.currency || 'CAD'}
              onChange={e => handleChange('currency', e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {SUPPORTED_CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} - {curr.name} ({curr.symbol})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Default currency for all budgets and financial reports
            </p>
            <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <strong>Warning:</strong> Changing currency after budgets exist may impact reporting and historical data.
              </p>
            </div>
          </div>

          {/* Season */}
          <div>
            <label htmlFor="season" className="mb-1 block text-sm font-medium text-gray-700">
              Season
            </label>
            <input
              type="text"
              id="season"
              value={formData.season || ''}
              onChange={e => handleChange('season', e.target.value)}
              maxLength={32}
              placeholder="e.g., 2025-2026"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label htmlFor="logoUrl" className="mb-1 block text-sm font-medium text-gray-700">
              Logo URL
            </label>
            <input
              type="url"
              id="logoUrl"
              value={formData.logoUrl || ''}
              onChange={e => handleChange('logoUrl', e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section D: Governance - Pre-Season Budget Rules */}
      <div className="rounded-lg border border-blue-200 bg-white p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Governance: Pre-Season Budget Rules</h2>
          </div>
          <p className="text-sm text-gray-600">
            Policy-level controls for team budget submissions and approvals
          </p>
        </div>

        <div className="space-y-4">
          {/* Budget Submission Deadline */}
          <div>
            <label
              htmlFor="preSeasonBudgetDeadline"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Budget Submission Deadline
            </label>
            <input
              type="datetime-local"
              id="preSeasonBudgetDeadline"
              value={formData.preSeasonBudgetDeadline || ''}
              onChange={e => handleChange('preSeasonBudgetDeadline', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Teams must submit their pre-season budgets before this date
            </p>
          </div>

          {/* Auto-Approve Budgets */}
          <div>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="preSeasonBudgetAutoApprove"
                checked={formData.preSeasonBudgetAutoApprove}
                onChange={e =>
                  setFormData(prev => ({ ...prev, preSeasonBudgetAutoApprove: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Automatically approve compliant pre-season budgets
                </span>
                <p className="mt-1 text-xs text-gray-500">
                  Budgets that meet active association policies are approved automatically. Exceptions require review.
                </p>
              </div>
            </label>
          </div>

          {/* Policy Note */}
          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Policy changes apply to future submissions and budget updates.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button & Messages - Sticky Footer Style */}
      <div className="sticky bottom-0 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
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

        {/* Last Updated */}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <p className="text-xs text-gray-500 text-center" suppressHydrationWarning>
            Last updated: {new Date(association.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </form>
  )
}
