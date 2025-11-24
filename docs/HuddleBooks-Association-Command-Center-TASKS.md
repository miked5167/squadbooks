# HuddleBooks Association Command Center - MVP Task Tracker

**Version:** 1.0  
**Start Date:** November 25, 2025  
**Target Launch:** 8 weeks (January 20, 2026)  
**Status:** 🟢 Ready to Start

---

## 🎯 Quick Status Overview

| Phase | Status | Progress | Target Date |
|-------|--------|----------|-------------|
| **Phase 0: Setup & Infrastructure** | ⚪ Not Started | 0% | Week 1 |
| **Phase 1: Daily Snapshot Engine** | ⚪ Not Started | 0% | Week 2 |
| **Phase 2: Dashboard & Team List** | ⚪ Not Started | 0% | Weeks 3-4 |
| **Phase 3: Team Detail & Alerts** | ⚪ Not Started | 0% | Weeks 5-6 |
| **Phase 4: Reports & Polish** | ⚪ Not Started | 0% | Week 7 |
| **Phase 5: Testing & Beta Launch** | ⚪ Not Started | 0% | Week 8 |

**Overall MVP Progress:** 0% complete (0/95 tasks done)

---

## 📋 Project Context

### What We're Building
A read-only "control tower" dashboard for minor hockey associations to monitor all teams using HuddleBooks. Association admins can see team health at a glance, drill into problem teams, and generate board-ready reports.

### Key Architectural Decisions
1. **Daily Snapshots** - Data refreshed once daily at 3 AM UTC (not real-time)
2. **Read-Only** - Association cannot edit team data
3. **Separate Database** - Own Supabase instance, reads from HuddleBooks API
4. **5 MVP Features Only** - Overview, Team List, Team Detail, Alerts, 2 Reports

### Tech Stack
- **Frontend:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Supabase PostgreSQL
- **Auth:** Clerk (with association roles)
- **Snapshot Job:** GitHub Actions cron → Supabase Edge Function
- **PDF Reports:** React-PDF or @react-pdf/renderer

---

## Phase 0: Setup & Infrastructure (Week 1)

**Goal:** Project scaffolded, database ready, auth working, snapshot job deployable

**Status:** ⚪ Not Started - 0/28 tasks complete

### 0.1 Project Initialization (8 tasks)

- [ ] Create new Next.js 14+ project
  ```bash
  npx create-next-app@latest association-dashboard --typescript --tailwind --eslint --app --src-dir
  ```
- [ ] Configure TypeScript strict mode in `tsconfig.json`
- [ ] Install core dependencies
  ```bash
  npm install @supabase/supabase-js @clerk/nextjs zod date-fns
  npm install -D prisma @types/node
  ```
- [ ] Install UI dependencies
  ```bash
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button card table badge tabs dialog
  ```
- [ ] Set up project structure:
  ```
  src/
  ├── app/
  │   ├── (auth)/
  │   │   ├── sign-in/
  │   │   └── sign-up/
  │   ├── (dashboard)/
  │   │   ├── layout.tsx
  │   │   ├── page.tsx (overview)
  │   │   ├── teams/
  │   │   ├── alerts/
  │   │   └── reports/
  │   └── api/
  ├── components/
  ├── lib/
  │   ├── db/
  │   ├── huddlebooks/
  │   └── utils/
  └── types/
  ```
- [ ] Create `.env.local` with placeholders
- [ ] Create `.env.example` for documentation
- [ ] Configure `.gitignore` (include `.env.local`, `.env`)

### 0.2 Supabase Database Setup (10 tasks)

- [ ] Create new Supabase project for association dashboard
- [ ] Get connection strings (pooler + direct)
- [ ] Initialize Prisma
  ```bash
  npx prisma init
  ```
- [ ] Create Prisma schema with all 7 tables:
  - [ ] `associations` table
  - [ ] `association_users` table
  - [ ] `association_teams` table
  - [ ] `team_financial_snapshots` table
  - [ ] `alerts` table
  - [ ] `reports` table
  - [ ] `dashboard_config` table
