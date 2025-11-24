# Product Requirements Document
## HuddleBooks Association Command Center: Multi-Team Financial Oversight Platform

**Version:** 1.0  
**Date:** November 24, 2025  
**Document Owner:** Mike Dunbar, Founder  
**Product:** HuddleBooks Association Command Center  
**Status:** Ready for Development

---

## 📋 Executive Summary

### Product Vision

The HuddleBooks Association Command Center is a centralized "control tower" that enables minor hockey association staff to monitor the financial health of all teams within their organization at a glance. Building on HuddleBooks' team-level fraud prevention capabilities, this dashboard extends protection and transparency to the association level.

### MVP Goals

By the end of MVP, an association admin can:

1. **See which teams are healthy vs. need attention in under 5 minutes**
2. **Drill into any team for details when there's a problem**
3. **Generate 1-2 board-ready reports in under 2 minutes**

Everything else is Phase 2+.

### The Opportunity

- **5,000+** minor hockey associations across North America
- Each association manages **10-50+ teams** with independent finances
- **Zero visibility** into team-level financial health at association level
- **High fraud risk** due to lack of oversight (OMHA: $2.4M stolen)
- **Insurance requirements** increasingly demanding financial controls

### Business Model

**SaaS Add-on:** $500-1,500/year per association (tiered by team count)

- Requires all teams to use HuddleBooks ($149-249/team/year)
- Creates strong retention and network effects within associations

### Why Now

Post-OMHA scandal, associations are being held accountable for team-level fraud. Insurance companies want evidence of oversight. Association staff currently have zero tools to monitor 30+ teams efficiently.

---

## 🎯 Product Overview

### What It Does

The Association Command Center is a **read-only, analytics-focused platform** that aggregates financial data from all teams using HuddleBooks within an association. It provides:

1. **Real-time financial health monitoring** across all teams
2. **Risk detection and alerting** for potential fraud or financial distress
3. **Compliance tracking** to ensure teams follow financial policies
4. **Board-ready reporting** generated in seconds

### What It Does NOT Do (MVP)

- Edit team data (read-only access only)
- Approve transactions on behalf of teams
- Replace team-level HuddleBooks functionality
- Provide AI/ML fraud detection (Phase 2+)
- Offer benchmarking analytics (Phase 2+)
- Include a mobile app (Phase 2+)

### Core Value Proposition

**"Association-wide financial oversight in 5 minutes per week"**

Transform from reactive (discovering problems months later) to proactive (identifying issues daily) financial governance across your entire organization.

---

## 👥 Target Users

### Primary User: Association Administrator

**Profile:**
- **Role:** Executive Director, Operations Manager, Financial Officer
- **Employment:** Part-time or full-time paid staff (not volunteer)
- **Technical Skill:** Medium (comfortable with web apps)
- **Responsibilities:**
  - Oversee 10-50+ teams within association
  - Report to association board of directors
  - Support volunteer treasurers when issues arise
  - Prepare quarterly/annual financial summaries

**Pain Points:**
- Spending 10-15 hours per quarter reviewing Excel spreadsheets
- Discovering financial problems months too late
- No visibility into which teams need support
- Manual consolidation of team reports for board meetings

**Goals:**
- Identify at-risk teams before crises occur
- Reduce financial oversight from hours to minutes
- Provide data-driven insights to board
- Meet insurance and compliance requirements effortlessly

**Success Criteria:**
- Can review all team finances in <5 minutes per week
- Receives automatic alerts for teams needing attention
- Generates board reports in <2 minutes

---

### Secondary User: Association Board Member

**Profile:**
- **Role:** President, VP Finance, Board Director
- **Employment:** Volunteer (unpaid)
- **Technical Skill:** Low to Medium
- **Responsibilities:**
  - Fiduciary oversight of association finances
  - Review financial reports at monthly board meetings

**Goals:**
- Understand financial health at a glance
- Fulfill fiduciary duty with confidence
- Make informed policy decisions based on data

**Success Criteria:**
- Can understand association-wide financial health in <3 minutes
- Receives clear visual indicators (green/yellow/red)

---

## ✨ MVP Features (5 Features Only)

### Feature 1: Association Overview Dashboard

**Purpose:** Single-screen view of entire association's financial health

