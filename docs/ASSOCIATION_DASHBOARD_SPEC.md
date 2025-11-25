# Association Dashboard Feature Specification

**Feature Name:** Association/League Multi-Team Dashboard
**Version:** 1.0
**Status:** Planning (Phase 2 Feature)
**Target Release:** Post-MVP (Q2 2026)
**Priority:** High (Key revenue expansion opportunity)

---

## Executive Summary

### Problem Statement
Youth sports associations (hockey leagues, tournaments, regional associations) have **fiduciary responsibility** to oversee the financial health and compliance of 10-100+ member teams. Currently, they have **zero visibility** into team finances until problems arise (fraud, bankruptcy, parent complaints).

### Solution
A league-level dashboard that provides **aggregated financial oversight** across all member teams, enabling associations to:
- Monitor financial health of teams in real-time
- Identify at-risk teams before problems escalate
- Verify compliance with league financial policies
- Acknowledge receipt of season-end financial packages
- Generate league-wide financial reports

### Core Value Proposition
**For Associations:**
- Risk mitigation: Catch financial problems early
- Compliance verification: Ensure all teams follow policies
- Audit support: Complete financial visibility
- Parent trust: Demonstrate league oversight

**For TeamTreasure (Business):**
- Higher ACV: League deals ($2,500-$10,000/year vs. $149/team)
- Faster expansion: One league = 20-50 teams
- Stickier product: League contracts = multi-year commitments
- Network effects: League adoption drives team adoption

### What Makes This Different
Unlike team-level dashboards (which show *transactions*), association dashboards show:
- **Aggregated metrics** across teams
- **Compliance status** (not transaction details)
- **Risk indicators** (teams needing attention)
- **Oversight tools** (not day-to-day management)

---

## Target Users

### Primary: League Administrator
**Profile:**
- Age 45-60, volunteer or part-time paid position
- Oversees 15-50 teams in a regional hockey association
- Responsible for league compliance and risk management
- Limited time (5-10 hours/week for all league admin tasks)

**Pain Points:**
- No visibility into team finances until crisis
- Parents complain to league when team has financial problems
- Manual collection of season-end reports (Excel via email)
- No way to verify teams are following dual-approval policies
- Risk of league liability if team commits fraud

**Success Metric:**
- Can identify at-risk teams in <5 minutes/week
- 100% compliance verification without manual work
- Zero surprises at season end

### Secondary: League Treasurer/CFO
**Profile:**
- Professional accountant or finance executive (volunteer)
- Manages league-level finances (registration fees, tournament revenue, insurance)
- Needs consolidated reports for board meetings
- Responsible for annual financial statements

**Pain Points:**
- Cannot roll up team finances into league reports
- No standardized financial format across teams
- Manual reconciliation of team fees paid to league
- Audit preparation requires chasing down team treasurers

**Success Metric:**
- Generate league-wide financial report in <10 minutes
- All team data available in standard format
- Audit-ready exports

### Tertiary: League President/Board
**Profile:**
- Oversight role, not day-to-day operations
- Views dashboards quarterly for board meetings
- Needs high-level health indicators

**Success Metric:**
- Understand league financial health at a glance
- Identify trends (teams over/under budget)

---

## User Stories

### Oversight & Monitoring
1. **As a league administrator**, I want to see a list of all teams in my league with their financial health status so I can quickly identify teams that need attention.

2. **As a league administrator**, I want to see which teams have completed their dual-approval setup so I can verify fraud prevention policies are in place.

3. **As a league administrator**, I want to receive alerts when a team's budget variance exceeds 20% so I can proactively offer support before problems escalate.

4. **As a league administrator**, I want to see which teams have submitted their end-of-season financial packages so I can track compliance and follow up with late teams.

5. **As a league treasurer**, I want to generate a consolidated financial report across all teams so I can present league-wide financials to the board.

### Compliance & Audit
6. **As a league administrator**, I want to verify that all teams have dual-approval enabled on expenses over $200 so I can demonstrate league compliance with financial policies.

7. **As a league administrator**, I want to see which teams have missing receipts for large expenses so I can enforce league receipt requirements.

8. **As a league administrator**, I want to acknowledge receipt of team season-end packages so teams know their submissions were received.

9. **As a league auditor**, I want to export all team audit logs for a specific date range so I can perform league-wide financial audits.

### Team Support
10. **As a league administrator**, I want to see which teams are approaching budget limits so I can offer financial planning assistance.

11. **As a league administrator**, I want to identify teams with low parent transparency (parents not viewing budgets) so I can encourage better communication.

12. **As a league administrator**, I want to compare team budgets across similar divisions (Bantam AA, Midget A) so I can identify outliers and provide benchmarking data.

---

## Core Features

## Feature 1: League-Level Dashboard ⭐ CRITICAL

### Description
Aggregated dashboard showing financial health, compliance status, and key metrics for all teams in the league.

### Requirements

#### Dashboard Overview
- **League Summary Card**
  - Total teams in league
  - Teams with healthy budgets (green status)
  - Teams with budget concerns (yellow/red status)
  - Teams missing compliance requirements
  - Total league-wide expenses (current season)
  - Total league-wide income (current season)

- **Team Health Status List**
  - Team name, division, level
  - Financial health indicator (🟢 Healthy, 🟡 Warning, 🔴 Danger)
  - Budget status (% used)
  - Compliance status (dual-approval enabled, receipts complete)
  - Last activity date
  - Quick action buttons (View Details, Contact Treasurer)

