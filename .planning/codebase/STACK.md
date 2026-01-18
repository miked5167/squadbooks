# Technology Stack

**Analysis Date:** 2026-01-18

## Languages

**Primary:**

- TypeScript 5.x - All application code, strict mode enabled
- SQL - PostgreSQL database schema and queries

**Secondary:**

- JavaScript - Configuration files (ESM modules)

## Runtime

**Environment:**

- Node.js 22.18.0
- Next.js 15.1.3 (React 19.0.0)

**Package Manager:**

- npm (package-lock.json present)
- Lockfile: Present and committed

## Frameworks

**Core:**

- Next.js 15.1.3 - Full-stack React framework with App Router
- React 19.0.0 - UI library
- React DOM 19.0.0 - React rendering

**Testing:**

- Vitest 4.0.14 - Unit testing framework
- @vitest/coverage-v8 4.0.14 - Code coverage
- @testing-library/react 16.3.0 - React component testing
- @testing-library/jest-dom 6.9.1 - DOM matchers
- Playwright 1.56.1 - E2E testing
- jsdom 27.2.0 - DOM environment for unit tests

**Build/Dev:**

- TypeScript 5.x - Type checking and compilation
- Tailwind CSS 4.1.17 - Utility-first CSS framework
- PostCSS 8.x - CSS processing
- ESLint 9.x - Linting (extends next/core-web-vitals, next/typescript, prettier)
- Prettier 3.7.3 - Code formatting
- Husky 9.1.7 - Git hooks
- lint-staged 16.2.7 - Pre-commit linting
- tsx 4.20.6 - TypeScript execution for scripts
- Turbopack - Dev server (enabled via --turbo flag)

## Key Dependencies

**Critical:**

- @prisma/client 6.1.0 - Database ORM client (PostgreSQL)
- @clerk/nextjs 6.35.3 - Authentication and user management
- @supabase/supabase-js 2.47.10 - Supabase client for file storage
- plaid 40.0.0 - Banking integration API client
- zod 3.25.76 - Schema validation

**Infrastructure:**

- @sentry/nextjs 10.27.0 - Error tracking and monitoring
- @vercel/analytics 1.6.1 - Analytics tracking
- @vercel/speed-insights 1.3.1 - Performance monitoring
- resend 4.8.0 - Email delivery service
- svix 1.81.0 - Webhook verification (for Clerk webhooks)

**UI Components:**

- @radix-ui/\* (multiple packages) - Headless UI primitives
- lucide-react 0.468.0 - Icon library
- recharts 2.15.4 - Charts and data visualization
- framer-motion 12.23.24 - Animation library
- sonner 2.0.7 - Toast notifications
- cmdk 1.1.1 - Command palette
- vaul 1.1.2 - Drawer component
- next-themes 0.4.6 - Theme management

**AI/LLM:**

- @ai-sdk/anthropic 2.0.53 - Anthropic AI SDK
- @anthropic-ai/sdk 0.71.2 - Anthropic API client
- ai 5.0.108 - Vercel AI SDK

**Utilities:**

- date-fns 4.1.0 - Date manipulation
- nanoid 5.1.6 - ID generation
- slugify 1.6.6 - String slugification
- xlsx 0.18.5 - Excel file processing
- adm-zip 0.5.16 - ZIP file handling
- @react-pdf/renderer 4.3.1 - PDF generation
- pdfkit 0.17.2 - PDF creation

## Configuration

**Environment:**

- Environment variables configured via .env files (.env.local, .env.test.local, .env.test.integration)
- .env.example provided with all required variables documented
- Key configs: DATABASE_URL, CLERK keys, SUPABASE keys, PLAID keys, ANTHROPIC_API_KEY, RESEND_API_KEY

**Build:**

- `next.config.ts` - Next.js configuration with Sentry and bundle analyzer
- `tsconfig.json` - TypeScript config (ES2017 target, strict mode, path alias @/\*)
- `eslint.config.mjs` - ESLint flat config
- `.prettierrc` - Prettier config (no semicolons, single quotes, 100 char width)
- `postcss.config.mjs` - PostCSS with Tailwind plugin
- `vitest.config.ts` - Vitest unit test config (jsdom environment)
- `vitest.config.integration.ts` - Vitest integration test config
- `playwright.config.ts` - Playwright E2E test config
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` - Sentry configs

## Platform Requirements

**Development:**

- Node.js 22.18.0 or compatible
- npm for package management
- PostgreSQL database (via Supabase)
- Environment variables configured

**Production:**

- Vercel (deployment target - Sentry release tracking uses VERCEL_GIT_COMMIT_SHA)
- Next.js 15+ compatible hosting
- PostgreSQL database connection
- External service integrations: Clerk, Supabase, Plaid, Resend, Sentry, Anthropic

---

_Stack analysis: 2026-01-18_
