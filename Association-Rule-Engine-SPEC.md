# Association Rule Engine - Implementation Specification

**Version:** 1.0
**Priority:** P0 - Foundation
**Estimated Effort:** 60 hours (2 weeks)
**Status:** Ready for Implementation

## Overview

The Association Rule Engine enables associations to define financial governance policies once and enforce them automatically across all teams.

## Implementation Phases

### Phase 1: Database Schema (Week 1, Days 1-2)
- Create 4 new tables: association_rules, team_rule_overrides, rule_violations, team_compliance_status
- Write Prisma schema definitions
- Generate and test migrations
- Seed sample BMHA rules

### Phase 2: Core Engine Service (Week 1, Days 3-5)
- Build RuleEnforcementEngine class
- Implement budget validation logic
- Implement transaction approval logic
- Implement compliance scoring
- Add violation logging

### Phase 3: Association Admin UI (Week 2, Days 1-3)
- Rule configuration page
- Compliance dashboard
- Violation log viewer
- Team compliance status cards

### Phase 4: Team Integration (Week 2, Days 4-5)
- Budget creation validation
- Transaction creation warnings
- Compliance status display
- Testing & bug fixes

## Database Schema

### association_rules Table

Stores all financial governance rules defined by an association.

```prisma
model AssociationRule {
  id            String   @id @default(cuid())
  associationId String
  ruleType      String   // 'MAX_BUDGET', 'MAX_ASSESSMENT', 'MAX_BUYOUT', 'APPROVAL_TIERS', 'ZERO_BALANCE', 'REQUIRED_EXPENSES'
  name          String
  description   String?
  isActive      Boolean  @default(true)

  // Flexible configuration stored as JSON
  config        Json     // e.g., { "maxAmount": 20000, "currency": "CAD" }

  // For approval tier rules
  approvalTiers Json?    // e.g., [{ "min": 0, "max": 100, "approvals": 0 }, { "min": 100, "max": 500, "approvals": 1 }]

  // For required expense rules
  requiredExpenses Json? // e.g., ["Ice Rental", "Referee Fees"]

  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?

  // Relations
  association   Association? @relation(fields: [associationId], references: [id])
  overrides     TeamRuleOverride[]
  violations    RuleViolation[]

  @@index([associationId])
  @@index([ruleType])
  @@index([isActive])
}
```

### team_rule_overrides Table

Allows specific teams to override association-level rules with approval.

```prisma
model TeamRuleOverride {
  id              String   @id @default(cuid())
  teamId          String
  ruleId          String

  overrideReason  String
  overrideConfig  Json     // The override values

  approvedBy      String?
  approvedAt      DateTime?
  expiresAt       DateTime?

  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  team            Team     @relation(fields: [teamId], references: [id])
  rule            AssociationRule @relation(fields: [ruleId], references: [id])

  @@index([teamId])
  @@index([ruleId])
  @@index([isActive])
}
```

### rule_violations Table

Logs all rule violations for audit trail and compliance monitoring.

```prisma
model RuleViolation {
  id              String   @id @default(cuid())
  teamId          String
  ruleId          String

  violationType   String   // 'BUDGET_EXCEEDED', 'ASSESSMENT_TOO_HIGH', 'MISSING_APPROVAL', etc.
  severity        String   // 'WARNING', 'ERROR', 'CRITICAL'

  description     String
  violationData   Json     // Context about the violation

  // What triggered it
  budgetId        String?
  transactionId   String?

  // Resolution
  resolved        Boolean  @default(false)
  resolvedAt      DateTime?
  resolvedBy      String?
  resolutionNotes String?

  createdAt       DateTime @default(now())

  // Relations
  team            Team     @relation(fields: [teamId], references: [id])
  rule            AssociationRule @relation(fields: [ruleId], references: [id])

  @@index([teamId])
  @@index([ruleId])
  @@index([violationType])
  @@index([severity])
  @@index([resolved])
}
```

### team_compliance_status Table

Tracks real-time compliance score for each team.

```prisma
model TeamComplianceStatus {
  id                String   @id @default(cuid())
  teamId            String   @unique

  complianceScore   Float    // 0-100
  lastCheckedAt     DateTime @default(now())

  // Breakdown
  activeViolations  Int      @default(0)
  warningCount      Int      @default(0)
  errorCount        Int      @default(0)
  criticalCount     Int      @default(0)

  // Status
  status            String   // 'COMPLIANT', 'AT_RISK', 'NON_COMPLIANT'

  updatedAt         DateTime @updatedAt

  // Relations
  team              Team     @relation(fields: [teamId], references: [id])

  @@index([teamId])
  @@index([status])
  @@index([complianceScore])
}
```