- **Alerts & Notifications Panel**
  - Teams >90% budget used
  - Teams with pending compliance issues
  - Teams that haven't submitted season-end packages (when due)
  - Teams with rejected transactions (potential issues)

#### Team Health Calculation
```typescript
TeamHealthStatus = {
  HEALTHY: Budget <70% used, all compliance met, active in last 30 days
  WARNING: Budget 70-90% used OR 1-2 compliance issues OR inactive 30-60 days
  AT_RISK: Budget >90% used OR 3+ compliance issues OR inactive >60 days
  CRITICAL: Budget exceeded OR no dual-approval setup OR major compliance violations
}
```

#### Compliance Indicators
```typescript
ComplianceChecks = {
  dualApprovalEnabled: Team has assigned approver (president or board member)
  recentActivity: At least 1 transaction in last 60 days
  receiptCompliance: >90% of expenses >$100 have receipts
  seasonClosureSubmitted: Season-end package submitted (when applicable)
  budgetSetup: Budget allocations exist for current season
}
```

### API Endpoints

```typescript
// GET /api/league/dashboard
{
  league: {
    id: "league_123",
    name: "Greater Toronto Hockey League",
    season: "2024-2025",
    teamCount: 42
  },
  summary: {
    totalTeams: 42,
    healthyTeams: 35,
    warningTeams: 5,
    atRiskTeams: 2,
    totalIncome: 1250000.00,    // Across all teams
    totalExpenses: 980000.00,    // Across all teams
    avgBudgetUsed: 78.4          // Average % across teams
  },
  teams: [
    {
      id: "team_456",
      name: "Bantam AA Storm",
      division: "Bantam",
      level: "AA",
      healthStatus: "HEALTHY",
      budgetTotal: 25000.00,
      budgetUsed: 18750.00,
      budgetPercentUsed: 75.0,
      compliance: {
        dualApprovalEnabled: true,
        receiptCompliance: 95.0,
        lastActivity: "2025-01-15T10:30:00Z",
        seasonClosureSubmitted: false
      },
      treasurer: {
        name: "Sarah Thompson",
        email: "sarah@example.com",
        lastLogin: "2025-01-15T10:30:00Z"
      }
    },
    // ... more teams
  ],
  alerts: [
    {
      teamId: "team_789",
      teamName: "Midget A Lightning",
      severity: "HIGH",
      type: "BUDGET_EXCEEDED",
      message: "Team budget exceeded by $2,400 (109.6% used)",
      createdAt: "2025-01-14T08:00:00Z"
    }
  ]
}
```

---

## Feature 2: Team Detail View (League Perspective) ⭐ CRITICAL

### Description
Deep-dive view of a single team's financial health from the league administrator's perspective. **Important:** League admins see *aggregated data and compliance*, NOT individual transactions (privacy protection).

### Requirements

#### Team Overview
- Team info (name, division, level, season)
- Treasurer contact information
- Financial health score (0-100)
- Compliance checklist with status

#### Financial Summary (Aggregated Only)
- Budget vs. actual by category (chart)
- Total income and expenses (numbers only, no transaction details)
- Budget variance percentage
- Spending trend over time (monthly aggregates)

#### Compliance Details
- ✅ Dual-approval enabled: Yes/No
- ✅ Receipt compliance: 95% (38/40 expenses have receipts)
- ✅ Audit trail active: All actions logged
- ⚠️ Season closure: Not submitted (due March 15)
- ✅ Last activity: 3 days ago

#### Risk Indicators
- Budget burn rate ($/month)
- Projected end-of-season balance
- Number of rejected transactions (last 90 days)
- Number of overdue approvals (if >5, may indicate treasurer/approver conflict)

#### Actions Available to League Admin
- 📧 Send email to treasurer
- ✅ Acknowledge season closure submission
- 📝 Add private admin notes (visible only to league admins)
- 📊 Export compliance report for this team
- 🚨 Flag team for review (adds to board meeting agenda)

### What League Admins CANNOT See (Privacy Protection)
- ❌ Individual transaction details (vendor names, amounts, dates)
- ❌ Receipt images
- ❌ Approval comments
- ❌ Parent names or contact information
- ❌ Audit log details (who approved what)

**Rationale:** League oversight is about *compliance and risk*, not micromanaging team operations. Protecting transaction privacy maintains treasurer autonomy and prevents league overreach.

### API Endpoints

