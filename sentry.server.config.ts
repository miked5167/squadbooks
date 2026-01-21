// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  integrations: [
    Sentry.prismaIntegration(),
    Sentry.extraErrorDataIntegration({ depth: 5 }),
  ],

  // Filter sensitive data
  beforeSend(event, hint) {
    // Don't send events if DSN is not configured
    if (!process.env.SENTRY_DSN) {
      return null
    }

    // Scrub sensitive data from request
    if (event.request) {
      delete event.request.cookies
      if (event.request.headers) {
        delete event.request.headers.authorization
        delete event.request.headers.cookie
      }
    }

    // Scrub sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data) {
          // Remove sensitive fields
          const sanitized = { ...breadcrumb.data }
          delete sanitized.password
          delete sanitized.token
          delete sanitized.apiKey
          delete sanitized.secret
          return { ...breadcrumb, data: sanitized }
        }
        return breadcrumb
      })
    }

    return event
  },

  // Only enable in production or if explicitly set
  enabled: process.env.NODE_ENV === 'production' || !!process.env.SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
})