### Required Schema Updates to Existing Models

```prisma
// Add to Team model
model Team {
  // ... existing fields

  // New relations
  ruleOverrides      TeamRuleOverride[]
  violations         RuleViolation[]
  complianceStatus   TeamComplianceStatus?
}

// Add to Association model (if it exists)
model Association {
  // ... existing fields

  // New relations
  rules              AssociationRule[]
}
```

## Service Layer

### RuleEnforcementEngine Class

Location: `/lib/services/rule-enforcement-engine.ts`

```typescript
import { prisma } from '@/lib/prisma'

export class RuleEnforcementEngine {

  /**
   * Get all active rules for a team (association rules + overrides)
   */
  async getActiveRules(teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { association: true }
    })

    if (!team?.associationId) {
      return []
    }

    // Get association rules
    const rules = await prisma.associationRule.findMany({
      where: {
        associationId: team.associationId,
        isActive: true
      },
      include: {
        overrides: {
          where: {
            teamId,
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        }
      }
    })

    // Apply overrides
    return rules.map(rule => {
      const override = rule.overrides[0]
      if (override) {
        return {
          ...rule,
          config: override.overrideConfig,
          isOverridden: true,
          overrideReason: override.overrideReason
        }
      }
      return rule
    })
  }

  /**
   * Validate a budget against all applicable rules
   */
  async validateBudget(teamId: string, budget: {
    totalBudget: number
    playerAssessment: number
    maxBuyout: number
    categories: Array<{ name: string; allocated: number }>
  }) {
    const rules = await this.getActiveRules(teamId)
    const violations: Array<{
      ruleId: string
      type: string
      severity: string
      message: string
    }> = []

    for (const rule of rules) {
      switch (rule.ruleType) {
        case 'MAX_BUDGET':
          if (budget.totalBudget > rule.config.maxAmount) {
            violations.push({
              ruleId: rule.id,
              type: 'BUDGET_EXCEEDED',
              severity: 'ERROR',
              message: `Budget of $${budget.totalBudget.toLocaleString()} exceeds maximum of $${rule.config.maxAmount.toLocaleString()}`
            })
          }
          break

        case 'MAX_ASSESSMENT':
          if (budget.playerAssessment > rule.config.maxAmount) {
            violations.push({
              ruleId: rule.id,
              type: 'ASSESSMENT_TOO_HIGH',
              severity: 'ERROR',
              message: `Player assessment of $${budget.playerAssessment.toLocaleString()} exceeds maximum of $${rule.config.maxAmount.toLocaleString()}`
            })
          }
          break

        case 'MAX_BUYOUT':
          if (budget.maxBuyout > rule.config.maxAmount) {
            violations.push({
              ruleId: rule.id,
              type: 'BUYOUT_TOO_HIGH',
              severity: 'ERROR',
              message: `Max buyout of $${budget.maxBuyout.toLocaleString()} exceeds maximum of $${rule.config.maxAmount.toLocaleString()}`
            })
          }
          break

        case 'ZERO_BALANCE':
          const totalAllocated = budget.categories.reduce((sum, cat) => sum + cat.allocated, 0)
          if (Math.abs(totalAllocated - budget.totalBudget) > 1) { // Allow $1 rounding
            violations.push({
              ruleId: rule.id,
              type: 'UNBALANCED_BUDGET',
              severity: 'ERROR',
              message: `Budget must balance to zero. Allocated: $${totalAllocated.toLocaleString()}, Total: $${budget.totalBudget.toLocaleString()}`
            })
          }
          break

        case 'REQUIRED_EXPENSES':
          const requiredCategories = rule.requiredExpenses as string[]
          const budgetCategories = budget.categories.map(c => c.name)
          const missing = requiredCategories.filter(req => !budgetCategories.includes(req))

          if (missing.length > 0) {
            violations.push({
              ruleId: rule.id,
              type: 'MISSING_REQUIRED_EXPENSE',
              severity: 'WARNING',
              message: `Missing required expense categories: ${missing.join(', ')}`
            })
          }
          break
      }
    }

    return {
      isValid: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations,
      warnings: violations.filter(v => v.severity === 'WARNING')
    }
  }

  /**
   * Validate a transaction and determine required approvals
   */
  async validateTransaction(teamId: string, transaction: {
    amount: number
    type: 'INCOME' | 'EXPENSE'
  }) {
    const rules = await this.getActiveRules(teamId)
    const approvalRule = rules.find(r => r.ruleType === 'APPROVAL_TIERS')

    if (!approvalRule || transaction.type !== 'EXPENSE') {
      return { requiredApprovals: 0, tier: null }
    }

    const tiers = approvalRule.approvalTiers as Array<{
      min: number
      max: number
      approvals: number
    }>

    const tier = tiers.find(t =>
      transaction.amount >= t.min &&
      transaction.amount < t.max
    )

    return {
      requiredApprovals: tier?.approvals || 0,
      tier: tier || null
    }
  }

  /**
   * Calculate compliance score for a team
   */
  async calculateComplianceScore(teamId: string): Promise<number> {
    const violations = await prisma.ruleViolation.findMany({
      where: {
        teamId,
        resolved: false
      }
    })

    if (violations.length === 0) return 100

    // Deduct points based on severity
    let deductions = 0
    violations.forEach(v => {
      switch (v.severity) {
        case 'WARNING': deductions += 5; break
        case 'ERROR': deductions += 15; break
        case 'CRITICAL': deductions += 30; break
      }
    })

    return Math.max(0, 100 - deductions)
  }

  /**
   * Log a rule violation
   */
  async logViolation({
    teamId,
    ruleId,
    violationType,
    severity,
    description,
    violationData,
    budgetId,
    transactionId
  }: {
    teamId: string
    ruleId: string
    violationType: string
    severity: string
    description: string
    violationData: any
    budgetId?: string
    transactionId?: string
  }) {
    const violation = await prisma.ruleViolation.create({
      data: {
        teamId,
        ruleId,
        violationType,
        severity,
        description,
        violationData,
        budgetId,
        transactionId
      }
    })

    // Update compliance status
    await this.updateComplianceStatus(teamId)

    return violation
  }

  /**
   * Update team compliance status
   */
  private async updateComplianceStatus(teamId: string) {
    const violations = await prisma.ruleViolation.findMany({
      where: {
        teamId,
        resolved: false
      }
    })

    const score = await this.calculateComplianceScore(teamId)

    const warningCount = violations.filter(v => v.severity === 'WARNING').length
    const errorCount = violations.filter(v => v.severity === 'ERROR').length
    const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length

    let status = 'COMPLIANT'
    if (score < 70) status = 'NON_COMPLIANT'
    else if (score < 90) status = 'AT_RISK'

    await prisma.teamComplianceStatus.upsert({
      where: { teamId },
      create: {
        teamId,
        complianceScore: score,
        activeViolations: violations.length,
        warningCount,
        errorCount,
        criticalCount,
        status,
        lastCheckedAt: new Date()
      },
      update: {
        complianceScore: score,
        activeViolations: violations.length,
        warningCount,
        errorCount,
        criticalCount,
        status,
        lastCheckedAt: new Date()
      }
    })
  }
}

// Export singleton instance
export const ruleEngine = new RuleEnforcementEngine()
```