```typescript
// GET /api/league/teams/:teamId
{
  team: {
    id: "team_456",
    name: "Bantam AA Storm",
    division: "Bantam",
    level: "AA",
    season: "2024-2025",
    budgetTotal: 25000.00
  },
  treasurer: {
    name: "Sarah Thompson",
    email: "sarah@example.com",
    phone: "(416) 555-1234",
    lastLogin: "2025-01-15T10:30:00Z"
  },
  financialSummary: {
    totalIncome: 24000.00,
    totalExpenses: 18750.00,
    currentBalance: 5250.00,
    budgetPercentUsed: 75.0,
    categoryBreakdown: [
      {
        category: "Ice Time",
        budgeted: 13750.00,
        actual: 12450.00,
        percentUsed: 90.5
      }
      // ... other categories (aggregated only)
    ],
    monthlyTrend: [
      { month: "Sep 2024", income: 12000, expenses: 2500 },
      { month: "Oct 2024", income: 5000, expenses: 4200 },
      // ... monthly aggregates (no transaction details)
    ]
  },
  compliance: {
    dualApprovalEnabled: true,
    approverName: "John Miller (President)",
    receiptCompliancePercent: 95.0,
    receiptsMissing: 2,
    totalExpensesOverThreshold: 40,
    lastActivityDate: "2025-01-15",
    seasonClosureSubmitted: false,
    seasonClosureDueDate: "2025-03-15"
  },
  riskIndicators: {
    healthScore: 85,  // 0-100
    budgetBurnRate: 3125.00,  // $/month
    projectedEndOfSeasonBalance: 1250.00,
    rejectedTransactionCount: 0,
    overdueApprovalCount: 0
  },
  adminNotes: [
    {
      id: "note_123",
      createdBy: "League Admin",
      createdAt: "2025-01-10T09:00:00Z",
      note: "Treasurer requested budget planning assistance. Scheduled call for Jan 20."
    }
  ]
}
```

---

## Feature 3: Season Closure Management ⭐ IMPORTANT

### Description
League administrators can track which teams have submitted their end-of-season financial packages, acknowledge receipt, and download consolidated reports.

### Requirements

#### Season Closure Dashboard
- List of all teams with submission status:
  - ✅ Submitted (date)
  - ⏳ Pending (due date)
  - ⚠️ Overdue (days overdue)
- Filters: Status, Division, Submission date
- Bulk actions: Send reminder emails, Download all packages (ZIP)

#### Team Season Closure Detail
- Submission details:
  - Submitted by (treasurer name)
  - Submission date/time
  - Package contents:
    - Final Budget PDF
    - Transaction History PDF
    - Budget Variance PDF
    - Audit Trail PDF
    - Receipt Archive (count)
- Financial summary from package:
  - Total income
  - Total expenses
  - Final balance
  - Budget variance
- League admin actions:
  - ✅ Acknowledge receipt (sends confirmation to treasurer)
  - 📥 Download package (ZIP file)
  - 📧 Request clarification (email with specific questions)
  - ✅ Mark as reviewed
  - 📝 Add review notes

#### Acknowledgment Workflow
```typescript
1. Team treasurer submits season closure package
2. Package stored in Supabase Storage
3. Email sent to league administrator
4. League admin reviews package in dashboard
5. League admin clicks "Acknowledge Receipt"
6. Confirmation email sent to treasurer
7. Status updated to "Acknowledged" with timestamp
8. Treasurer sees confirmation in their dashboard
```

### API Endpoints

```typescript
// GET /api/league/season-closures
{
  season: "2024-2025",
  summary: {
    totalTeams: 42,
    submitted: 38,
    pending: 3,
    overdue: 1
  },
  closures: [
    {
      teamId: "team_456",
      teamName: "Bantam AA Storm",
      division: "Bantam",
      status: "SUBMITTED",
      submittedBy: "Sarah Thompson",
      submittedAt: "2025-03-10T14:30:00Z",
      acknowledgedAt: null,
      packageUrl: "https://storage.../season-packages/team_456_2024-2025.zip",
      financialSummary: {
        totalIncome: 24000.00,
        totalExpenses: 23980.00,
        finalBalance: 20.00,  // Should be ~$0
        budgetVariance: 0.08  // <1% variance = good
      }
    }
  ]
}

// POST /api/league/season-closures/:closureId/acknowledge
{
  acknowledgedBy: "admin_123",
  notes: "Financial package reviewed. All compliance requirements met."
}

// Response
{
  success: true,
  closure: {
    id: "closure_789",
    status: "ACKNOWLEDGED",
    acknowledgedAt: "2025-03-12T09:15:00Z",
    acknowledgedBy: "League Admin"
  },
  message: "Acknowledgment sent to treasurer"
}
```

---

## Feature 4: League-Wide Reporting ⭐ IMPORTANT

### Description
Generate consolidated financial reports across all teams in the league for board meetings, annual reports, and audits.

### Report Types

#### 1. League Financial Summary
- Total income across all teams
- Total expenses across all teams
- Net position (income - expenses)
- Breakdown by division (Novice, Atom, Peewee, Bantam, Midget)
- Breakdown by category (Ice Time, Equipment, Travel, etc.)
- Year-over-year comparison (if previous season data exists)

#### 2. Team Benchmarking Report
- Compare teams in same division/level
- Average budget by division
- Budget range (min/max) by division
- Spending patterns (which categories teams prioritize)
- Identify outliers (teams spending 2x average on any category)

#### 3. Compliance Report
- List of all teams with compliance status
- Teams with dual-approval enabled
- Receipt compliance rates
- Audit trail completeness
- Season closure submission status
- **Use case:** Annual audit, insurance verification, board reporting

#### 4. Risk Report
- Teams with budget overruns
- Teams with negative balances
- Teams with low activity (possible abandoned teams)
- Teams with high rejection rates (may indicate treasurer/approver conflict)
- **Use case:** Proactive intervention, risk management

### API Endpoints

