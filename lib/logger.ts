/**
 * Application Logger
 *
 * Centralized logging utility that:
 * - Only logs in development mode
 * - Categorizes logs by level (debug, info, warn, error)
 * - Integrates with Sentry for error tracking
 * - Provides structured logging with context
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger'
 *
 * logger.debug('User action', { userId: '123', action: 'click' })
 * logger.info('Transaction created', { id: 'tx_123', amount: 100 })
 * logger.warn('Slow query detected', { query: 'SELECT...', duration: 5000 })
 * logger.error('Failed to process payment', { error, userId: '123' })
 * ```
 */

import { captureException, captureMessage, addBreadcrumb } from '@/lib/sentry'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  /**
   * Debug-level logging (verbose, only in development)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context || '')
    }
    this.addBreadcrumb('debug', message, context)
  }

  /**
   * Info-level logging (important events)
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context || '')
    }
    this.addBreadcrumb('info', message, context)
  }

  /**
   * Warning-level logging (recoverable issues)
   */
  warn(message: string, context?: LogContext) {
    if (this.isDevelopment || this.isTest) {
      console.warn(`[WARN] ${message}`, context || '')
    }
    this.addBreadcrumb('warning', message, context)

    // Also log to Sentry in production
    if (!this.isDevelopment && !this.isTest) {
      captureMessage(message, 'warning', context)
    }
  }

  /**
   * Error-level logging (critical issues)
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    // Always log errors to console
    console.error(`[ERROR] ${message}`, error, context || '')

    this.addBreadcrumb('error', message, { ...context, error })

    // Capture in Sentry
    if (error instanceof Error) {
      captureException(error, { message, ...context })
    } else {
      captureMessage(message, 'error', { error, ...context })
    }
  }

  /**
   * API request logging
   */
  api(
    method: string,
    path: string,
    status: number,
    duration?: number,
    context?: LogContext
  ) {
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
    const durationStr = duration ? ` (${duration}ms)` : ''

    if (this.isDevelopment) {
      const emoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅'
      console.log(
        `${emoji} ${method} ${path} - ${status}${durationStr}`,
        context || ''
      )
    }

    this.addBreadcrumb('http', `${method} ${path}`, {
      status,
      duration,
      ...context,
    })

    // Log errors to Sentry
    if (status >= 500 && !this.isDevelopment) {
      captureMessage(`API Error: ${method} ${path} - ${status}`, 'error', {
        status,
        duration,
        ...context,
      })
    }
  }

  /**
   * Database query logging
   */
  query(action: string, model: string, duration?: number, context?: LogContext) {
    if (this.isDevelopment) {
      const durationStr = duration ? ` (${duration}ms)` : ''
      const emoji = duration && duration > 1000 ? '🐌' : '⚡'
      console.log(`${emoji} DB: ${action} ${model}${durationStr}`, context || '')
    }

    this.addBreadcrumb('query', `${action} ${model}`, {
      duration,
      ...context,
    })

    // Log slow queries
    if (duration && duration > 1000 && !this.isDevelopment) {
      captureMessage(`Slow query: ${action} ${model} (${duration}ms)`, 'warning', {
        duration,
        ...context,
      })
    }
  }

  /**
   * Authentication/Authorization logging
   */
  auth(event: string, userId?: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[AUTH] ${event}`, { userId, ...context })
    }

    this.addBreadcrumb('auth', event, { userId, ...context })

    // Log auth failures to Sentry
    if (event.includes('fail') || event.includes('error')) {
      captureMessage(`Auth event: ${event}`, 'warning', { userId, ...context })
    }
  }

  /**
   * Business logic logging (important domain events)
   */
  business(event: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[BUSINESS] ${event}`, context || '')
    }

    this.addBreadcrumb('business', event, context)

    // Log to Sentry in production for audit trail
    if (!this.isDevelopment && !this.isTest) {
      captureMessage(`Business event: ${event}`, 'info', context)
    }
  }

  /**
   * Performance timing
   */
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label)
    }
  }

  timeEnd(label: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.timeEnd(label)
    }
    this.addBreadcrumb('timing', label, context)
  }

  /**
   * Group logs (for debugging complex flows)
   */
  group(label: string) {
    if (this.isDevelopment) {
      console.group(label)
    }
  }

  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd()
    }
  }

  /**
   * Add breadcrumb for debugging (always captured)
   */
  private addBreadcrumb(level: string, message: string, context?: LogContext) {
    addBreadcrumb(message, level, context)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for testing/mocking
export type { Logger }
