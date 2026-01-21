# Sentry Error Tracking Setup Guide

Sentry has been configured in your Squadbooks application to track errors and performance issues. Follow these steps to complete the setup.

## 1. Create a Sentry Account

1. Go to [https://sentry.io/signup/](https://sentry.io/signup/)
2. Create a free account (generous free tier available)
3. Choose "Next.js" as your platform when creating a project

## 2. Get Your Sentry DSN

After creating a project, you'll receive a **DSN (Data Source Name)**. It looks like:
```
https://abc123def456@o123456.ingest.sentry.io/789012
```

## 3. Configure Environment Variables

Add these variables to your `.env.local` file (and to your production environment):

### Required for Error Tracking:
```bash
# Server-side error tracking
SENTRY_DSN="https://...@sentry.io/..."

# Client-side error tracking (same DSN, but public)
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
```

### Optional for Source Map Uploads (Production only):
```bash
# Your Sentry organization slug
SENTRY_ORG="your-org-name"

# Your Sentry project slug
SENTRY_PROJECT="squadbooks"

# Auth token for uploading source maps (create at: https://sentry.io/settings/account/api/auth-tokens/)
SENTRY_AUTH_TOKEN="your-auth-token"
```

## 4. Test the Integration

### Test Client-Side Errors:

Add this to any client component temporarily:
```tsx
'use client'

import { captureException } from '@/lib/sentry'

export default function TestPage() {
  const testError = () => {
    try {
      throw new Error('Test client error!')
    } catch (error) {
      captureException(error as Error, { source: 'test-button' })
    }
  }

  return <button onClick={testError}>Test Sentry</button>
}
```

### Test Server-Side Errors:

Add this to any API route temporarily:
```typescript
import { captureException } from '@/lib/sentry'

export async function GET(request: Request) {
  try {
    throw new Error('Test server error!')
  } catch (error) {
    captureException(error as Error, { route: '/api/test' })
    return new Response('Error captured', { status: 500 })
  }
}
```

## 5. Verify in Sentry Dashboard

1. Go to your Sentry project dashboard
2. Click on "Issues" in the sidebar
3. You should see your test errors appear within a few seconds

## 6. Features Configured

✅ **Client-side error tracking** - Catches React errors, unhandled promises, etc.
✅ **Server-side error tracking** - Catches API route errors, server component errors
✅ **Edge runtime tracking** - Catches middleware errors
✅ **Session replay** - Records user sessions when errors occur (in production)
✅ **Performance monitoring** - Tracks page load times and API response times
✅ **Breadcrumbs** - Shows user actions leading up to errors
✅ **Source maps** - Shows original TypeScript code in stack traces (when auth token configured)
✅ **Sensitive data filtering** - Automatically removes passwords, tokens, etc.

## 7. Usage Throughout the App

### Capture Exceptions:
```typescript
import { captureException } from '@/lib/sentry'

try {
  // Your code
} catch (error) {
  captureException(error as Error, {
    userId: user.id,
    action: 'create_transaction',
  })
}
```

### Capture Messages:
```typescript
import { captureMessage } from '@/lib/sentry'

captureMessage('Payment processed successfully', 'info', {
  amount: 100,
  userId: user.id,
})
```

### Set User Context:
```typescript
import { setUser } from '@/lib/sentry'

// After user logs in
setUser({
  id: user.id,
  email: user.email,
  role: user.role,
})

// On logout
import { clearUser } from '@/lib/sentry'
clearUser()
```

### Wrap API Routes:
```typescript
import { withSentryApiRoute } from '@/lib/sentry'

const handler = async (req: Request) => {
  // Your API logic
  return new Response('Success')
}

export const GET = withSentryApiRoute(handler, '/api/transactions')
```

## 8. Production Configuration

In production (Vercel, etc.), set these environment variables:

```bash
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=squadbooks
SENTRY_AUTH_TOKEN=your-auth-token  # For source maps
```

## 9. Cost Considerations

- **Free Tier:** 5,000 errors/month, 10,000 transactions/month
- **Paid Tiers:** Start at $26/month for more volume
- **Recommendation:** Start with free tier, upgrade if needed

## 10. Troubleshooting

### Errors not appearing in Sentry?

1. Check that `SENTRY_DSN` is set correctly
2. Check browser console for Sentry initialization messages
3. Ensure you're not in development mode (Sentry logs to console instead)
4. Check your Sentry project's "Inbound Filters" settings

### Source maps not working?

1. Ensure `SENTRY_AUTH_TOKEN` is set
2. Ensure `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry account
3. Check build logs for source map upload errors

### Too many errors?

1. Adjust `ignoreErrors` in `sentry.client.config.ts`
2. Adjust `beforeSend` filtering in `sentry.server.config.ts`
3. Lower `tracesSampleRate` to reduce transaction volume

## 11. Next Steps

- [ ] Create Sentry account
- [ ] Add DSN to environment variables
- [ ] Test error tracking
- [ ] Configure alerts in Sentry dashboard
- [ ] Set up Slack/email notifications
- [ ] Review and adjust error filtering
- [ ] Add user context tracking in auth flow

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io/)
- [Create Auth Token](https://sentry.io/settings/account/api/auth-tokens/)
