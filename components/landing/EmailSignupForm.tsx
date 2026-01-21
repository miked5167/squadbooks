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
      const response = await fetch('/api/landing/email-signup', {
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
        toast.success('Thanks for signing up! Check your email for confirmation.')

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
      <div
        className={`text-meadow flex items-center justify-center gap-2 font-medium ${className}`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Thanks! Check your email.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={isSubmitting}
          className="focus:ring-golden text-navy flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none placeholder:text-gray-500 focus:border-transparent focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-golden text-navy hover:bg-golden/90 rounded-lg px-8 py-3 font-semibold whitespace-nowrap transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Signing up...' : 'Get Notified'}
        </button>
      </div>
    </form>
  )
}