```typescript
// GET /api/league/reports/financial-summary
{
  league: "Greater Toronto Hockey League",
  season: "2024-2025",
  reportDate: "2025-01-15",
  summary: {
    totalIncome: 1250000.00,
    totalExpenses: 980000.00,
    netPosition: 270000.00,
    teamCount: 42
  },
  byDivision: [
    {
      division: "Bantam AA",
      teamCount: 8,
      totalIncome: 200000.00,
      totalExpenses: 156000.00,
      avgIncomePerTeam: 25000.00,
      avgExpensesPerTeam: 19500.00
    }
    // ... more divisions
  ],
  byCategory: [
    {
      category: "Ice Time",
      totalExpenses: 450000.00,
      percentOfTotal: 45.9,
      avgPerTeam: 10714.29
    }
    // ... more categories
  ]
}

// GET /api/league/reports/benchmarking?division=Bantam&level=AA
{
  division: "Bantam AA",
  teamCount: 8,
  benchmarks: {
    avgBudget: 25000.00,
    minBudget: 18000.00,
    maxBudget: 35000.00,
    medianBudget: 24500.00
  },
  categoryAverages: [
    {
      category: "Ice Time",
      avgAmount: 13000.00,
      minAmount: 9000.00,
      maxAmount: 18000.00
    }
  ],
  outliers: [
    {
      teamId: "team_789",
      teamName: "Bantam AA Lightning",
      category: "Travel",
      amount: 8500.00,
      avgAmount: 3200.00,
      variance: "+165%"
    }
  ]
}

// GET /api/league/reports/compliance
{
  season: "2024-2025",
  totalTeams: 42,
  compliance: {
    dualApprovalEnabled: 40,  // 95%
    receiptCompliance: 38,     // 90% of teams >90% compliant
    auditTrailActive: 42,      // 100%
    seasonClosureSubmitted: 38 // 90%
  },
  nonCompliantTeams: [
    {
      teamId: "team_999",
      teamName: "Atom A Flames",
      issues: [
        "Dual-approval not enabled",
        "Receipt compliance: 65%"
      ]
    }
  ]
}
```

---

## Data Model

### New Models

```prisma
// Association/League
model League {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  region      String?  // "Greater Toronto", "Northern Ontario"
  website     String?

  // Settings
  settings    Json?    // League-specific policies, thresholds

  // Relationships
  teams       Team[]
  admins      LeagueAdmin[]
  seasonClosureAcknowledgments SeasonClosureAcknowledgment[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// League Administrators
model LeagueAdmin {
  id          String   @id @default(cuid())
  leagueId    String
  league      League   @relation(fields: [leagueId], references: [id], onDelete: Cascade)

  // User info
  clerkId     String   @unique
  email       String
  name        String
  role        LeagueAdminRole @default(ADMIN)

  // Permissions
  canViewFinancials      Boolean @default(true)
  canAcknowledgeClosures Boolean @default(true)
  canSendEmails          Boolean @default(true)

  // Activity tracking
  lastLoginAt DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([leagueId, clerkId])
}

enum LeagueAdminRole {
  SUPER_ADMIN    // Full access to all features
  ADMIN          // Standard access
  TREASURER      // Financial reports only
  READ_ONLY      // View-only access
}

// Season Closure Acknowledgments
model SeasonClosureAcknowledgment {
  id              String   @id @default(cuid())

  seasonClosureId String   @unique
  seasonClosure   SeasonClosure @relation(fields: [seasonClosureId], references: [id], onDelete: Cascade)

  leagueId        String
  league          League   @relation(fields: [leagueId], references: [id], onDelete: Cascade)

  // Acknowledgment details
  acknowledgedBy  String   // LeagueAdmin clerkId
  acknowledgedAt  DateTime
  notes           String?  @db.Text

  // Admin review
  reviewed        Boolean  @default(false)
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewNotes     String?  @db.Text

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// League Admin Notes (private notes on teams)
model LeagueAdminNote {
  id          String   @id @default(cuid())
  leagueId    String
  teamId      String
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  createdBy   String   // LeagueAdmin clerkId
  note        String   @db.Text

  // Categorization
  category    AdminNoteCategory @default(GENERAL)
  flagged     Boolean  @default(false)  // Flag for board meeting discussion

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum AdminNoteCategory {
  GENERAL
  FINANCIAL_CONCERN
  COMPLIANCE_ISSUE
  TREASURER_SUPPORT
  PARENT_COMPLAINT
  AUDIT_FINDING
}
```

### Updated Models

```prisma
// Add leagueId to Team model
model Team {
  // ... existing fields

  leagueId    String?
  league      League?  @relation(fields: [leagueId], references: [id], onDelete: SetNull)

  adminNotes  LeagueAdminNote[]

  // ... rest of model
}

// Add acknowledgedBy to SeasonClosure
model SeasonClosure {
  // ... existing fields

  acknowledgment SeasonClosureAcknowledgment?

  // ... rest of model
}
```

---

## Security & Privacy

### Access Control

#### League Admin Permissions
```typescript
LeagueAdminPermissions = {
  // CAN access:
  - Aggregated financial data (totals, averages, category breakdowns)
  - Compliance status (yes/no indicators, percentages)
  - Team health indicators (risk scores, budget variance)
  - Season closure packages (full reports submitted by teams)
  - Treasurer contact information
  - League-wide reports and exports

  // CANNOT access:
  - Individual transaction details (vendor, amount, date)
  - Receipt images (unless part of season closure package)
  - Approval comments/discussions
  - Parent/family contact information
  - Real-time transaction activity
  - User passwords or authentication details
}
```

