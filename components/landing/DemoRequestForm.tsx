'use client'

import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'

const demoRequestSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['association', 'team'], { required_error: 'Please select your role' }),
  message: z.string().optional(),
})

type DemoRequestData = z.infer<typeof demoRequestSchema>

export function DemoRequestForm() {
  const [formData, setFormData] = useState<DemoRequestData>({
    name: '',
    email: '',
    role: 'team' as const,
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    const validation = demoRequestSchema.safeParse(formData)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      toast.error(firstError.message)
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Implement API endpoint for demo requests
      // For now, simulate submission
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('Demo request:', validation.data)

      setSubmitted(true)
      toast.success("Demo request received! We'll be in touch soon.")

      // Reset form after 5 seconds
      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          name: '',
          email: '',
          role: 'team',
          message: '',
        })
      }, 5000)
    } catch (error) {
      console.error('Demo request error:', error)
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-navy mb-2">Request Received!</h3>
        <p className="text-navy/70">
          Thanks for your interest. We'll reach out soon to schedule your demo.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="demo-name" className="block text-sm font-medium text-navy mb-2">
          Name *
        </label>
        <input
          id="demo-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your full name"
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed text-navy placeholder:text-gray-500"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="demo-email" className="block text-sm font-medium text-navy mb-2">
          Email *
        </label>
        <input
          id="demo-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your.email@example.com"
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed text-navy placeholder:text-gray-500"
          required
        />
      </div>

      {/* Role */}
      <div>
        <label htmlFor="demo-role" className="block text-sm font-medium text-navy mb-2">
          I represent a... *
        </label>
        <select
          id="demo-role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as 'association' | 'team' })}
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed text-navy"
          required
        >
          <option value="team">Hockey Team</option>
          <option value="association">Hockey Association</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="demo-message" className="block text-sm font-medium text-navy mb-2">
          Message (optional)
        </label>
        <textarea
          id="demo-message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us about your team or association..."
          rows={4}
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed text-navy placeholder:text-gray-500 resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-8 py-4 bg-golden text-navy font-semibold rounded-lg hover:bg-golden/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        {isSubmitting ? 'Submitting...' : 'Request Demo'}
      </button>
    </form>
  )
}
