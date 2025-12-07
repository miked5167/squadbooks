'use client'

import { useState } from 'react'
import { updateAssociation, type UpdateAssociationPayload } from '../actions'
import { SUPPORTED_CURRENCIES, getCurrencyFromCountry } from '@/lib/utils/currency'

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
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Association Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            This will be used as the default currency for all budgets and financial reports
          </p>
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

        {/* Pre-Season Budget Configuration Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Pre-Season Budget Configuration
          </h3>
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

            {/* Number of Budgets Required */}
            <div>
              <label
                htmlFor="preSeasonBudgetsRequired"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Number of Budget Submissions Required
              </label>
              <input
                type="number"
                id="preSeasonBudgetsRequired"
                value={formData.preSeasonBudgetsRequired || ''}
                onChange={e => handleChange('preSeasonBudgetsRequired', e.target.value)}
                min="0"
                placeholder="Leave empty for no requirement"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Number of budget submissions each team must submit (leave empty to not enforce)
              </p>
            </div>

            {/* Auto-Approve Budgets */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="preSeasonBudgetAutoApprove"
                  checked={formData.preSeasonBudgetAutoApprove}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, preSeasonBudgetAutoApprove: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Auto-approve submitted budgets
                  </span>
                  <p className="text-xs text-gray-500">
                    Automatically approve pre-season budgets when teams submit them
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mt-4 rounded-md p-3 ${
              message.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-800'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Last Updated */}
        <div className="border-t border-gray-100 pt-2">
          <p className="text-xs text-gray-500" suppressHydrationWarning>
            Last updated: {new Date(association.updatedAt).toLocaleString()}
          </p>
        </div>
      </form>
    </div>
  )
}