#### Row-Level Security (RLS)
```sql
-- League admins can only see teams in their league
CREATE POLICY "League admins see own league teams"
ON teams FOR SELECT
TO authenticated
USING (
  league_id IN (
    SELECT league_id FROM league_admins
    WHERE clerk_id = auth.uid()
  )
);

-- League admins can only see aggregated data
CREATE POLICY "League admins cannot see individual transactions"
ON transactions FOR SELECT
TO authenticated
USING (false);  -- No direct access to transactions table

-- League admins access via API aggregation only
```

#### API Authorization
```typescript
// Middleware for league admin routes
async function requireLeagueAdmin(req: Request) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const leagueAdmin = await prisma.leagueAdmin.findUnique({
    where: { clerkId: userId }
  });

  if (!leagueAdmin) {
    throw new Error("League admin access required");
  }

  return leagueAdmin;
}

// Example API route
export async function GET(req: Request) {
  const leagueAdmin = await requireLeagueAdmin(req);

  // Fetch only aggregated data
  const teams = await prisma.team.findMany({
    where: { leagueId: leagueAdmin.leagueId },
    select: {
      id: true,
      name: true,
      // ... other team fields
      _count: {
        select: {
          transactions: true  // Count only, not details
        }
      }
    }
  });

  // Return aggregated view only
  return Response.json({ teams });
}
```

### Privacy Protection

#### Aggregation Threshold
- League admins see category totals only if team has **10+ transactions**
- Teams with <10 transactions show "Insufficient data" to prevent reverse-engineering
- Individual transaction details never exposed via league API

