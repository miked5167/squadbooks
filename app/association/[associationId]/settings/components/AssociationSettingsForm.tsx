'use client'

import { useState } from 'react'
import { updateAssociation, type UpdateAssociationPayload } from '../actions'

interface AssociationSettingsFormProps {
  association: {
    id: string
    name: string
    abbreviation: string | null
    provinceState: string | null
    country: string | null
    season: string | null
    logoUrl: string | null
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
    season: association.season || '',
    logoUrl: association.logoUrl || '',
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
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Association Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Abbreviation */}
        <div>
          <label htmlFor="abbreviation" className="block text-sm font-medium text-gray-700 mb-1">
            Abbreviation
          </label>
          <input
            type="text"
            id="abbreviation"
            value={formData.abbreviation || ''}
            onChange={(e) => handleChange('abbreviation', e.target.value)}
            maxLength={32}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Province / State */}
        <div>
          <label htmlFor="provinceState" className="block text-sm font-medium text-gray-700 mb-1">
            Province / State
          </label>
          <input
            type="text"
            id="provinceState"
            value={formData.provinceState || ''}
            onChange={(e) => handleChange('provinceState', e.target.value)}
            maxLength={64}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            id="country"
            value={formData.country || ''}
            onChange={(e) => handleChange('country', e.target.value)}
            maxLength={64}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Season */}
        <div>
          <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1">
            Season
          </label>
          <input
            type="text"
            id="season"
            value={formData.season || ''}
            onChange={(e) => handleChange('season', e.target.value)}
            maxLength={32}
            placeholder="e.g., 2025-2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Logo URL */}
        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Logo URL
          </label>
          <input
            type="url"
            id="logoUrl"
            value={formData.logoUrl || ''}
            onChange={(e) => handleChange('logoUrl', e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Last Updated */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Last updated: {new Date(association.updatedAt).toLocaleString()}
          </p>
        </div>
      </form>
    </div>
  )
}
