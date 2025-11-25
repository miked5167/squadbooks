# Quick Start: Dev Database Setup
**Time Required:** ~5 minutes

---

## Step 1: Create Supabase Project (2 min)

https://supabase.com/dashboard → New Project

- **Name:** `squadbooks-dev`
- **Password:** (generate & save!)
- **Region:** West US (Oregon)
- **Plan:** Free

---

## Step 2: Get Connection Strings (1 min)

Project Settings → Database → Connection string → Nodejs tab

Copy both:
1. **Connection pooling** (port 6543 with `pgbouncer=true`)
2. **Direct connection** (port 5432)

---

## Step 3: Create .env.dev (1 min)

File: `C:\Users\miked\Squadbooks\.env.dev`

```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# Copy from .env.local:
SUPABASE_URL="https://vynfjwduiehdwbfwyqzh.supabase.co"
SUPABASE_ANON_KEY="eyJh..."
SUPABASE_SERVICE_ROLE_KEY="eyJh..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

---

## Step 4: Apply Schema (1 min)

```bash
# Set dev environment
set DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@...
set DIRECT_URL=postgresql://postgres.[REF]:[PASSWORD]@...

# Apply schema
npx prisma db push
```

✅ Should see: "Database is now in sync with your schema"

---

## Step 5: Verify (30 sec)

```bash
npx prisma studio
```

Visit http://localhost:5555 - Should see 22 tables including:
- `associations`
- `association_teams`
- `teams`
- `users`
- `transactions`

---

## Step 6: Commit (30 sec)

```bash
git add .
git commit -m "Phase 1: Unified database schema

- Merged Prisma schemas (22 models)
- Created migration plan and docs
- Started Phase 2 (1 page migrated)"
```

---

## ✅ Done!

Ready for next session. We'll resume with:
1. Test critical path (Squadbooks → snapshot → association)
2. Complete Phase 2 page migration
3. Build snapshot generation system

---

## 🆘 Troubleshooting

**Can't connect:** Check password in DATABASE_URL (! becomes %21)
**Missing tables:** Run `npx prisma db push` again
**Wrong database:** Verify you're using dev URLs, not production