**UI Components:**

**Header Section:**
- Association name and current season
- "Data as of: [timestamp]" indicator (builds trust for daily snapshots)

**KPI Cards:**
- Total Teams: X
- Health Distribution: Y Healthy / Z Needs Attention / W At Risk
- Total Budget (all teams combined)
- Total Spent (all teams combined)
- Total Remaining (all teams combined)

**Health Summary Chart:**
- Simple donut or bar chart showing distribution of health statuses

**Teams Needing Attention List:**
- Top 5-10 teams ordered by risk (red first, then yellow)
- Shows: Team Name, Division, Health Status, % Budget Used, Red Flag Count
- Click to navigate to Team Detail

**Recent Alerts Section:**
- Last 5 alerts (title, team name, created_at)
- Click to navigate to Team Detail

**Functional Requirements:**
- Read data from aggregated daily snapshots (no live queries per team)
- Show only teams linked to the association and marked active
- Load time target: <2 seconds for up to 200 teams

**Acceptance Criteria:**
- Dashboard renders without error for association with 5+ teams
- KPI cards are populated correctly
- Health counts match underlying team snapshots
- "Teams Needing Attention" shows red teams first, then yellow
- Empty state displayed when no alerts exist

---

### Feature 2: Team List with Health Scores

**Purpose:** Sortable/filterable table of all teams with health indicators

**Table Columns:**
| Column | Description |
|--------|-------------|
| Team Name | e.g., "U13 AA Storm" |
| Division | e.g., "U13 AA" |
| Health Status | Color + label (Healthy / Needs Attention / At Risk) |
| Budget Total | Dollar amount |
| Spent | Dollar amount |
| Remaining | Dollar amount |
| % Used | Percentage |
| Last Activity | Timestamp of most recent transaction |
| Red Flag Count | Integer count of active issues |

**Controls:**
- Search by team name (client-side filter)
- Filter by Health Status (All / Healthy / Needs Attention / At Risk)
- Sort by any numeric column (ascending/descending)
- Pagination (50 teams per page)

**Health Status Rules:**

| Status | Criteria |
|--------|----------|
| **Healthy** (Green) | percent_used < 80% AND bank reconciled within 30 days AND pending_approvals < 5 |
| **Needs Attention** (Yellow) | 80% ≤ percent_used ≤ 95% OR bank not reconciled 31-60 days OR pending_approvals 5-10 |
| **At Risk** (Red) | percent_used > 95% OR bank not reconciled >60 days OR pending_approvals > 10 |

*Thresholds are stored in `dashboard_config` table for future tuning.*

**Functional Requirements:**
- Sorting and filtering are server-side (query params to API)
- Clicking a row navigates to Team Detail
- Red flag count derived from alert engine

**Acceptance Criteria:**
- Given 100 teams, admin can filter to only red teams
- Admin can sort by % Used descending
- Clicking a team opens correct Team Detail page
- Health statuses match defined rules for test cases

---

### Feature 3: Team Detail (Read-Only Deep Dive)

**Purpose:** Complete financial view of a single team

**UI Sections:**

**Header:**
- Team Name, Division, Season
- Treasurer Name + Email (read-only)
- Health Status (color + label)

**Budget Summary Card:**
- Budget Total, Spent, Remaining, % Used
- Simple progress bar for % Used

**Category Breakdown Table:**
| Category Name | Budgeted | Spent | Remaining | Status |
|---------------|----------|-------|-----------|--------|
| Ice Time | $25,000 | $18,000 | $7,000 | On Track |
| Tournaments | $8,000 | $8,200 | -$200 | Over |

*Status: On Track (<80%), Warning (80-95%), Over (>95%)*

**Transactions List (Paginated):**
| Date | Type | Vendor | Amount | Status |
|------|------|--------|--------|--------|
| 2025-10-01 | Expense | City Arena | $1,250 | Approved |

- Default page size: 25 (max: 100)
- Filters: Date range, Type (Income/Expense), Status
- Default date range: Current season

**Red Flags Section:**
- List of active red flags for this team:
  - "Budget 97% used with 4 weeks remaining"
  - "Bank not reconciled for 45 days"
  - "Pending approvals: 12"

