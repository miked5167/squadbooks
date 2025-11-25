# Environment Variable Setup Guide

## Overview
After merging the Squadbooks and Association Dashboard, you'll need to configure environment variables for both development and production databases.

---

## 📋 Required Environment Variables

### Core Database Variables (Required)

```env
# Main Database Connection (used by Prisma Client at runtime)
# Use Pooler connection with pgbouncer for better connection management
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct Database Connection (used by Prisma Migrate)
# Required for running migrations, introspection, and schema pushes
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```

### Supabase Variables (Required for file storage)

```env
# Supabase Project URL (for Supabase Client)
SUPABASE_URL="https://[your-ref].supabase.co"

# Supabase Anonymous Key (public, safe to expose to client)
SUPABASE_ANON_KEY="eyJhbGci..."

# Supabase Service Role Key (SECRET - server-side only, bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
```

### Clerk Authentication Variables (Required)

```env
# Clerk Publishable Key (public, safe for client-side)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Clerk Secret Key (SECRET - server-side only)
CLERK_SECRET_KEY="sk_test_..."

# Clerk Webhook Secret (for webhook signature verification)
CLERK_WEBHOOK_SECRET="whsec_..."
```

### Optional Variables

```env
# Email Service (Resend API)
RESEND_API_KEY="re_..."

# GitHub API (for workflow triggers)
GITHUB_API_KEY="ghp_..."
```

---

## 🗂️ File Structure

### Development Setup (2 databases)

#### `.env.local` (Production Database - default)
```env
# === PRODUCTION SUPABASE DATABASE ===
DATABASE_URL="postgresql://postgres.vynfjwduiehdwbfwyqzh:McGill6751%21%21@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.vynfjwduiehdwbfwyqzh:McGill6751%21%21@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# === SUPABASE CONFIG (same for both) ===
SUPABASE_URL="https://vynfjwduiehdwbfwyqzh.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# === CLERK AUTH (same for both) ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# === OPTIONAL ===
RESEND_API_KEY="re_..."
GITHUB_API_KEY="ghp_..."
```

#### `.env.dev` (Development Database - NEW)
```env
# === DEVELOPMENT SUPABASE DATABASE ===
DATABASE_URL="postgresql://postgres.[dev-ref]:[dev-password]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[dev-ref]:[dev-password]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# === SUPABASE CONFIG ===
# Option 1: Use same Supabase project for storage (simpler)
SUPABASE_URL="https://vynfjwduiehdwbfwyqzh.supabase.co"
SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# Option 2: Create separate dev Supabase project for storage (cleaner)
# SUPABASE_URL="https://[dev-ref].supabase.co"
# SUPABASE_ANON_KEY="eyJhbGci..."
# SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# === CLERK AUTH (same test account) ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# === OPTIONAL ===
RESEND_API_KEY="re_..."
GITHUB_API_KEY="ghp_..."
```

---

## 🚀 Usage in Code

### Prisma Configuration (prisma/schema.prisma)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // Runtime connection (pooled)
  directUrl = env("DIRECT_URL")      // Migration connection (direct)
}
```

**How it works:**
- `DATABASE_URL` - Used by Prisma Client for all queries (pooled connection, faster)
- `DIRECT_URL` - Used by Prisma Migrate and introspection (direct connection, required for DDL)

### Prisma Client (lib/prisma.ts)

```typescript
import { PrismaClient } from '@prisma/client'

// Automatically uses DATABASE_URL from environment
export const prisma = new PrismaClient({
  log: ['query'],
})
```

### Supabase Client (lib/supabase.ts)

```typescript
import { createClient } from '@supabase/supabase-js'

// Server-side client (uses service role key)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Client-side hook (uses anon key)
export function useSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Clerk Provider (app/layout.tsx)

```typescript
import { ClerkProvider } from '@clerk/nextjs'

// Automatically uses NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY
export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

---

## 🔧 Commands with Different Environments

### Development Database

```bash
# Load dev environment variables
set DATABASE_URL=postgresql://postgres.[dev-ref]:[dev-password]@...
set DIRECT_URL=postgresql://postgres.[dev-ref]:[dev-password]@...

# Apply schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Run dev server
npm run dev

# View database in Prisma Studio
npx prisma studio
```

### Production Database (CAREFUL!)

```bash
# Load production environment variables (from .env.local)
# This happens automatically when you run commands

# DON'T run db push on production!
# Use migrations instead:
npx prisma migrate deploy

# View production data (read-only)
npx prisma studio
```

---

## 🎯 After Creating Dev Supabase Project

### Step 1: Get Your Connection Strings

From your new dev Supabase project:
1. Go to **Project Settings > Database**
2. Find **Connection string > Nodejs**
3. Copy and modify:

**Pooler Connection (for DATABASE_URL):**
```
postgresql://postgres.[ref]:[YOUR_PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Direct Connection (for DIRECT_URL):**
```
postgresql://postgres.[ref]:[YOUR_PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

⚠️ Replace `[YOUR_PASSWORD]` with the database password you set during project creation.

### Step 2: Create .env.dev File

Create file: `C:\Users\miked\Squadbooks\.env.dev`

Paste the template from above with your actual dev database credentials.

### Step 3: Apply Schema to Dev Database

```bash
# Method 1: Using db push (faster, no migration files)
npx prisma db push --schema=prisma/schema.prisma

# Method 2: Using migrate (creates migration history)
npx prisma migrate dev --name initial_unified_schema

# Generate Prisma Client
npx prisma generate
```

### Step 4: Verify Schema

```bash
# Open Prisma Studio
npx prisma studio

# Should see all tables:
# - associations, association_users, association_teams, etc.
# - teams, users, transactions, categories, etc.
```

---

## 🔒 Security Notes

### DO commit to Git:
- `.env.example` - Template with placeholder values
- `ENV-SETUP.md` - This documentation

### DO NOT commit to Git:
- `.env.local` - Production secrets
- `.env.dev` - Development secrets
- `.env` - Any real credentials

### Git Ignore:
Make sure `.gitignore` includes:
```
.env
.env.local
.env.dev
.env.production
.env*.local
```

---

## 📊 Environment Variable Checklist

After creating dev database, verify you have:

- [ ] Dev DATABASE_URL set in `.env.dev`
- [ ] Dev DIRECT_URL set in `.env.dev`
- [ ] SUPABASE_URL configured
- [ ] SUPABASE_ANON_KEY configured
- [ ] SUPABASE_SERVICE_ROLE_KEY configured
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY configured
- [ ] CLERK_SECRET_KEY configured
- [ ] Schema applied to dev database (`npx prisma db push`)
- [ ] Prisma Client generated (`npx prisma generate`)
- [ ] Dev server starts without errors (`npm run dev`)

---

## 🆘 Troubleshooting

### Error: "Can't reach database server"
- Check DATABASE_URL and DIRECT_URL are correct
- Verify your IP is allowed in Supabase (Settings > Database > Connection Pooling)
- Ensure password is URL-encoded (! becomes %21)

### Error: "Prisma Client not generated"
- Run: `npx prisma generate`
- Check `node_modules/@prisma/client` exists

### Error: "Schema drift detected"
- Your database doesn't match schema.prisma
- Run: `npx prisma db push` to sync

### Error: "Environment variable not found"
- Check `.env.local` or `.env.dev` file exists in project root
- Verify variable names match exactly (case-sensitive)
- Restart dev server after changing .env files

---

**Last Updated:** 2025-11-25
**Status:** Ready for dev database setup
