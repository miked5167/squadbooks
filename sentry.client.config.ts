// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay settings
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out common errors that aren't actionable
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Random plugins/extensions
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    // Network errors
    'NetworkError',
    'Non-Error promise rejection captured',
  ],

  // Only enable in production or if explicitly set
  enabled: process.env.NODE_ENV === 'production' || !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
})