**Functional Requirements:**
- **Read-only:** No editing, no approving, no creating transactions
- Summary & budget from daily snapshot
- Transactions fetched in real-time from HuddleBooks API (paginated)

**Acceptance Criteria:**
- Clicking team from Team List opens Team Detail with correct data
- Budget numbers match Team List (same snapshot)
- Red flags list matches alerts for that team
- No mutation actions exist (edit/approve buttons not present)

---

### Feature 4: Core Alerts & Alert List

**Purpose:** Proactive identification of teams needing intervention

**Alert Types (MVP - Hard-coded Rules):**

| Alert Type | Warning Trigger | Critical Trigger |
|------------|-----------------|------------------|
| Budget Utilization | ≥80% used | ≥95% used |
| Bank Reconciliation | >30 days | >60 days |
| Pending Approvals | ≥5 pending | ≥10 pending |
| Inactivity | >21 days no activity | - |

*`last_activity` = max(last_transaction_date, last_snapshot_created_at)*

**Alert Deduplication Rules:**
- At most **one active alert** per (association_team_id, alert_type)
- If condition persists, update `last_triggered_at` (don't create new)
- When condition clears, set `status='resolved'` and `resolved_at=NOW()`

**Alert Generation:**
- Runs when daily snapshot job completes
- If condition moves false → true: create new active alert
- If condition moves true → false: mark existing alert resolved

**UI Components:**

**Alert Badge (Header):**
- Shows count of active alerts

**Alerts Page:**
| Created At | Severity | Team Name | Alert Type | Description |
|------------|----------|-----------|------------|-------------|
| Nov 23, 2:00 PM | Critical | U13 AA Storm | Budget | Budget 97% used |

- Filter by: Severity, Type, Team
- Sort by: Severity (Critical first), then Created At
- Click row to open Team Detail

**Acceptance Criteria:**
- Given team with percent_used=96, bank_reconciled=70 days ago, pending_approvals=12:
  - System generates 3 alerts (budget critical, bank critical, approvals critical)
- When conditions no longer apply in next snapshot:
  - Alerts are marked resolved
- Alerts page loads sorted by severity, then created_at

---

### Feature 5: Reports (2 PDF Reports Only)

**Purpose:** Board-ready reports generated in seconds

**Report 1: Board Financial Summary**

Contents:
- Association name, season, generation date
- KPI summary:
  - Total budget / total spent / remaining
  - Teams by status: Healthy / Needs Attention / At Risk
- Simple charts:
  - Donut showing team health distribution
- Teams at risk list:
  - Team name, health status, % budget used
  - Top 1-2 red flags per team

**Report 2: Compliance Snapshot**

Contents:
- Association name, season, generation date
- Compliance percentages:
  - % of teams with bank account connected
  - % of teams reconciled in last 30 days
  - % of teams under 95% budget used
  - % of teams with <5 pending approvals
- Summary of active alerts by type

**Functional Requirements:**
- Reports generated on-demand via button click
- Backend fetches current aggregated data
- Renders PDF template, returns downloadable file
- Stores URL in `reports` table for history
- Generation time target: <10 seconds

**Rate Limiting:**
- Max 1 report generation per admin per 60 seconds per report type
- Enforced via `generated_at` + `generated_by` in reports table

**Acceptance Criteria:**
- Clicking "Generate Board Summary" produces PDF with:
  - All numbers matching dashboard at time of generation
  - Teams listed as at risk matching current Team List
- Clicking "Generate Compliance Snapshot" produces PDF with:
  - Correct percentages based on team snapshots
- PDFs are legible, minimally branded, work for up to 200 teams

---

## 🔧 Technical Architecture

### Data Flow Overview

```
┌─────────────────────────────────────────────────────────┐
│           HuddleBooks Team Instance (x30-200)           │
│    Each team has own database with transactions,        │
│    budgets, approvals, bank data                        │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │ Read-Only API (OAuth 2.0)
                           │ Called once per day per team
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Daily Snapshot Job                         │
│    (Supabase Edge Function + GitHub Actions Cron)       │
│                                                         │
│    - Runs at 3 AM UTC daily                            │
│    - Loops through all active association_teams        │
│    - Calls HuddleBooks /summary API per team           │
│    - Calculates health status                          │
│    - Inserts team_financial_snapshots                  │
│    - Evaluates and creates/resolves alerts             │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │ Writes to
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL Database               │
│                                                         │
│    - associations                                       │
│    - association_users                                  │
│    - association_teams                                  │
│    - team_financial_snapshots                          │
│    - alerts                                            │
│    - reports                                           │
│    - dashboard_config                                  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │ Reads from
                           ▼
┌─────────────────────────────────────────────────────────┐
│           Association Command Center UI                 │
│              (Next.js + Vercel)                        │
│                                                         │
│    Dashboard → reads latest snapshots                   │
│    Team Detail → reads snapshot + live transactions    │
│    Reports → reads snapshots, generates PDF            │
└─────────────────────────────────────────────────────────┘
```

### Daily Snapshot Strategy

**Why Daily (Not Real-Time):**
- Association admins check in weekly, not continuously
- Team finances don't change minute-to-minute (2-5 transactions/week)
- Simplifies infrastructure (no websockets, no complex caching)
- Reduces API load on HuddleBooks
- Sufficient for early fraud detection (catching issues in days vs months)

**Execution:**
- **Trigger:** GitHub Actions cron at 3 AM UTC daily
- **Worker:** Supabase Edge Function (TypeScript)
- **Duration:** ~2-3 minutes for 200 teams (500ms delay between calls)
- **Cost:** $0 (free tiers for both services)

**"Data as of" Display:**
- All dashboard views show: "Data as of: Nov 24, 2025, 3:15 AM"
- Based on `last_synced_at` from most recent snapshot
- Builds trust when users understand data freshness

---

### Database Schema

#### associations
```sql
CREATE TABLE associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(32),
  province_state VARCHAR(64),
  country VARCHAR(64),
  logo_url VARCHAR(500),
  season VARCHAR(32),  -- e.g. "2025-2026"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### association_users
```sql
CREATE TABLE association_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(32) NOT NULL,  -- 'association_admin', 'board_member', 'auditor'
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### association_teams
```sql
CREATE TABLE association_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,

  -- HuddleBooks identifiers
  team_id VARCHAR(255) NOT NULL,  -- HuddleBooks team ID
  team_name VARCHAR(255) NOT NULL,
  division VARCHAR(64),
  season VARCHAR(32),

  -- OAuth / connection
  api_access_token TEXT,          -- encrypted at app layer
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,

  -- State
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Treasurer info (read-only mirror)
  treasurer_name VARCHAR(255),
  treasurer_email VARCHAR(255),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (association_id, team_id)
);
```

#### team_financial_snapshots
```sql
CREATE TABLE team_financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_team_id UUID NOT NULL REFERENCES association_teams(id) ON DELETE CASCADE,

  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Health
  health_status VARCHAR(16) NOT NULL,  -- 'healthy', 'needs_attention', 'at_risk'
  health_score INT,                    -- optional numeric score (Phase 2)

  -- Budget figures
  budget_total NUMERIC(10,2),
  spent NUMERIC(10,2),
  remaining NUMERIC(10,2),
  percent_used NUMERIC(5,2),

  -- Operational metrics
  pending_approvals INT,
  missing_receipts INT,
  bank_reconciled_through DATE,
  bank_connected BOOLEAN,
  last_activity_at TIMESTAMPTZ,

  -- Flags
  red_flags JSONB,  -- array of {code, message}

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_team_time
  ON team_financial_snapshots (association_team_id, snapshot_at DESC);
```

#### alerts
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  association_team_id UUID NOT NULL REFERENCES association_teams(id) ON DELETE CASCADE,

  alert_type VARCHAR(64) NOT NULL,     -- 'budget_utilization', 'bank_reconciliation', 'pending_approvals', 'inactivity'
  severity VARCHAR(16) NOT NULL,       -- 'warning', 'critical'

  title VARCHAR(255) NOT NULL,
  description TEXT,

  status VARCHAR(16) NOT NULL DEFAULT 'active',  -- 'active', 'resolved'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES association_users(id),

  last_triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  notes TEXT,

  -- Deduplication constraint
  CONSTRAINT uq_active_alert UNIQUE (association_team_id, alert_type, status)
    DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX idx_alerts_active 
  ON alerts (association_id, status, severity, created_at DESC)
  WHERE status = 'active';
```

#### reports
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES association_users(id),

  report_type VARCHAR(32) NOT NULL,  -- 'board_summary', 'compliance_snapshot'
  date_range_start DATE,
  date_range_end DATE,

  file_url VARCHAR(500),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_association_type_time
  ON reports (association_id, report_type, generated_at DESC);
```

#### dashboard_config
```sql
CREATE TABLE dashboard_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL UNIQUE REFERENCES associations(id) ON DELETE CASCADE,

  -- Budget thresholds
  budget_warning_pct NUMERIC(5,2) NOT NULL DEFAULT 80.0,
  budget_critical_pct NUMERIC(5,2) NOT NULL DEFAULT 95.0,

  -- Bank reconciliation thresholds (days)
  bank_warning_days INT NOT NULL DEFAULT 30,
  bank_critical_days INT NOT NULL DEFAULT 60,

  -- Pending approvals thresholds
  approvals_warning_count INT NOT NULL DEFAULT 5,
  approvals_critical_count INT NOT NULL DEFAULT 10,

  -- Inactivity threshold (days)
  inactivity_warning_days INT NOT NULL DEFAULT 21,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### API Contracts

#### HuddleBooks Team APIs (Read-Only)

**Base Path:** `https://api.huddlebooks.app/api/v1/teams/{teamId}`  
**Authorization:** `Bearer <team_scoped_readonly_token>`

**GET /summary**
```json
{
  "teamId": "team_123",
  "teamName": "U13 AA Storm",
  "division": "U13 AA",
  "season": "2025-2026",
  "treasurer": {
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "lastActivityAt": "2025-11-23T14:32:10Z",
  "financial": {
    "budgetTotal": 45000.00,
    "spent": 32000.00,
    "remaining": 13000.00,
    "percentUsed": 71.11
  },
  "bank": {
    "connected": true,
    "lastSyncedAt": "2025-11-23T14:30:00Z",
    "reconciledThrough": "2025-10-31"
  },
  "counts": {
    "pendingApprovals": 3,
    "missingReceipts": 1
  }
}
```

**GET /budget**
```json
{
  "categories": [
    {
      "name": "Ice Time",
      "budgeted": 25000.00,
      "spent": 18000.00,
      "remaining": 7000.00,
      "percentUsed": 72.0,
      "status": "on_track"
    }
  ],
  "totals": {
    "budgeted": 45000.00,
    "spent": 32000.00,
    "remaining": 13000.00,
    "percentUsed": 71.11
  }
}
```

**GET /transactions**

Query params: `limit`, `offset`, `status`, `type`, `startDate`, `endDate`

```json
{
  "transactions": [
    {
      "id": "txn_001",
      "date": "2025-10-01",
      "type": "expense",
      "amount": 1250.00,
      "category": "Ice Time",
      "vendor": "City Arena",
      "status": "approved",
      "approvedBy": "John Coach",
      "approvedAt": "2025-10-02T10:15:00Z",
      "receiptUrl": "https://files.huddlebooks.app/receipts/txn_001.pdf"
    }
  ],
  "total": 374,
  "hasMore": true
}
```

#### Internal Dashboard APIs

**GET /api/associations/:id/overview**
```json
{
  "associationId": "assoc_123",
  "name": "Newmarket Minor Hockey",
  "season": "2025-2026",
  "dataAsOf": "2025-11-23T03:15:00Z",
  "totals": {
    "teamCount": 32,
    "statusCounts": {
      "healthy": 24,
      "needsAttention": 6,
      "atRisk": 2
    },
    "budgetTotal": 500000.00,
    "spent": 350000.00,
    "remaining": 150000.00
  },
  "topAttentionTeams": [...],
  "recentAlerts": [...]
}
```

**GET /api/associations/:id/teams**

Query params: `page`, `pageSize`, `status`, `search`, `sortBy`, `sortDir`

**GET /api/teams/:associationTeamId**

Returns snapshot data + triggers live transaction fetch from HuddleBooks.

---

### Authentication & Authorization

**Provider:** Clerk

**Roles:**
| Role | Dashboard Access | Reports | Team Detail |
|------|------------------|---------|-------------|
| association_admin | Full | Generate | Full |
| board_member | Read-only | Download | Read-only |
| auditor | Read-only | Download | Full + Audit Trail |

**Data Isolation:**
- Users can only see data for their association
- Enforced at API layer via `association_id` checks

---

## 📊 Success Metrics

### Product Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Weekly Admin Logins | 80% of admins | Analytics |
| Time on Dashboard | 5-7 min/session | Analytics |
| Report Generation | 2+ reports/month | Database |
| Alert Response Time | <24 hours | Alert timestamps |

### Business Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| Associations Onboarded | 50 | Year 1 |
| Teams Connected | 80% per association | Within 30 days |
| Revenue per Association | $500-1,500/year | - |
| Churn Rate | <15% annually | - |

### Technical Metrics

| Metric | Target |
|--------|--------|
| Dashboard Load Time | <2 seconds |
| Report Generation | <10 seconds |
| Snapshot Job Success | 99.9% |
| Uptime | 99.9% |

---

## 🗓️ Development Timeline

### Phase 1: Foundation (Week 1-2)

**Week 1:**
- [ ] Set up Next.js project structure
- [ ] Configure Supabase database
- [ ] Create database migrations (all 7 tables)
- [ ] Implement Clerk authentication
- [ ] Create association_admin role

**Week 2:**
- [ ] Build HuddleBooks API client
- [ ] Create daily snapshot Edge Function
- [ ] Set up GitHub Actions cron trigger
- [ ] Build health status calculation logic
- [ ] Implement alert generation engine

### Phase 2: Dashboard UI (Week 3-4)

**Week 3:**
- [ ] Build Association Overview page (Feature 1)
- [ ] Build Team List page (Feature 2)
- [ ] Implement sorting/filtering
- [ ] Add pagination

**Week 4:**
- [ ] Build Team Detail page (Feature 3)
- [ ] Build Alerts page (Feature 4)
- [ ] Add "Data as of" timestamp display
- [ ] Mobile-responsive polish

### Phase 3: Reports & Polish (Week 5-6)

**Week 5:**
- [ ] Build Board Financial Summary PDF (Feature 5)
- [ ] Build Compliance Snapshot PDF (Feature 5)
- [ ] Implement report rate limiting
- [ ] Store reports in database

**Week 6:**
- [ ] End-to-end testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Documentation

### Phase 4: Beta Launch (Week 7-8)

**Week 7:**
- [ ] Deploy to production (Vercel + Supabase)
- [ ] Onboard 3-5 beta associations
- [ ] Connect teams to dashboard

**Week 8:**
- [ ] Monitor for issues
- [ ] Collect feedback
- [ ] Prioritize Phase 2 features

---

## 🚫 Explicitly Out of Scope (MVP)

The following will NOT be built in V1:

- Division-level benchmarking and advanced analytics
- AI/ML fraud detection or risk scoring
- Full audit export suite
- Team communication module (messaging, tickets)
- Policy enforcement engine
- Mobile apps (native iOS/Android)
- Public-facing parent transparency portal
- Real-time data (will use daily snapshots)
- Multi-association support (regional bodies)

These are candidates for Phase 2+ once MVP is validated.

---

## 📚 Appendix

### Glossary

| Term | Definition |
|------|------------|
| Association | Minor hockey organization overseeing multiple teams |
| Team | Individual hockey team within association |
| Snapshot | Point-in-time capture of team financial data |
| Health Status | Calculated indicator: Healthy / Needs Attention / At Risk |
| Red Flag | Specific issue requiring investigation |

### Related Documents

- `TeamTreasure-PRD.md` - Team-level HuddleBooks product requirements
- `TeamTreasure-MVP-TASKS.md` - Team-level development task tracker
- `DATABASE-SCHEMA.md` - Team-level database schema

### Open Questions (To Resolve)

1. Should associations pay per-team or flat rate?
2. How should we handle teams that don't grant access?
3. What reports do insurance companies actually need?
4. Should board_member role require separate login?

---

## ✅ Document Approval

**Created by:** Mike Dunbar, Founder  
**Version:** 1.0  
**Date:** November 24, 2025  
**Status:** Ready for Development

---

*End of PRD*
