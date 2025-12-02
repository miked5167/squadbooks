/**
 * Sentry Error Tracking Utilities
 *
 * This module provides helper functions for capturing errors and events in Sentry.
 * All functions are safe to call even if Sentry is not configured.
 */

import * as Sentry from '@sentry/nextjs'

/**
 * Capture an exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Sentry Dev]:', error, context)
  }

  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture a message with severity level
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Sentry Dev - ${level}]:`, message, context)
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  })
}

/**
 * Set user context for error tracking
 */
export function setUser(user: {
  id: string
  email?: string
  username?: string
  role?: string
}) {
  Sentry.setUser(user)
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUser() {
  Sentry.setUser(null)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}

/**
 * Start a new transaction for performance monitoring
 * Updated for Sentry v8+ which uses startSpan instead of startTransaction
 */
export function startTransaction(name: string, op: string) {
  // Sentry v8+ uses startSpan/startInactiveSpan instead of startTransaction
  // For now, we'll use startSpan if available, otherwise skip
  if ('startSpan' in Sentry) {
    return Sentry.startSpan({ name, op }, (span) => span)
  }

  // Fallback: return a mock span object
  return {
    finish: () => {},
    setStatus: () => {},
    setData: () => {},
  }
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      captureException(error as Error, {
        ...context,
        functionName: fn.name,
        arguments: args,
      })
      throw error
    }
  }) as T
}

/**
 * Higher-order function for API routes to automatically capture errors
 */
export function withSentryApiRoute<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  routeName: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      addBreadcrumb(`API route called: ${routeName}`, 'api', {
        route: routeName,
      })
      return await handler(...args)
    } catch (error) {
      captureException(error as Error, {
        route: routeName,
        type: 'api_error',
      })

      // Re-throw to let Next.js handle the error response
      throw error
    }
  }) as T
}
