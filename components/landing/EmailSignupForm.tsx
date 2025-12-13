'use client'

import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'

const emailSchema = z.string().email('Please enter a valid email address')

interface EmailSignupFormProps {
  source?: string
  className?: string
}

export function EmailSignupForm({ source = 'landing_hero', className = '' }: EmailSignupFormProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    const validation = emailSchema.safeParse(email)
    if (!validation.success) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: validation.data,
          source,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSubmitted(true)
        setEmail('')
        toast.success("Thanks for signing up! Check your email for confirmation.")

        // Reset submitted state after 5 seconds
        setTimeout(() => setSubmitted(false), 5000)
      } else {
        toast.error(data.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Failed to sign up. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className={`flex items-center justify-center gap-2 text-meadow font-medium ${className}`}>
        <svg
          className="w-5 h-5"
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
        <span>Thanks! Check your email.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed text-navy placeholder:text-gray-500"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-golden text-navy font-semibold rounded-lg hover:bg-golden/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isSubmitting ? 'Signing up...' : 'Get Notified'}
        </button>
      </div>
    </form>
  )
}
