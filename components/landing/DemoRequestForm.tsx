'use client'

import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'

const demoRequestSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['president', 'treasurer', 'board_member', 'coach_team_treasurer', 'other'], {
    required_error: 'Please select your role',
  }),
  message: z.string().optional(),
})

type DemoRequestData = z.infer<typeof demoRequestSchema>

export function DemoRequestForm() {
  const [formData, setFormData] = useState<DemoRequestData>({
    name: '',
    email: '',
    role: 'treasurer' as const,
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
      const response = await fetch('/api/landing/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }

      setSubmitted(true)
      toast.success("Demo request received! We'll be in touch soon.")

      // Reset form after 5 seconds
      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          name: '',
          email: '',
          role: 'treasurer',
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
      <div className="rounded-xl border-2 border-green-200 bg-green-50 p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-navy mb-2 text-2xl font-bold">Request Received!</h3>
        <p className="text-navy/70">
          Thanks for your interest. We&apos;ll reach out soon to schedule your demo.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="demo-name" className="text-navy mb-2 block text-sm font-medium">
          Name *
        </label>
        <input
          id="demo-name"
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your full name"
          disabled={isSubmitting}
          className="focus:ring-golden text-navy w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none placeholder:text-gray-500 focus:border-transparent focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="demo-email" className="text-navy mb-2 block text-sm font-medium">
          Email *
        </label>
        <input
          id="demo-email"
          type="email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          placeholder="your.email@example.com"
          disabled={isSubmitting}
          className="focus:ring-golden text-navy w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none placeholder:text-gray-500 focus:border-transparent focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        />
      </div>

      {/* Role */}
      <div>
        <label htmlFor="demo-role" className="text-navy mb-2 block text-sm font-medium">
          Your Role *
        </label>
        <select
          id="demo-role"
          value={formData.role}
          onChange={e =>
            setFormData({ ...formData, role: e.target.value as DemoRequestData['role'] })
          }
          disabled={isSubmitting}
          className="focus:ring-golden text-navy w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-transparent focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="president">President</option>
          <option value="treasurer">Treasurer</option>
          <option value="board_member">Board Member</option>
          <option value="coach_team_treasurer">Coach / Team Treasurer</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="demo-message" className="text-navy mb-2 block text-sm font-medium">
          Message (optional)
        </label>
        <textarea
          id="demo-message"
          value={formData.message}
          onChange={e => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us about your team or association..."
          rows={4}
          disabled={isSubmitting}
          className="focus:ring-golden text-navy w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none placeholder:text-gray-500 focus:border-transparent focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-golden text-navy hover:bg-golden/90 w-full rounded-lg px-8 py-4 font-semibold shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Request Demo'}
      </button>
    </form>
  )
}