## UI Components

### 1. Rule Configuration Page

**Location:** `/app/(app)/association/rules/page.tsx`

**Features:**
- List all association rules
- Add/Edit/Disable rules
- Configure rule parameters (max budget, approval tiers, etc.)
- Preview rule impact on teams

**Key Components:**
- `RuleConfigForm` - Form for creating/editing rules
- `RuleListTable` - Table showing all active rules
- `RulePreview` - Shows which teams would be affected

### 2. Compliance Dashboard

**Location:** `/app/(app)/association/compliance/page.tsx`

**Features:**
- Overview of all teams' compliance status
- Filter by status (Compliant, At Risk, Non-Compliant)
- Drill down into team violations
- Export compliance reports

**Key Components:**
- `ComplianceOverview` - Summary stats
- `TeamComplianceTable` - Sortable table of all teams
- `ComplianceScoreCard` - Visual score display

### 3. Violation Log Viewer

**Location:** `/app/(app)/association/violations/page.tsx`

**Features:**
- Filterable log of all violations
- Group by team, rule type, severity
- Mark violations as resolved
- Add resolution notes

**Key Components:**
- `ViolationLogTable` - Main table with filters
- `ViolationDetailModal` - Detailed view of a violation
- `ResolutionForm` - Form for resolving violations

### 4. Team Integration Components

**Budget Creation Validation:**
- Add real-time validation to budget form
- Show inline errors/warnings as user types
- Display required approval count for transactions