- [ ] Add indexes for performance:
  - [ ] `idx_snapshots_team_time` on snapshots
  - [ ] `idx_alerts_active` partial index on active alerts
  - [ ] `idx_reports_association_type_time` on reports
- [ ] Run initial migration
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] Create Prisma client singleton in `src/lib/db/prisma.ts`
- [ ] Verify tables created in Supabase dashboard

### 0.3 Authentication Setup (6 tasks)

- [ ] Create Clerk application (separate from team HuddleBooks)
- [ ] Get Clerk API keys and add to `.env.local`:
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
  CLERK_SECRET_KEY=
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
  ```
- [ ] Create Clerk middleware in `src/middleware.ts`
- [ ] Create sign-in page at `src/app/(auth)/sign-in/page.tsx`
- [ ] Create sign-up page at `src/app/(auth)/sign-up/page.tsx`
- [ ] Define association roles in `src/types/auth.ts`:
  ```typescript
  export type AssociationRole = 'association_admin' | 'board_member' | 'auditor'
  ```

### 0.4 Environment Configuration (4 tasks)

- [ ] Document all required environment variables:
  ```
  # Database
  DATABASE_URL=
  DIRECT_URL=
  
  # Clerk Auth
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
  CLERK_SECRET_KEY=
  
  # HuddleBooks API
  HUDDLEBOOKS_API_BASE_URL=https://api.huddlebooks.app/api/v1
  
  # Supabase (for Edge Functions)
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- [ ] Create utility for accessing environment variables safely
- [ ] Set up Vercel project and link repository
- [ ] Configure Vercel environment variables

**Phase 0 Deliverable:** ✅ Project scaffolded, database tables created, auth working

---

## Phase 1: Daily Snapshot Engine (Week 2)

**Goal:** Automated daily job pulls data from HuddleBooks, calculates health, stores snapshots

**Status:** ⚪ Not Started - 0/22 tasks complete

### 1.1 HuddleBooks API Client (8 tasks)

- [ ] Create HuddleBooks client in `src/lib/huddlebooks/client.ts`:
  ```typescript
  export class HuddleBooksClient {
    constructor(private accessToken: string) {}
    
    async getTeamSummary(teamId: string): Promise<TeamSummary>
    async getTeamBudget(teamId: string): Promise<TeamBudget>
    async getTransactions(teamId: string, params: TransactionParams): Promise<TransactionsResponse>
  }
  ```
- [ ] Define TypeScript types in `src/types/huddlebooks.ts`:
  - [ ] `TeamSummary` type
  - [ ] `TeamBudget` type
  - [ ] `Transaction` type
  - [ ] `TransactionsResponse` type
- [ ] Implement `getTeamSummary()` method
- [ ] Implement `getTeamBudget()` method
- [ ] Implement `getTransactions()` method with pagination
- [ ] Add error handling and retry logic (3 retries with backoff)
- [ ] Add request timeout (30 seconds)
- [ ] Create mock responses for testing without live API

### 1.2 Health Score Calculator (6 tasks)

- [ ] Create health calculator in `src/lib/snapshots/health.ts`
- [ ] Implement `calculateHealthStatus()` function:
  ```typescript
  export function calculateHealthStatus(
    summary: TeamSummary,
    config: DashboardConfig
  ): { status: HealthStatus; flags: RedFlag[] }
  ```
- [ ] Implement budget utilization check:
  - Warning: `percentUsed >= config.budgetWarningPct`
  - Critical: `percentUsed >= config.budgetCriticalPct`
- [ ] Implement bank reconciliation check:
  - Warning: `daysSinceReconciled > config.bankWarningDays`
  - Critical: `daysSinceReconciled > config.bankCriticalDays`
- [ ] Implement pending approvals check:
  - Warning: `pendingApprovals >= config.approvalsWarningCount`
  - Critical: `pendingApprovals >= config.approvalsCriticalCount`
