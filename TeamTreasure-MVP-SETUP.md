# TeamTreasure MVP Setup Guide

**Version:** 1.0
**Last Updated:** November 19, 2025
**Purpose:** Complete setup instructions for TeamTreasure MVP development

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Authentication Setup](#authentication-setup)
5. [Email Setup](#email-setup)
6. [File Storage Setup](#file-storage-setup)
7. [Running the Application](#running-the-application)
8. [Testing the Setup](#testing-the-setup)
9. [Troubleshooting](#troubleshooting)
10. [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

- **Node.js:** v20.x or higher
  - Check: `node --version`
  - Install: https://nodejs.org/

- **npm:** v10.x or higher
  - Check: `npm --version`
  - Comes with Node.js

- **Git:** v2.x or higher
  - Check: `git --version`
  - Install: https://git-scm.com/

### Recommended Tools

- **VS Code or Cursor:** Code editor
  - Download: https://code.visualstudio.com/ or https://cursor.sh/

- **VS Code Extensions:**
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Prisma
  - Pretty TypeScript Errors

### Accounts Needed

Create these accounts (all have free tiers):

1. **Supabase** - Database & file storage
   - Sign up: https://supabase.com/

2. **Clerk** - Authentication
   - Sign up: https://clerk.com/

3. **Resend** - Email notifications
   - Sign up: https://resend.com/

---

## Environment Setup

### 1. Clone Repository

```bash
# If repository exists
git clone https://github.com/your-username/teamtreasure.git
cd teamtreasure

# If starting fresh
mkdir teamtreasure
cd teamtreasure
git init
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14+
- React 19
- TypeScript
- Tailwind CSS 4.1.17
- Prisma 6.19.0
- Clerk SDK
- Zod (validation)
- shadcn/ui components

### 3. Create Environment Files

```bash
# Create environment files
touch .env.local
touch .env
```

### 4. Configure .env.local

Copy this template into `.env.local`:

```env
# ============================================
# DATABASE (Supabase)
# ============================================
# Get these from: Supabase Dashboard → Settings → Database → Connection String
# Use "Session Pooler" connection string for IPv4 compatibility

# Transaction pooler (for Prisma Client - most operations)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for Prisma migrations and schema operations)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# ============================================
# AUTHENTICATION (Clerk)
# ============================================
# Get these from: Clerk Dashboard → API Keys

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Optional: Clerk webhook secret (for user sync)
# CLERK_WEBHOOK_SECRET="whsec_..."

# ============================================
# CLERK REDIRECT URLs
# ============================================
# These tell Clerk where to redirect after auth actions

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/onboarding"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

# ============================================
# EMAIL (Resend)
# ============================================
# Get this from: Resend Dashboard → API Keys

RESEND_API_KEY="re_..."

# Email settings
EMAIL_FROM="TeamTreasure <noreply@teamtreasure.com>"
EMAIL_REPLY_TO="support@teamtreasure.com"

# ============================================
# FILE STORAGE (Supabase Storage)
# ============================================
# Get these from: Supabase Dashboard → Settings → API

NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Storage bucket name (will create during setup)
SUPABASE_STORAGE_BUCKET="receipts"

# ============================================
# APPLICATION SETTINGS
# ============================================

# Base URL (development)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Node environment
NODE_ENV="development"

# ============================================
# OPTIONAL: MONITORING & ANALYTICS
# ============================================

# Sentry (error tracking)
# NEXT_PUBLIC_SENTRY_DSN=""
# SENTRY_AUTH_TOKEN=""

# Google Analytics
# NEXT_PUBLIC_GA_MEASUREMENT_ID=""
```

### 5. Configure .env (for Prisma CLI)

Copy your `DATABASE_URL` and `DIRECT_URL` into `.env`:

```env
# This file is used by Prisma CLI only
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### 6. Update .gitignore

Verify these are in `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env*.local

# Dependencies
node_modules/

# Next.js
.next/
out/
build/
dist/

# Prisma
prisma/migrations/

# Testing
coverage/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*
```

---

## Database Setup

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name:** teamtreasure-mvp (or your choice)
   - **Database Password:** Generate strong password (save this!)
   - **Region:** Choose closest to you (e.g., US East)
   - **Pricing Plan:** Free tier
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

### 2. Get Database Connection Strings

1. In Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection String** section
3. Select **"Session Pooler"** (important for IPv4!)
4. Copy the **URI** connection string
5. Replace `[YOUR-PASSWORD]` with your database password
6. This is your `DATABASE_URL`

7. Switch to **"Direct connection"** tab
8. Copy the **URI** connection string
9. Replace `[YOUR-PASSWORD]` with your database password
10. This is your `DIRECT_URL`

### 3. Update Environment Files

Paste the connection strings into:
- `.env.local` (for Next.js runtime)
- `.env` (for Prisma CLI)

### 4. Generate Prisma Client

```bash
npm run db:generate
```

This creates the Prisma Client based on your schema.

### 5. Push Database Schema

```bash
npm run db:push
```

This creates all tables in Supabase:
- teams
- users
- categories
- transactions
- approvals
- budget_allocations
- bank_accounts
- bank_transactions
- audit_logs
- exports

### 6. Seed Default Categories

```bash
npm run db:seed
```

This creates the default hockey budget categories:
- 7 headings
- 28 subcategories (Ice Time, Equipment, Travel, etc.)

### 7. Verify Database Setup

1. Go to Supabase Dashboard → **Table Editor**
2. You should see 10 tables listed
3. Click on **categories** table
4. Should see 28 rows of default categories

**OR** open Prisma Studio:

```bash
npm run db:studio
```

Opens at http://localhost:5555 - you can browse your data visually.

---

## Authentication Setup

### 1. Create Clerk Application

1. Go to https://dashboard.clerk.com/
2. Click **"Add application"**
3. Fill in:
   - **Application name:** TeamTreasure MVP
   - **Sign in options:** Enable Email
   - **Social logins:** None for MVP (optional: Google)
4. Click **"Create application"**

### 2. Get API Keys

1. In Clerk Dashboard → **API Keys**
2. Copy **Publishable Key** (starts with `pk_test_`)
   - Paste into `.env.local` as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Copy **Secret Key** (starts with `sk_test_`)
   - Paste into `.env.local` as `CLERK_SECRET_KEY`

### 3. Configure Redirect URLs

1. In Clerk Dashboard → **Paths**
2. Set these paths:
   - **Sign in URL:** `/sign-in`
   - **Sign up URL:** `/sign-up`
   - **After sign in:** `/onboarding`
   - **After sign up:** `/onboarding`
   - **Home URL:** `/dashboard`

### 4. Configure Allowed Redirect URLs

1. In Clerk Dashboard → **Domains**
2. Add development domain:
   - `http://localhost:3000`

### 5. Customize Clerk Appearance (Optional)

1. In Clerk Dashboard → **Customization** → **Theme**
2. Set primary color to Hockey Blue: `#003F87`
3. Enable dark mode support: Optional

### 6. Test Clerk Integration

```bash
npm run dev
```

1. Go to http://localhost:3000/sign-up
2. Should see Clerk sign-up form
3. Create test account
4. Should redirect to `/onboarding`

---

## Email Setup

### 1. Create Resend Account

1. Go to https://resend.com/
2. Click **"Start Building"**
3. Sign up with email or GitHub
4. Verify your email

### 2. Get API Key

1. In Resend Dashboard → **API Keys**
2. Click **"Create API Key"**
3. Name: "TeamTreasure MVP"
4. Copy the API key (starts with `re_`)
5. Paste into `.env.local` as `RESEND_API_KEY`

### 3. Verify Domain (Optional for MVP)

For production, you'll need to verify your domain:
1. In Resend Dashboard → **Domains**
2. Click **"Add Domain"**
3. Add: `teamtreasure.com`
4. Add DNS records to your domain provider

For MVP, you can use Resend's test domain:
- `onboarding@resend.dev`

### 4. Create Email Templates (Later)

You'll create these when building approval notifications:
- Approval required email
- Approval granted email
- Approval rejected email

---

## File Storage Setup

### 1. Create Supabase Storage Bucket

1. In Supabase Dashboard → **Storage**
2. Click **"Create a new bucket"**
3. Fill in:
   - **Name:** receipts
   - **Public:** No (keep private)
   - **File size limit:** 5MB
   - **Allowed MIME types:**
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `application/pdf`
4. Click **"Create bucket"**

### 2. Configure Storage Policies

Add Row Level Security (RLS) policies:

```sql
-- Policy: Users can upload receipts for their team
CREATE POLICY "Users can upload receipts for their team"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM users WHERE clerk_id = auth.uid()
  )
);

-- Policy: Users can view receipts for their team
CREATE POLICY "Users can view receipts for their team"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM users WHERE clerk_id = auth.uid()
  )
);

-- Policy: Users can delete receipts for their team (treasurers only)
CREATE POLICY "Treasurers can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM users
    WHERE clerk_id = auth.uid()
    AND role = 'TREASURER'
  )
);
```

### 3. Get Storage Credentials

1. In Supabase Dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Paste into `.env.local`

### 4. Test File Upload (Later)

You'll test this when building receipt upload feature.

---

## Running the Application

### 1. Start Development Server

```bash
npm run dev
```

Application starts at: http://localhost:3000

### 2. Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript checks

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:migrate       # Create and run migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed default categories

# Testing (when added)
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

### 3. Development Workflow

**Typical workflow:**

1. Make code changes
2. Browser auto-refreshes (Fast Refresh)
3. Check terminal for errors
4. Check browser console for client errors

**Database changes:**

1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` (dev) or `npm run db:migrate` (production)
3. Run `npm run db:generate` to update Prisma Client
4. Restart dev server if needed

---

## Testing the Setup

### ✅ Checklist

Go through this checklist to verify everything works:

#### Environment Variables
- [ ] `.env.local` exists with all required variables
- [ ] `.env` exists with database URLs
- [ ] No `.env` files committed to git
- [ ] `DATABASE_URL` and `DIRECT_URL` both set

#### Database
- [ ] Supabase project created
- [ ] Connection strings correct
- [ ] `npm run db:generate` runs successfully
- [ ] `npm run db:push` runs successfully
- [ ] `npm run db:seed` runs successfully
- [ ] Prisma Studio (`npm run db:studio`) shows 10 tables
- [ ] Categories table has 28 default rows

#### Authentication
- [ ] Clerk application created
- [ ] API keys added to `.env.local`
- [ ] Redirect URLs configured
- [ ] `npm run dev` starts successfully
- [ ] Can access http://localhost:3000/sign-up
- [ ] Can create test account
- [ ] Redirects to `/onboarding` after signup
- [ ] Can create test team in onboarding
- [ ] User and team created in database

#### Email (Optional for now)
- [ ] Resend account created
- [ ] API key added to `.env.local`
- [ ] Test email sends (will implement later)

#### File Storage (Optional for now)
- [ ] Storage bucket created in Supabase
- [ ] Storage credentials added to `.env.local`
- [ ] RLS policies added (will test later)

#### Application
- [ ] `npm run dev` runs without errors
- [ ] Application loads at http://localhost:3000
- [ ] Sign up/sign in works
- [ ] Onboarding creates team
- [ ] Dashboard loads with metric cards
- [ ] No console errors
- [ ] Mobile responsive (test on phone or browser DevTools)

### Test User Flow

1. **Sign Up**
   - Go to http://localhost:3000/sign-up
   - Create account: test@example.com
   - Should redirect to `/onboarding`

2. **Onboarding**
   - Enter team name: "Bantam AA Storm"
   - Select level: "U13"
   - Enter season: "2024-2025"
   - Enter budget: $25,000
   - Click "Create Team"
   - Should redirect to `/dashboard`

3. **Dashboard**
   - Should see Financial Health card
   - Should see Budget snapshot (but no data yet)
   - Should see Transaction list (empty)
   - Should see Bottom navigation

4. **Verify Database**
   - Run `npm run db:studio`
   - Check **teams** table: Should have 1 team
   - Check **users** table: Should have 1 user
   - Check **categories** table: Should have 28 categories
   - All categories should have `teamId` matching your team

---

## Troubleshooting

### Database Connection Issues

**Error: `P1001: Can't reach database server`**

✅ **Fix:**
- Verify `DATABASE_URL` is correct
- Check you're using Session Pooler URL (port 6543)
- Verify password is correct (no special characters causing issues)
- Check Supabase project is running (Dashboard → Status)

**Error: `IPv6 not supported`**

✅ **Fix:**
- Use Session Pooler connection string (not Direct connection)
- Session Pooler supports IPv4

### Prisma Issues

**Error: `Prisma Client not generated`**

✅ **Fix:**
```bash
npm run db:generate
```

**Error: `Migration failed`**

✅ **Fix:**
- Use `npm run db:push` for development (no migration files)
- Use `npm run db:migrate` for production (creates migration files)
- If stuck, reset database and re-push

### Clerk Issues

**Error: `Clerk publishable key missing`**

✅ **Fix:**
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local`
- Restart dev server after adding environment variables

**Error: Infinite redirect loop**

✅ **Fix:**
- Check redirect URLs in Clerk Dashboard → Paths
- Verify `/sign-in`, `/sign-up`, `/onboarding` routes exist
- Clear browser cookies and try again

### Next.js Issues

**Error: `Port 3000 already in use`**

✅ **Fix:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

**Error: `Module not found`**

✅ **Fix:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

### Environment Variable Issues

**Error: Environment variables not loading**

✅ **Fix:**
- Restart dev server after changing `.env.local`
- Verify file is named exactly `.env.local` (not `.env.local.txt`)
- Check for typos in variable names
- For `NEXT_PUBLIC_*` vars, must restart server

---

## Security Checklist

Before committing code:

- [ ] `.env.local` is in `.gitignore`
- [ ] No API keys or secrets in code
- [ ] No database passwords in code
- [ ] Supabase RLS policies enabled
- [ ] Clerk webhook signature verified (when added)
- [ ] CORS configured properly (if needed)

---

## Next Steps

Once setup is complete:

### 1. Verify Everything Works
- [ ] Complete the testing checklist above
- [ ] Create test team through onboarding
- [ ] Verify data in database

### 2. Start Building Features
- [ ] Read `TeamTreasure-MVP-PRD.md`
- [ ] Start with Phase 1: Transaction API
- [ ] Build one feature at a time
- [ ] Test as you go

### 3. Development Best Practices
- [ ] Commit code frequently
- [ ] Write descriptive commit messages
- [ ] Test on mobile (responsive design)
- [ ] Check console for errors
- [ ] Use TypeScript strictly

### 4. Before Production
- [ ] Set up production database (Supabase)
- [ ] Set up production Clerk instance
- [ ] Configure custom domain
- [ ] Set up monitoring (Sentry)
- [ ] Add error boundaries
- [ ] Test with real users (beta)

---

## Resources

### Documentation
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Clerk:** https://clerk.com/docs
- **Supabase:** https://supabase.com/docs
- **Resend:** https://resend.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

### Community
- **TeamTreasure Docs:** (Add your docs link)
- **Issues:** (Add GitHub issues link)
- **Discussions:** (Add GitHub discussions link)

### Support
- Email: support@teamtreasure.com
- Discord: (Add Discord link if you have one)

---

## Frequently Asked Questions

### Q: Do I need to pay for these services?

**A:** No, all services have generous free tiers:
- **Supabase:** 500MB database, 1GB storage free
- **Clerk:** 10,000 monthly active users free
- **Resend:** 3,000 emails/month free
- **Vercel:** Unlimited personal projects free

### Q: Can I use PostgreSQL locally instead of Supabase?

**A:** Yes, but Supabase is recommended because:
- Built-in file storage
- Built-in authentication (if needed)
- Easy deployment
- Automatic backups

### Q: What if I already have a Clerk account?

**A:** Just create a new application in your existing account. You can have multiple applications.

### Q: Do I need Docker?

**A:** No, not required. Supabase is cloud-hosted.

### Q: Can I use a different email service?

**A:** Yes, but Resend has the best developer experience. Alternatives:
- SendGrid
- Postmark
- AWS SES

### Q: How do I deploy to production?

**A:** See separate deployment guide. Quick answer: Vercel + Supabase production instance.

---

## Getting Help

If you're stuck:

1. **Check this guide** - Most issues covered here
2. **Check error messages** - Usually tell you what's wrong
3. **Google the error** - Copy exact error message
4. **Check documentation** - Links above
5. **Ask in Discord** - Community can help
6. **Create GitHub issue** - For bugs or unclear docs

---

**Setup Complete! 🎉**

You're now ready to start building the MVP. Next step: Read the `TeamTreasure-MVP-PRD.md` and start with Phase 1 (Transaction API).

Good luck! 🏒

---

**Last Updated:** November 19, 2025
**Maintainer:** TeamTreasure Engineering
**Review Cadence:** Update when setup changes
