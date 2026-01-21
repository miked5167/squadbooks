'use client'

import { useEffect } from 'react'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export default function SignInPage() {
  useEffect(() => {
    // In dev mode, redirect to dashboard immediately
    if (DEV_MODE) {
      window.location.href = '/dashboard'
    }
  }, [])

  // In dev mode, show a simple message while redirecting
  if (DEV_MODE) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Dev Mode Active</h1>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  // Only import and render Clerk in production mode
  const { SignIn } = require('@clerk/nextjs')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl'
          }
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        redirectUrl="/dashboard"
      />
    </div>
  )
}