**Dashboard Compliance Widget:**
- Show team's compliance score
- List active violations
- Link to fix issues

## API Routes

### Association Admin Routes

```typescript
// GET /api/associations/[id]/rules
// Returns all rules for an association

// PUT /api/associations/[id]/rules/[ruleId]
// Updates a specific rule

// POST /api/associations/[id]/rules
// Creates a new rule

// DELETE /api/associations/[id]/rules/[ruleId]
// Deactivates a rule (soft delete)

// GET /api/associations/[id]/compliance
// Returns compliance overview for all teams

// GET /api/associations/[id]/violations
// Returns all violations with filters
```

### Team Routes

```typescript
// GET /api/teams/[id]/compliance
// Returns compliance status for a team

// POST /api/teams/[id]/budget/validate
// Validates a budget against rules before creation

// POST /api/teams/[id]/transactions/validate
// Validates a transaction and returns approval requirements
```

## Sample BMHA Rules (Seed Data)

```typescript
const bmhaRules = [
  {
    ruleType: 'MAX_BUDGET',
    name: 'Maximum Team Budget',
    description: 'Teams cannot exceed $20,000 total budget',
    config: { maxAmount: 20000, currency: 'CAD' },
    isActive: true
  },
  {
    ruleType: 'MAX_ASSESSMENT',
    name: 'Maximum Player Assessment',
    description: 'Player registration fees cannot exceed $3,500',
    config: { maxAmount: 3500, currency: 'CAD' },
    isActive: true
  },
  {
    ruleType: 'MAX_BUYOUT',
    name: 'Maximum Family Buyout',
    description: 'Maximum buyout per family is $1,000',
    config: { maxAmount: 1000, currency: 'CAD' },
    isActive: true
  },
  {
    ruleType: 'ZERO_BALANCE',
    name: 'Zero Balance Requirement',
    description: 'Budget must balance to zero (income = expenses)',
    config: { required: true },
    isActive: true
  },
  {
    ruleType: 'APPROVAL_TIERS',
    name: 'Transaction Approval Tiers',
    description: 'Approval requirements based on transaction amount',
    approvalTiers: [
      { min: 0, max: 100, approvals: 0 },
      { min: 100, max: 500, approvals: 1 },
      { min: 500, max: 999999, approvals: 2 }
    ],
    isActive: true
  },
  {
    ruleType: 'REQUIRED_EXPENSES',
    name: 'Required Expense Categories',
    description: 'All budgets must include these expense categories',
    requiredExpenses: ['Ice Rental', 'Referee Fees', 'League Fees'],
    isActive: true
  }
]
```

## Success Criteria

- [ ] Association can configure rules in <15 min
- [ ] Teams cannot submit non-compliant budgets (validation blocks submission)
- [ ] All transactions auto-validate approval requirements
- [ ] Compliance dashboard shows real-time status for all teams
- [ ] Violation log provides complete audit trail
- [ ] Team dashboard shows compliance score and active violations
- [ ] Budget form shows inline validation errors
- [ ] Transaction form displays required approvals before submission
- [ ] Association can override rules for specific teams with approval
- [ ] System logs all rule violations with context

## Testing Checklist

### Unit Tests
- [ ] Budget validation logic (all rule types)
- [ ] Transaction validation logic
- [ ] Compliance score calculation
- [ ] Rule override application

### Integration Tests
- [ ] Budget creation with rule violations blocked
- [ ] Transaction approval requirements correctly applied
- [ ] Compliance status updates on violation
- [ ] Rule override expires correctly

### E2E Tests
- [ ] Association creates rule → Team sees validation
- [ ] Team submits non-compliant budget → Error shown
- [ ] Team creates transaction → Correct approvals required
- [ ] Violation logged → Appears in dashboard

## Migration Strategy

1. **Phase 1:** Deploy database schema (no breaking changes)
2. **Phase 2:** Deploy service layer (passive, doesn't block anything yet)
3. **Phase 3:** Deploy association admin UI (admins can configure rules)
4. **Phase 4:** Enable validation in team UI (start blocking non-compliant actions)

## Rollback Plan

If issues occur:
1. Set all rules to `isActive: false` via database
2. Validation will pass for all teams
3. Fix issues and re-enable rules one at a time

## Future Enhancements (Not in Scope)

- [ ] Rule templates for different sports/associations
- [ ] Machine learning to suggest optimal rules
- [ ] Automated compliance reports via email
- [ ] Mobile app integration
- [ ] Multi-currency support
- [ ] Historical compliance trends
