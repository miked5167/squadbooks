'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

interface DemoButtonProps {
  href: string
  variant: 'reset' | 'view'
  icon: 'setup' | 'dashboard'
  title: string
  description: string
  loadEndpoint?: string
}

function DemoButton({ href, variant, icon, title, description, loadEndpoint }: DemoButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    // For view variants with load endpoints, call the API first
    if (variant === 'view' && loadEndpoint) {
      e.preventDefault()
      setLoading(true)
      try {
        const response = await fetch(loadEndpoint, {
          method: 'POST',
        })
        const data = await response.json()

        if (response.ok) {
          toast.success(data.message || 'Demo loaded')
          window.location.href = data.redirectTo || href
        } else {
          toast.error(data.error || 'Failed to load demo')
          setLoading(false)
        }
      } catch (error) {
        console.error('Load demo error:', error)
        toast.error('An error occurred')
        setLoading(false)
      }
    }
    // For reset variants, just navigate (will need manual reset via DEV_MODE)
  }

  const isReset = variant === 'reset'
  const bgColor = isReset ? 'bg-white border-2 border-navy' : 'bg-gradient-to-r from-navy to-navy-medium'
  const textColor = isReset ? 'text-navy' : 'text-white'
  const hoverEffect = isReset ? 'hover:bg-navy/5' : 'hover:shadow-lg'

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`block w-full px-4 py-3 ${bgColor} ${textColor} rounded-lg ${hoverEffect} transition-all duration-300 group ${loading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icon === 'setup' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-0.5">{title}</div>
          <div className={`text-xs ${isReset ? 'text-navy/70' : 'text-white/80'}`}>
            {description}
          </div>
        </div>
        <div className="flex-shrink-0">
          {loading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-medium to-navy flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/huddlebooks-logo.png"
              alt="HuddleBooks"
              width={200}
              height={80}
              className="h-20 w-auto mx-auto mb-4"
            />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-golden/10 rounded-full text-golden border border-golden/30 text-sm font-medium mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Private Demo Access
            </div>
            <h1 className="text-3xl font-bold text-navy mb-2">
              Welcome to HuddleBooks
            </h1>
            <p className="text-navy/70">
              This page is intended for private demos.
            </p>
          </div>

          {/* Demo Options */}
          <div className="space-y-4">
            {/* Association Demos */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-semibold text-navy">Association Demos</span>
              </div>

              <DemoButton
                href="/association/onboarding"
                variant="reset"
                icon="setup"
                title="Demo: Association Setup"
                description="Reset and walk through the 5-step association onboarding wizard"
              />

              <DemoButton
                href="/association"
                variant="view"
                icon="dashboard"
                title="View Sample Association"
                description="Explore a pre-populated association dashboard with demo data"
                loadEndpoint="/api/dev/load-demo-association"
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
            </div>

            {/* Team Demos */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-semibold text-navy">Team Demos</span>
              </div>

              <DemoButton
                href="/onboarding"
                variant="reset"
                icon="setup"
                title="Demo: Team Setup"
                description="Reset and walk through the 4-step team treasurer onboarding wizard"
              />

              <DemoButton
                href="/dashboard"
                variant="view"
                icon="dashboard"
                title="View Sample Team"
                description="Explore a pre-populated team dashboard with demo data"
                loadEndpoint="/api/dev/load-demo-team"
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">or</span>
              </div>
            </div>

            {/* Sign In Button */}
            <Link
              href="/sign-in"
              className="block w-full px-6 py-4 bg-gradient-to-r from-navy to-navy-medium text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 text-center group"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Sign In</span>
                <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-900 font-medium mb-1">Demo Guide</p>
                <p className="text-sm text-blue-700">
                  <strong>Setup Demos:</strong> Walk through the onboarding wizard step-by-step (requires DEV_MODE reset first).
                  <br />
                  <strong>Sample Views:</strong> Jump directly into a pre-populated dashboard with demo data.
                </p>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-navy/60 hover:text-navy transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Need help? Contact your HuddleBooks representative.
          </p>
        </div>
      </div>
    </div>
  )
}