#### Audit Logging
- All league admin actions logged:
  - What they viewed (which team's details)
  - When they accessed data
  - What reports they generated
  - What emails they sent
- Logs available to team treasurers (transparency)

#### Data Retention
- League admins can only see **current season + 1 prior season**
- Historical data beyond 2 years requires team consent
- Season closure packages stored for 7 years (compliance)

---

## UI/UX Design

### Navigation Structure

```
League Dashboard (Top Nav)
├── Overview (default landing)
├── Teams
│   ├── All Teams (list view)
│   ├── By Division (Novice, Atom, Peewee, Bantam, Midget)
│   └── By Status (Healthy, Warning, At-Risk)
├── Season Closures
│   ├── Pending Submissions
│   ├── Submitted (needs review)
│   └── Acknowledged
├── Reports
│   ├── Financial Summary
│   ├── Benchmarking
│   ├── Compliance
│   └── Risk Report
├── Settings
│   ├── League Profile
│   ├── Administrators
│   └── Policies & Thresholds
└── Help & Support
```

### Page Layouts

#### 1. League Dashboard (Overview)
```
┌─────────────────────────────────────────────────────────┐
│  Greater Toronto Hockey League - 2024-2025             │
│  42 Teams • Last updated: 2 hours ago                  │
└─────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────┐
│ Total Teams  │ Healthy      │ Warning      │ At-Risk  │
│    42        │  35 (83%)    │  5 (12%)     │  2 (5%)  │
└──────────────┴──────────────┴──────────────┴──────────┘

┌──────────────────────────────────────────────────────────┐
│  LEAGUE FINANCIAL SUMMARY                                │
│  Total Income: $1,250,000  Total Expenses: $980,000     │
│  Net Position: $270,000                                  │
│  [View Detailed Report →]                               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  🚨 ALERTS & ACTION ITEMS                                │
│                                                          │
│  ⚠️  2 teams over budget (>100% spent)                   │
│  ⚠️  3 teams pending season closure (due in 10 days)     │
│  ⚠️  1 team with compliance issues                       │
│                                                          │
│  [View All Alerts →]                                    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  TEAM STATUS                        [Filter: All ▼]     │
├──────────────────────────────────────────────────────────┤
│  🟢 Bantam AA Storm          $18,750 / $25,000 (75%)   │
│     Compliant • Active 3 days ago                       │
│     [View Details]                                      │
├──────────────────────────────────────────────────────────┤
│  🟡 Midget A Lightning       $22,100 / $24,000 (92%)   │
│     Compliant • Active 5 days ago                       │
│     [View Details]                                      │
├──────────────────────────────────────────────────────────┤
│  🔴 Atom A Flames            $26,500 / $24,000 (110%)  │
│     ⚠️ No dual-approval • Active 45 days ago            │
│     [View Details] [Send Email]                         │
└──────────────────────────────────────────────────────────┘
```

#### 2. Team Detail View (League Perspective)
```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Teams                                        │
│                                                         │
│  Bantam AA Storm                                        │
│  Bantam • AA • 2024-2025 Season                        │
│  Treasurer: Sarah Thompson (sarah@example.com)         │
│  Last activity: 3 days ago                             │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  FINANCIAL HEALTH SCORE: 85/100 🟢 HEALTHY              │
│                                                          │
│  Budget: $18,750 / $25,000 (75% used)                   │
│  Projected end-of-season balance: $1,250                │
│  Burn rate: $3,125/month                                │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  COMPLIANCE CHECKLIST                                    │
│  ✅ Dual-approval enabled (Approver: John Miller)        │
│  ✅ Receipt compliance: 95% (38/40 expenses)             │
│  ✅ Audit trail active                                   │
│  ⚠️  Season closure: Not submitted (due Mar 15, 2025)    │
│  ✅ Last activity: 3 days ago                            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  BUDGET BY CATEGORY                                      │
│  [Bar chart showing budgeted vs. actual by category]    │
│                                                          │
│  Ice Time:    $12,450 / $13,750 (90%)                   │
│  Equipment:   $4,200 / $5,000 (84%)                     │
│  Travel:      $2,100 / $6,250 (34%)                     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  SPENDING TREND (Last 6 Months)                         │
│  [Line chart showing monthly aggregated expenses]        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  ADMIN ACTIONS                                           │
│  [📧 Email Treasurer] [📝 Add Note] [📊 Export Report]  │
│  [🚨 Flag for Review]                                    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  ADMIN NOTES (Private)                                   │
│  Jan 10, 2025 - League Admin                            │
│  "Treasurer requested budget planning assistance.        │
│   Scheduled call for Jan 20."                           │
│                                                          │
│  [+ Add Note]                                           │
└──────────────────────────────────────────────────────────┘
```

#### 3. Season Closures Dashboard
```
┌─────────────────────────────────────────────────────────┐
│  SEASON CLOSURES - 2024-2025                           │
│  42 teams • 38 submitted • 3 pending • 1 overdue       │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  [Filter: All ▼] [Sort: Submission Date ▼]             │
├──────────────────────────────────────────────────────────┤
│  ✅ Bantam AA Storm                                      │
│     Submitted: Mar 10, 2025 by Sarah Thompson           │
│     Status: Acknowledged (Mar 12, 2025)                 │
│     [Download Package] [View Details]                   │
├──────────────────────────────────────────────────────────┤
│  ⏳ Midget A Lightning                                   │
│     Status: Pending (Due: Mar 15, 2025 - 5 days left)   │
│     [Send Reminder]                                     │
├──────────────────────────────────────────────────────────┤
│  ⚠️  Atom A Flames                                       │
│     Status: OVERDUE (Due: Mar 1, 2025 - 11 days late)   │
│     [Send Urgent Reminder] [Contact Treasurer]          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  BULK ACTIONS                                            │
│  [✉️ Send Reminder to Pending Teams]                    │
│  [📥 Download All Submitted Packages (ZIP)]             │
│  [📊 Generate Compliance Report]                        │
└──────────────────────────────────────────────────────────┘
```

### Mobile Considerations
- League admins primarily use **desktop/tablet** (board meetings, office work)
- Mobile view focuses on:
  - Quick team status checks
  - Alert notifications
  - Emergency contact treasurer
- No mobile app needed for MVP (responsive web)

---

## Email Notifications

### 1. New Season Closure Submission
**To:** League Administrator
**Trigger:** Team treasurer submits season closure package

```
Subject: [GTHL] Season Closure Submitted - Bantam AA Storm

Hi League Admin,

A team has submitted their end-of-season financial package for your review:

Team: Bantam AA Storm
Division: Bantam AA
Submitted by: Sarah Thompson
Submitted on: March 10, 2025 at 2:30 PM

Financial Summary:
- Total Income: $24,000.00
- Total Expenses: $23,980.00
- Final Balance: $20.00 ✅
- Budget Variance: 0.08% ✅

Package Contents:
- Final Budget Report
- Transaction History
- Budget Variance Report
- Audit Trail
- Receipt Archive (38 receipts)

[Review in Dashboard →]
[Download Package (ZIP) →]

---
Greater Toronto Hockey League
```

### 2. Season Closure Acknowledgment
**To:** Team Treasurer
**Trigger:** League admin acknowledges season closure

```
Subject: [GTHL] Season Closure Acknowledged - Bantam AA Storm

Hi Sarah,

Great news! Your end-of-season financial package has been reviewed and acknowledged by the league.

Acknowledgment Details:
- Reviewed by: League Admin
- Acknowledged on: March 12, 2025
- Status: ✅ Complete

Review Notes:
"Financial package reviewed. All compliance requirements met. Great work keeping the budget balanced this season!"

Your team has successfully completed all financial requirements for the 2024-2025 season.

[View in Dashboard →]

---
Greater Toronto Hockey League
```

### 3. Overdue Season Closure Reminder
**To:** Team Treasurer
**Trigger:** Season closure due date passed, no submission

```
Subject: [URGENT] Season Closure Overdue - Atom A Flames

Hi Team Treasurer,

Your team's end-of-season financial package is now OVERDUE.

Team: Atom A Flames
Due Date: March 1, 2025
Days Overdue: 11 days

The league requires all teams to submit their financial package within 14 days of the season end. Please submit as soon as possible to maintain compliance.

What to Submit:
- Final budget report
- Transaction history
- All receipts for expenses over $100

[Submit Season Closure Package →]

Need help? Contact league administration at admin@gthl.ca

---
Greater Toronto Hockey League
```

### 4. Team At-Risk Alert
**To:** League Administrator
**Trigger:** Team health status changes to AT_RISK or CRITICAL

```
Subject: [ALERT] Team Flagged At-Risk - Atom A Flames

Hi League Admin,

A team in your league has been flagged as AT-RISK and may need intervention:

Team: Atom A Flames
Division: Atom A
Risk Level: 🔴 CRITICAL

Issues Identified:
- Budget exceeded by $2,500 (110% used)
- Dual-approval not enabled
- No activity in 45 days
- Receipt compliance: 65% (below 90% threshold)

Recommended Actions:
1. Contact treasurer to offer support
2. Verify dual-approval setup
3. Review compliance requirements

Treasurer Contact:
Name: [Treasurer Name]
Email: treasurer@example.com
Phone: (416) 555-1234

[View Team Details →]
[Send Email to Treasurer →]

---
Greater Toronto Hockey League
```

---

## Implementation Phases

### Phase 1: Foundation (2 weeks)
**Goal:** Basic league dashboard with team list and health indicators

- [ ] Create League, LeagueAdmin, LeagueAdminNote models
- [ ] Add leagueId to Team model
- [ ] Migration to add league association to existing teams
- [ ] Create league admin authentication flow
- [ ] Build `/api/league/dashboard` endpoint (aggregated data only)
- [ ] Build `/api/league/teams/:id` endpoint (team detail view)
- [ ] Create league dashboard UI (overview page)
- [ ] Create team detail page (league perspective)
- [ ] Add RBAC for league admin routes
- [ ] Test privacy: verify league admins cannot see transaction details

**Deliverable:** League admin can log in, see list of teams, view team health

---

### Phase 2: Season Closure Integration (1 week)
**Goal:** League admins can manage season closure submissions

- [ ] Create SeasonClosureAcknowledgment model
- [ ] Add acknowledgment relationship to SeasonClosure
- [ ] Create `/api/league/season-closures` endpoint
- [ ] Create `/api/league/season-closures/:id/acknowledge` endpoint
- [ ] Build season closures dashboard UI
- [ ] Build acknowledgment workflow (button + confirmation)
- [ ] Email notification: new submission to league admin
- [ ] Email notification: acknowledgment to treasurer
- [ ] Test end-to-end season closure workflow

**Deliverable:** League admins can view, download, and acknowledge season closures

---

### Phase 3: Reporting & Analytics (2 weeks)
**Goal:** League-wide financial reports and benchmarking

- [ ] Create `/api/league/reports/financial-summary` endpoint
- [ ] Create `/api/league/reports/benchmarking` endpoint
- [ ] Create `/api/league/reports/compliance` endpoint
- [ ] Create `/api/league/reports/risk` endpoint
- [ ] Build reports page UI with tabs for each report type
- [ ] Add data visualization (charts) for financial summary
- [ ] Add benchmarking comparison tables
- [ ] Add export to CSV/PDF functionality
- [ ] Test report accuracy with real data

**Deliverable:** League admins can generate comprehensive reports

---

### Phase 4: Alerts & Notifications (1 week)
**Goal:** Proactive risk monitoring and team support

- [ ] Create alert generation logic (budget thresholds, compliance issues)
- [ ] Build alerts dashboard UI (dedicated page)
- [ ] Add alert badges to team list
- [ ] Email notifications for critical alerts
- [ ] Create `/api/league/alerts` endpoint
- [ ] Add "Mark as Resolved" functionality
- [ ] Add alert filtering and search
- [ ] Test alert triggers with edge cases

**Deliverable:** League admins receive proactive alerts for at-risk teams

---

### Phase 5: Admin Tools & Polish (1 week)
**Goal:** Complete feature with admin notes, bulk actions, and UX polish

- [ ] Build admin notes functionality (add, edit, delete)
- [ ] Add bulk email functionality (send to multiple teams)
- [ ] Add league settings page (thresholds, policies)
- [ ] Add league admin management (invite, remove admins)
- [ ] Build onboarding flow for new league admins
- [ ] Add contextual help and tooltips
- [ ] Mobile responsive testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance testing with 100+ teams
- [ ] Security audit (RBAC enforcement, privacy protection)

**Deliverable:** Full-featured league dashboard ready for production

---

## Success Metrics

### Product Metrics
- **Adoption Rate:** 50% of teams in pilot leagues using TeamTreasure within 90 days
- **League Retention:** 90% of leagues renew after first season
- **Usage:** League admins log in 2x per month (average)
- **Time Saved:** League admins identify at-risk teams in <5 minutes (vs. manual review)

### Business Metrics
- **ACV Increase:** League deals average $5,000/year (vs. $149 per team)
- **Sales Efficiency:** 1 league deal = 30 team equivalents (faster expansion)
- **Net Dollar Retention:** 120% (leagues add teams year-over-year)

### User Satisfaction
- **NPS Score:** 50+ from league administrators
- **Compliance Improvement:** 95% of teams submit season closures on time (vs. 70% manual)
- **Risk Prevention:** Zero financial fraud incidents in teams using dual-approval

### Technical Metrics
- **Dashboard Load Time:** <2 seconds for 50 teams
- **Report Generation:** <5 seconds for league-wide reports
- **Uptime:** 99.9% availability
- **Security:** Zero unauthorized access to transaction details

---

## Pricing Model

### League Tier (New)
**$99/team/year** when purchased by league (vs. $149 individual team)
- Minimum 10 teams
- All team-level features included
- League dashboard access (2 admin seats included)
- Additional admin seats: $499/year each
- Priority support (48-hour response)
- Dedicated onboarding and training

**Example Pricing:**
- 20-team league: $99 × 20 = **$1,980/year** (33% savings vs. individual)
- 50-team league: $99 × 50 = **$4,950/year** (33% savings)

### Add-Ons
- Additional league admin seats: $499/year
- Custom league branding: $999/year
- Advanced analytics: $1,499/year
- White-label option: Contact sales

### Why This Works
- **For leagues:** Bulk discount, centralized oversight, compliance assurance
- **For TeamTreasure:** Higher ACV, faster expansion, stickier contracts
- **For teams:** Lower price than individual, league-subsidized or required

---

## Competitive Advantages

### 1. Privacy-First Oversight
Unlike general accounting software (QuickBooks), we provide **aggregated oversight without exposing transaction details**. League admins see compliance and health, not micromanagement details.

### 2. Sports-Specific Benchmarking
Compare teams by division/level with sports-specific categories (Ice Time, Equipment, Travel). Generic financial software can't provide peer comparisons.

### 3. Built-In Fraud Prevention
Dual-approval enforcement at league level ensures **all teams follow financial policies**. League admins can verify compliance without manual audits.

### 4. Season Closure Integration
Purpose-built for sports seasons with **start/end financial packages**. Generic tools don't understand sports seasons or league reporting requirements.

### 5. Network Effects
More leagues → more teams → more data → better benchmarking → more valuable to leagues (virtuous cycle).

---

## Risk Mitigation

### Risk: Leagues resist adoption (prefer manual oversight)
**Mitigation:**
- Free pilot for 1-2 leagues (prove value)
- Focus on risk mitigation messaging (protect from fraud)
- Highlight time savings (5 min/week vs. hours of manual review)
- Insurance discount partnerships (some insurers offer lower rates for verified financial controls)

### Risk: Privacy concerns (leagues want more access than we provide)
**Mitigation:**
- Clear documentation of what league admins can/cannot see
- Emphasize legal liability protection (not responsible for daily operations)
- Offer customizable privacy settings (teams can opt-in to share more)
- Build trust through transparency about data access

### Risk: Technical complexity (too much data, slow dashboards)
**Mitigation:**
- Database optimization (materialized views for aggregations)
- Caching strategy (refresh aggregations every 15 minutes)
- Pagination and filtering (don't load all teams at once)
- Performance testing with 200+ team leagues

### Risk: Teams reject league oversight
**Mitigation:**
- Position as "support" not "surveillance"
- Transparency: teams can see what league admins view
- Optional features: teams can opt-in to share more details
- Value-add: teams get benchmarking insights too

---

## Go-to-Market Strategy

### Pilot Program (Q2 2026)
- Recruit 2-3 mid-size leagues (20-40 teams each)
- Free for first season in exchange for feedback
- Weekly check-ins with league admins
- Case study development (testimonials, metrics)

### Launch Targets (Q3 2026)
- 10 leagues (300-500 teams total)
- Mix of sizes: small (10-20 teams), medium (30-50), large (60-100)
- Geographic diversity: Ontario, BC, Alberta, Quebec
- Partner with Hockey Canada for credibility

### Sales Approach
- Top-down: Sell to league first, they onboard teams
- Bundled pricing: League pays centrally, teams get access
- Compliance angle: "Protect your league from financial fraud"
- ROI focus: "Save 20 hours/month on financial oversight"

### Marketing Messages
**For Leagues:**
- "Protect your league from the next $2.4M fraud scandal"
- "Ensure 100% financial compliance without manual audits"
- "Support your volunteers with professional financial tools"

**For Teams:**
- "Get TeamTreasure at 33% off through your league"
- "League-approved financial management"
- "Compare your budget to similar teams in your division"

---

## Next Steps

### Before Building
1. **Validate with 5-10 league administrators**
   - Interview to confirm pain points
   - Demo mockups for feedback
   - Validate pricing model
   - Identify must-have vs. nice-to-have features

2. **Legal review**
   - Privacy policy updates (league access to team data)
   - Terms of service for league agreements
   - Data processing agreements (if required)

3. **Technical architecture review**
   - Database design for large-scale aggregations
   - Caching strategy for dashboards
   - API rate limiting for league endpoints

### Implementation Order
1. **Phase 1:** Basic dashboard (2 weeks) → Test with 1 pilot league
2. **Phase 2:** Season closure (1 week) → Validate acknowledgment workflow
3. **Phase 3:** Reporting (2 weeks) → Validate report accuracy and usefulness
4. **Phase 4:** Alerts (1 week) → Test proactive notifications
5. **Phase 5:** Polish (1 week) → Production-ready

**Total Timeline:** 7 weeks development + 2 weeks testing = **9 weeks to launch**

---

## Questions to Resolve

### Product Decisions
- [ ] What aggregation threshold prevents privacy concerns? (10 transactions? 20?)
- [ ] Should league admins see treasurer login activity? (Yes for accountability, no for privacy?)
- [ ] How do we handle leagues that want MORE access than we provide? (Opt-in sharing?)
- [ ] Should teams see what league admins view about them? (Transparency vs. overhead?)

### Technical Decisions
- [ ] Materialized views vs. real-time aggregation? (Performance vs. data freshness)
- [ ] How often to refresh league dashboard data? (Every 15 min? Hourly? On-demand?)
- [ ] Caching strategy for large leagues (100+ teams)? (Redis? PostgreSQL caching?)
- [ ] Should we build a separate league admin portal or integrate into main app?

### Business Decisions
- [ ] Minimum league size? (10 teams? 15 teams?)
- [ ] Do we offer league tier to associations under 10 teams? (Different pricing?)
- [ ] How to handle leagues that want to self-host? (Enterprise tier?)
- [ ] Partnership with Hockey Canada or other governing bodies? (Credibility boost)

---

**End of Association Dashboard Feature Specification**

*This feature represents a significant expansion of TeamTreasure's value proposition and market opportunity. By providing league-level oversight without compromising team privacy, we can serve both individual teams and governing bodies.*
