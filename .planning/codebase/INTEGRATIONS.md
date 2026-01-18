# External Integrations

**Analysis Date:** 2026-01-18

## APIs & External Services

**Authentication & User Management:**

- Clerk - Complete authentication and user management platform
  - SDK/Client: `@clerk/nextjs` (6.35.3)
  - Auth: `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - Sign-in/up URLs: `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
  - Webhook Secret: `CLERK_WEBHOOK_SECRET`
  - Middleware: `C:/Users/miked/Squadbooks/middleware.ts` (clerkMiddleware)
  - Webhook Handler: `C:/Users/miked/Squadbooks/app/api/webhooks/clerk/route.ts`

**Banking & Financial:**

- Plaid - Banking integration and transaction sync
  - SDK/Client: `plaid` (40.0.0), `react-plaid-link` (4.1.1)
  - Auth: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`, `NEXT_PUBLIC_PLAID_ENV`
  - Client: `C:/Users/miked/Squadbooks/lib/services/plaid/client.ts`
  - API Routes: `C:/Users/miked/Squadbooks/app/api/plaid/` (multiple endpoints)
  - Environments: sandbox, production

**Email Delivery:**

- Resend - Transactional email service
  - SDK/Client: `resend` (4.8.0)
  - Auth: `RESEND_API_KEY`
  - From Email: `RESEND_FROM_EMAIL`
  - Audience ID: `RESEND_AUDIENCE_ID` (optional, for waitlist)
  - Usage: `C:/Users/miked/Squadbooks/app/api/waitlist/route.ts`, `C:/Users/miked/Squadbooks/app/api/landing/email-signup/route.ts`

**AI Assistant:**

- Anthropic Claude - AI-powered assistant functionality
  - SDK/Client: `@ai-sdk/anthropic` (2.0.53), `@anthropic-ai/sdk` (0.71.2), `ai` (5.0.108)
  - Auth: `ANTHROPIC_API_KEY`
  - Usage: `C:/Users/miked/Squadbooks/app/api/assistant/route.ts`

**Webhook Verification:**

- Svix - Webhook security and verification
  - SDK/Client: `svix` (1.81.0)
  - Usage: Clerk webhook verification in `C:/Users/miked/Squadbooks/app/api/webhooks/clerk/route.ts`

## Data Storage

**Databases:**

- Supabase PostgreSQL - Primary database
  - Connection: `DATABASE_URL`, `DIRECT_URL`
  - Client: Prisma ORM (`@prisma/client` 6.1.0)
  - Schema: `C:/Users/miked/Squadbooks/prisma/schema.prisma`
  - Provider: `postgresql`
  - Note: Using Clerk for auth, not Supabase Auth

**File Storage:**

- Supabase Storage - Receipt and document storage
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client: `@supabase/supabase-js` (2.47.10)
  - Storage Module: `C:/Users/miked/Squadbooks/lib/storage.ts`
  - Bucket: `receipts` (default, configurable via `SUPABASE_STORAGE_BUCKET`)
  - Allowed Types: JPEG, PNG, WebP, PDF
  - Max Size: 5MB
  - Note: Uses service role key to bypass RLS (auth handled by Clerk)

**Caching:**

- None detected (no Redis, Memcached, or similar)

## Authentication & Identity

**Auth Provider:**

- Clerk
  - Implementation: Middleware-based authentication with SSR support
  - User sync: Webhook handler creates/updates users on Clerk events
  - Public routes: `/`, `/sign-in`, `/sign-up`, `/api/webhooks`, `/waitlist`, `/public-budget`
  - Protected routes: All other routes (handled per-route, not enforced globally)
  - User model: `AssociationUser` in Prisma schema linked to `clerkUserId`

## Monitoring & Observability

**Error Tracking:**

- Sentry
  - SDK/Client: `@sentry/nextjs` (10.27.0)
  - Auth: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
  - Config: `SENTRY_ORG`, `SENTRY_PROJECT`
  - Configs: `C:/Users/miked/Squadbooks/sentry.client.config.ts`, `C:/Users/miked/Squadbooks/sentry.server.config.ts`, `C:/Users/miked/Squadbooks/sentry.edge.config.ts`
  - Features: Session replay, browser tracing, error filtering
  - Enabled: Production only (or if DSN explicitly set)

**Analytics:**

- Vercel Analytics
  - SDK/Client: `@vercel/analytics` (1.6.1)
  - Integration: `C:/Users/miked/Squadbooks/app/layout.tsx` (Analytics component)
  - No configuration required

**Performance:**

- Vercel Speed Insights
  - SDK/Client: `@vercel/speed-insights` (1.3.1)
  - Integration: `C:/Users/miked/Squadbooks/app/layout.tsx` (SpeedInsights component)
  - Web Vitals: Custom component in `C:/Users/miked/Squadbooks/components/web-vitals`

**Logs:**

- Custom logger: `C:/Users/miked/Squadbooks/lib/logger.ts`
- Console-based logging (structured for production)

## CI/CD & Deployment

**Hosting:**

- Vercel
  - Evidence: `@vercel/analytics`, `@vercel/speed-insights` packages
  - Release tracking: `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` in Sentry config
  - Next.js optimized deployment

**CI Pipeline:**

- Not explicitly configured (likely using Vercel's automatic deployments)
  - Git hooks: Husky with pre-commit (lint-staged)
  - Pre-commit: ESLint fix, Prettier format on staged files

## Environment Configuration

**Required env vars:**

- Database: `DATABASE_URL`, `DIRECT_URL`, `DATABASE_PROVIDER`
- Auth: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- Storage: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Plaid: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`, `NEXT_PUBLIC_PLAID_ENV`
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- AI: `ANTHROPIC_API_KEY`
- App: `NEXT_PUBLIC_APP_URL`

**Optional env vars:**

- Sentry: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
- Resend: `RESEND_AUDIENCE_ID`
- Storage: `SUPABASE_STORAGE_BUCKET`
- Dev: `NEXT_PUBLIC_DEV_MODE`

**Secrets location:**

- Local: `.env.local` file (gitignored)
- Testing: `.env.test.local`, `.env.test.integration`
- Production: Vercel environment variables (inferred from deployment target)
- Template: `.env.example` with comprehensive documentation

## Webhooks & Callbacks

**Incoming:**

- Clerk Webhooks: `C:/Users/miked/Squadbooks/app/api/webhooks/clerk/route.ts`
  - Events: `user.created` (syncs users to database)
  - Verification: Svix webhook verification
  - Security: `CLERK_WEBHOOK_SECRET`

**Outgoing:**

- None detected

## Database ORM

**Prisma:**

- Client: `@prisma/client` (6.1.0)
- CLI: `prisma` (6.1.0)
- Schema: `C:/Users/miked/Squadbooks/prisma/schema.prisma`
- Generator: `prisma-client-js`
- Datasource: PostgreSQL with connection pooling (DATABASE_URL, DIRECT_URL)
- Commands:
  - `npm run db:generate` - Generate Prisma client
  - `npm run db:migrate` - Run migrations
  - `npm run db:studio` - Open Prisma Studio
  - `npm run db:seed` - Seed database
  - `npm run seed:demo` - Seed demo data

## External Data Services

**DataForSEO:**

- Client: `dataforseo-client` (2.0.14)
- Purpose: Not evident from immediate code inspection (SEO/search data)

---

_Integration audit: 2026-01-18_