- [ ] Implement inactivity check:
  - Warning: `daysSinceActivity > config.inactivityWarningDays`

### 1.3 Supabase Edge Function (5 tasks)

- [ ] Create Edge Function directory structure:
  ```
  supabase/
  └── functions/
      └── run-daily-snapshots/
          └── index.ts
  ```
- [ ] Implement snapshot job logic:
  ```typescript
  // 1. Fetch all active association_teams
  // 2. For each team:
  //    a. Call HuddleBooks API
  //    b. Calculate health status
  //    c. Insert snapshot
  //    d. Update last_synced_at
  //    e. Evaluate alerts
  // 3. Return summary
  ```
- [ ] Add 500ms delay between team API calls (rate limiting)
- [ ] Add error handling per team (don't fail entire job)
- [ ] Deploy Edge Function to Supabase:
  ```bash
  supabase functions deploy run-daily-snapshots
  ```

### 1.4 GitHub Actions Cron Trigger (3 tasks)

- [ ] Create `.github/workflows/daily-snapshots.yml`:
  ```yaml
  name: Daily Snapshots
  on:
    schedule:
      - cron: '0 3 * * *'  # 3 AM UTC daily
    workflow_dispatch:  # Manual trigger for testing
  jobs:
    trigger:
      runs-on: ubuntu-latest
      steps:
        - name: Trigger Snapshot Job
          run: |
            curl -X POST ${{ secrets.SUPABASE_FUNCTION_URL }} \
              -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
              -H "Content-Type: application/json"
  ```
- [ ] Add secrets to GitHub repository:
  - `SUPABASE_FUNCTION_URL`
  - `SUPABASE_SERVICE_KEY`
- [ ] Test manual trigger and verify snapshots created

**Phase 1 Deliverable:** ✅ Daily job runs, snapshots stored, health calculated

---

## Phase 2: Dashboard & Team List (Weeks 3-4)

**Goal:** Association Overview and Team List pages functional

**Status:** ⚪ Not Started - 0/20 tasks complete

### 2.1 Dashboard API Routes (6 tasks)

- [ ] Create `/api/associations/[id]/overview/route.ts`:
  ```typescript
  // GET - Returns dashboard overview data
  // Response: { totals, statusCounts, topAttentionTeams, recentAlerts, dataAsOf }
  ```
- [ ] Create `/api/associations/[id]/teams/route.ts`:
  ```typescript
  // GET - Returns paginated team list
  // Query params: page, pageSize, status, search, sortBy, sortDir
  ```
- [ ] Implement aggregation query for KPI totals
- [ ] Implement "latest snapshot per team" query
- [ ] Add authorization check (user belongs to association)
- [ ] Add Zod validation for query parameters

### 2.2 Association Overview Page (7 tasks)

- [ ] Create dashboard layout at `src/app/(dashboard)/layout.tsx`:
  - [ ] Sidebar with navigation (Overview, Teams, Alerts, Reports)
  - [ ] Header with association name and user menu
  - [ ] "Data as of" timestamp display
- [ ] Create overview page at `src/app/(dashboard)/page.tsx`
- [ ] Build KPI cards component:
  - [ ] Total Teams card
  - [ ] Health distribution card (X Healthy / Y Attention / Z Risk)
  - [ ] Budget totals card (Total / Spent / Remaining)
- [ ] Build health distribution chart (donut or bar)
- [ ] Build "Teams Needing Attention" list component:
  - [ ] Show top 5-10 teams sorted by risk
  - [ ] Display: Team Name, Division, Status, % Used, Flag Count
  - [ ] Click navigates to team detail
- [ ] Build "Recent Alerts" section:
  - [ ] Show last 5 alerts
  - [ ] Display: Title, Team Name, Created At
  - [ ] Click navigates to team detail
- [ ] Add loading skeletons for all sections

### 2.3 Team List Page (7 tasks)

- [ ] Create teams page at `src/app/(dashboard)/teams/page.tsx`
- [ ] Build team list table with columns:
  - [ ] Team Name
  - [ ] Division
  - [ ] Health Status (color badge)
  - [ ] Budget Total
  - [ ] Spent
  - [ ] Remaining
  - [ ] % Used
  - [ ] Last Activity
  - [ ] Red Flag Count
- [ ] Implement search by team name (debounced input)
- [ ] Implement filter by health status (tabs or dropdown)
- [ ] Implement column sorting (click header to sort)
- [ ] Implement pagination (50 teams per page)
- [ ] Row click navigates to `/teams/[id]`

**Phase 2 Deliverable:** ✅ Admin can view overview and browse team list

---

## Phase 3: Team Detail & Alerts (Weeks 5-6)

**Goal:** Deep dive into individual teams, alerts system functional

**Status:** ⚪ Not Started - 0/18 tasks complete

### 3.1 Team Detail API (4 tasks)

- [ ] Create `/api/teams/[associationTeamId]/route.ts`:
  ```typescript
  // GET - Returns team detail from snapshot
  // Response: { teamInfo, budgetSummary, categoryBreakdown, redFlags }
  ```
- [ ] Create `/api/teams/[associationTeamId]/transactions/route.ts`:
  ```typescript
  // GET - Proxies to HuddleBooks transactions API
  // Query params: page, pageSize, type, status, startDate, endDate
  ```
- [ ] Implement proxy with team's access token
- [ ] Add error handling for HuddleBooks API failures

### 3.2 Team Detail Page (6 tasks)

- [ ] Create team detail page at `src/app/(dashboard)/teams/[id]/page.tsx`
- [ ] Build header section:
  - [ ] Team Name, Division, Season
  - [ ] Treasurer Name + Email
  - [ ] Health Status badge
  - [ ] Back button to team list
- [ ] Build budget summary card:
  - [ ] Budget Total, Spent, Remaining, % Used
  - [ ] Progress bar visualization
- [ ] Build category breakdown table:
  - [ ] Category Name, Budgeted, Spent, Remaining, Status
  - [ ] Status color coding (On Track / Warning / Over)
- [ ] Build transactions list (paginated):
  - [ ] Date, Type, Vendor, Amount, Status
  - [ ] Filters: Date range, Type, Status
  - [ ] Default: 25 per page, max 100
- [ ] Build red flags section:
  - [ ] List all active flags for this team
  - [ ] Show flag code and message

### 3.3 Alert System (8 tasks)

- [ ] Create alert evaluation function in `src/lib/alerts/evaluate.ts`:
  ```typescript
  export async function evaluateAlerts(
    team: AssociationTeam,
    snapshot: TeamSnapshot,
    config: DashboardConfig
  ): Promise<void>
  ```
- [ ] Implement alert deduplication logic:
  - [ ] Check for existing active alert per (team, type)
  - [ ] If exists: update `last_triggered_at`
  - [ ] If not exists: create new alert
  - [ ] If condition cleared: mark resolved
- [ ] Create `/api/associations/[id]/alerts/route.ts`:
  ```typescript
  // GET - Returns active alerts with filters
  // Query params: severity, type, teamId, page
  ```
- [ ] Create alerts page at `src/app/(dashboard)/alerts/page.tsx`
- [ ] Build alerts table:
  - [ ] Created At, Severity, Team Name, Alert Type, Description
  - [ ] Sort by severity (critical first), then created_at
  - [ ] Filter by severity, type, team
- [ ] Build alert badge in header (count of active alerts)
- [ ] Row click navigates to team detail
- [ ] Add alert resolution capability (mark resolved with note)

**Phase 3 Deliverable:** ✅ Admin can drill into teams and manage alerts

---

## Phase 4: Reports & Polish (Week 7)

**Goal:** PDF reports generating, UI polished

**Status:** ⚪ Not Started - 0/12 tasks complete

### 4.1 Report Generation (8 tasks)

- [ ] Install PDF generation library:
  ```bash
  npm install @react-pdf/renderer
  ```
- [ ] Create `/api/reports/board-summary/route.ts`:
  ```typescript
  // POST - Generates Board Financial Summary PDF
  // Returns: PDF file download
  ```
- [ ] Create `/api/reports/compliance-snapshot/route.ts`:
  ```typescript
  // POST - Generates Compliance Snapshot PDF
  // Returns: PDF file download
  ```
- [ ] Build Board Summary PDF template:
  - [ ] Association name, season, generation date
  - [ ] KPI summary (totals, status counts)
  - [ ] Health distribution chart
  - [ ] At-risk teams list with top flags
- [ ] Build Compliance Snapshot PDF template:
  - [ ] Association name, season, generation date
  - [ ] Compliance percentages (bank connected, reconciled, etc.)
  - [ ] Active alerts summary by type
- [ ] Implement rate limiting (1 report per admin per 60s per type)
- [ ] Store generated report metadata in `reports` table
- [ ] Create reports page at `src/app/(dashboard)/reports/page.tsx`:
  - [ ] "Generate Board Summary" button
  - [ ] "Generate Compliance Snapshot" button
  - [ ] Report history list (previous downloads)

### 4.2 UI Polish (4 tasks)

- [ ] Add loading states to all pages:
  - [ ] Skeleton loaders for tables and cards
  - [ ] Loading spinners for buttons
- [ ] Add error states:
  - [ ] Error boundaries for page crashes
  - [ ] Toast notifications for API errors
  - [ ] Friendly error messages
- [ ] Add empty states:
  - [ ] No teams connected yet
  - [ ] No alerts (celebration message!)
  - [ ] No reports generated
- [ ] Mobile responsiveness:
  - [ ] Test on tablet and phone viewports
  - [ ] Collapse table to cards on mobile
  - [ ] Hamburger menu for navigation

**Phase 4 Deliverable:** ✅ Reports generate, UI polished

---

## Phase 5: Testing & Beta Launch (Week 8)

**Goal:** Tested, deployed, beta associations onboarded

**Status:** ⚪ Not Started - 0/15 tasks complete

### 5.1 End-to-End Testing (6 tasks)

- [ ] Test complete admin workflow:
  - [ ] Sign up / sign in
  - [ ] View dashboard overview
  - [ ] Filter and sort team list
  - [ ] View team detail
  - [ ] View transactions (paginated)
  - [ ] Generate both reports
- [ ] Test snapshot job:
  - [ ] Trigger manually via GitHub Actions
  - [ ] Verify snapshots created for all teams
  - [ ] Verify health status calculated correctly
  - [ ] Verify alerts generated and resolved
- [ ] Test with realistic data:
  - [ ] Create test association with 50+ teams
  - [ ] Verify dashboard loads in <2 seconds
  - [ ] Verify reports generate in <10 seconds
- [ ] Test error scenarios:
  - [ ] HuddleBooks API unavailable
  - [ ] Invalid team access token
  - [ ] Database connection issues
- [ ] Test authorization:
  - [ ] Admin can access all features
  - [ ] Board member has read-only access
  - [ ] User cannot see other associations
- [ ] Test on multiple browsers:
  - [ ] Chrome, Safari, Firefox, Edge

### 5.2 Security Review (3 tasks)

- [ ] Verify data isolation:
  - [ ] Users can only see their association data
  - [ ] API routes check association membership
- [ ] Verify read-only access:
  - [ ] No mutation endpoints exist for team data
  - [ ] Association cannot edit team transactions
- [ ] Review environment variable handling:
  - [ ] No secrets in client-side code
  - [ ] Access tokens encrypted in database

### 5.3 Production Deployment (3 tasks)

- [ ] Deploy to Vercel production:
  - [ ] Connect repository
  - [ ] Configure production environment variables
  - [ ] Set up custom domain (optional)
- [ ] Verify production deployment:
  - [ ] All pages load correctly
  - [ ] Auth flow works
  - [ ] Database connection successful
- [ ] Enable monitoring:
  - [ ] Vercel Analytics
  - [ ] Error tracking (Sentry optional)

### 5.4 Beta Launch (3 tasks)

- [ ] Onboard 3-5 beta associations:
  - [ ] Create association records in database
  - [ ] Connect their teams (OAuth flow)
  - [ ] Schedule onboarding calls
- [ ] Monitor for issues:
  - [ ] Check snapshot job success daily
  - [ ] Review error logs
  - [ ] Respond to feedback quickly
- [ ] Collect feedback:
  - [ ] What's working well?
  - [ ] What's confusing?
  - [ ] What's missing?

**Phase 5 Deliverable:** ✅ Production deployed, beta associations using dashboard

---

## 📊 Success Metrics Tracking

### Functional Metrics
- [ ] Admin can view all teams in <5 minutes ✅ Target met
- [ ] Dashboard loads in <2 seconds ✅ Target met
- [ ] Reports generate in <10 seconds ✅ Target met
- [ ] Snapshot job completes for 200 teams ✅ Target met
- [ ] Alerts correctly identify at-risk teams ✅ Target met

### Technical Metrics
- [ ] Zero data leakage between associations ✅ Target met
- [ ] 99.9% snapshot job success rate ✅ Target met
- [ ] API responses in <500ms ✅ Target met
- [ ] Mobile responsive on all pages ✅ Target met

### User Metrics
- [ ] 3 beta associations onboarded ✅ Target met
- [ ] 80% of teams connected per association ✅ Target met
- [ ] Positive feedback on ease of use ✅ Target met

---

## 🚨 Current Blockers

**None** - Ready to start Phase 0

---

## 📝 Notes for Claude Code

### Key Files to Create First
1. `prisma/schema.prisma` - Database schema (copy from PRD)
2. `src/lib/db/prisma.ts` - Prisma client singleton
3. `src/lib/huddlebooks/client.ts` - HuddleBooks API client
4. `src/lib/snapshots/health.ts` - Health calculation logic
5. `supabase/functions/run-daily-snapshots/index.ts` - Snapshot job

### Important Patterns
- Use server components for data fetching
- Use `use client` only when needed (interactivity)
- All money values stored as `NUMERIC(10,2)` in database
- All timestamps use `TIMESTAMPTZ` (timezone-aware)
- Health status: `'healthy' | 'needs_attention' | 'at_risk'`

### API Response Format
```typescript
// Success
{ data: T, error: null }

// Error
{ data: null, error: { code: string, message: string } }
```

### Health Status Rules (Reference)
```typescript
const isHealthy = 
  percentUsed < 80 &&
  daysSinceReconciled <= 30 &&
  pendingApprovals < 5

const isAtRisk = 
  percentUsed > 95 ||
  daysSinceReconciled > 60 ||
  pendingApprovals > 10

// Otherwise: 'needs_attention'
```

---

## 🎉 Milestone Celebrations

- [ ] 🎯 Phase 0 complete - Infrastructure ready!
- [ ] 🎯 Phase 1 complete - Snapshots flowing!
- [ ] 🎯 Phase 2 complete - Dashboard live!
- [ ] 🎯 Phase 3 complete - Alerts working!
- [ ] 🎯 Phase 4 complete - Reports generating!
- [ ] 🎯 Phase 5 complete - Beta launch! 🚀
- [ ] 🎯 First association onboarded
- [ ] 🎯 First 50 teams monitored
- [ ] 🎯 First board report generated

---

## 📚 Resources

- **PRD:** `HuddleBooks-Association-Command-Center-PRD.md`
- **Task Tracker:** This file!
- **Team HuddleBooks PRD:** `TeamTreasure-PRD.md`
- **Database Schema:** See PRD Appendix

---

**Last Updated:** November 24, 2025  
**Next Review:** End of Week 1 (Phase 0 complete)

**Let's build this control tower! 🏒📊**
