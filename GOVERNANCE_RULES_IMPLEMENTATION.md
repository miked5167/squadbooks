# Association Governance Rules - Implementation Summary

## Overview

This feature adds **optional, configurable governance rules** at the association level to control:
1. Whether association approval is required before budgets can be presented to parents
2. Default parent acknowledgment threshold settings (COUNT or PERCENT mode)
3. Whether teams can override the default thresholds within defined bounds

**Key Design Principle**: This is **opt-in** per association. If not configured, the system behaves with sensible defaults (no association approval, 80% parent threshold).

## Architecture

### 1. Database Schema

#### New Model: `AssociationGovernanceRule`
```prisma
model AssociationGovernanceRule {
  id                               UUID
  associationId                    UUID (unique, 1:1 with Association)

  // Budget approval workflow
  requiresAssociationBudgetApproval Boolean (default: false)

  // Parent acknowledgment defaults
  parentAckMode                     ParentAckMode (COUNT | PERCENT, default: PERCENT)
  parentAckCountThreshold          Int? (required if mode = COUNT)
  parentAckPercentThreshold        Int? (required if mode = PERCENT, stores 80 not 0.8)

  // Eligible families definition
  eligibleFamilyDefinition         EligibleFamilyDefinition (ACTIVE_ROSTER_ONLY | ...)

  // Team override settings
  allowTeamOverrideThreshold       Boolean (default: false)
  overrideMinPercent               Int?
  overrideMaxPercent               Int?
  overrideMinCount                 Int?
  overrideMaxCount                 Int?

  timestamps
}
```

#### Updated: `BudgetStatus` Enum
Added new status: `ASSOCIATION_REVIEW`

**Status Flow**:
- Without association approval: `DRAFT → REVIEW → TEAM_APPROVED → PRESENTED → LOCKED`
- With association approval: `DRAFT → REVIEW → ASSOCIATION_REVIEW → TEAM_APPROVED → PRESENTED → LOCKED`

#### Updated: `BudgetVersion` Model
Added fields for association approval tracking:
- `associationApprovedAt`: DateTime?
- `associationApprovedBy`: String? (AssociationUser.id)
- `associationNotes`: String?

### 2. State Transitions

#### Allowed Transitions (Updated)
```typescript
ALLOWED_TRANSITIONS = {
  DRAFT: [REVIEW],
  REVIEW: [DRAFT, ASSOCIATION_REVIEW, TEAM_APPROVED],
  ASSOCIATION_REVIEW: [DRAFT, TEAM_APPROVED],
  TEAM_APPROVED: [PRESENTED, REVIEW],
  PRESENTED: [APPROVED, REVIEW],
  APPROVED: [LOCKED],
  LOCKED: []
}
```

### 3. Workflow Logic

#### Coach Approval (`approveBudget`)
When a coach approves a budget in REVIEW status:
1. Check if team is linked to an association
2. If yes, check governance rules: `requiresAssociationBudgetApproval`
3. If `true`: transition to `ASSOCIATION_REVIEW`
4. If `false` or no rules: transition to `TEAM_APPROVED`

#### Association Actions
Two new server actions:
1. **`approveBudgetAsAssociation`**: ASSOCIATION_REVIEW → TEAM_APPROVED
   - Verifies user is association finance admin
   - Records association approval in BudgetVersion
   - Updates budget status to TEAM_APPROVED

2. **`requestBudgetChangesAsAssociation`**: ASSOCIATION_REVIEW → DRAFT
   - Requires notes explaining what needs to change
   - Sends budget back to treasurer for revision

#### Budget Creation Snapshotting
When a budget is created:
1. Fetch governance rules for the team's association
2. Snapshot parent threshold config into `BudgetThresholdConfig`:
   - If governance says PERCENT mode + 75%, create with mode=PERCENT, percentThreshold=75
   - If governance says COUNT mode + 10 families, create with mode=COUNT, countThreshold=10
   - If no governance: default to PERCENT mode, 80%
3. Store eligible family count at creation time

## API Endpoints

### Governance Management
- `GET /api/association-governance/[associationId]` - Get rules (returns defaults if not set)
- `PUT /api/association-governance/[associationId]` - Update rules (admin only)

### Association Budget Approval
- `POST /api/budget-versions/[versionId]/association-approve` - Approve budget
- `POST /api/budget-versions/[versionId]/association-request-changes` - Request changes

## UI Components

### 1. Governance Settings Page
**Path**: `/app/association/[associationId]/governance/page.tsx`

Features:
- Toggle for "Require Association Approval"
- Parent acknowledgment threshold configuration:
  - Mode selector: PERCENT or COUNT
  - Threshold value input (1-100% or ≥1 families)
  - Eligible families definition dropdown
- Team override settings:
  - Toggle to allow team customization
  - Min/max bounds for overrides

### 2. Budget Status Display
Updated `getBudgetStatusBadge()` to include:
```typescript
case BudgetStatus.ASSOCIATION_REVIEW:
  return {
    label: 'Association Review',
    variant: 'warning',
    description: 'Awaiting association approval'
  }
```

## Database Helper Functions

Located in `lib/db/governance.ts`:

- `getGovernanceRules(associationId)` - Fetch rules or null
- `getGovernanceRulesWithDefaults(associationId)` - Always returns valid config
- `upsertGovernanceRules(associationId, data)` - Create or update with validation
- `requiresAssociationApproval(associationId)` - Boolean check
- `getParentThresholdConfig(associationId)` - Get threshold config for budget creation

## Authorization

### Association Finance Administrators
Roles that can approve budgets at association level:
- `association_admin`
- `board_member`

Verified via `isAssociationFinanceAdmin(userId, associationId)`

### Team Roles (Unchanged)
- Treasurer: Create/edit budgets
- Coach/President: Approve budgets for coach review
- Treasurer/Coach: Present to parents

## Defaults & Fallbacks

If no governance rules are configured for an association:
- `requiresAssociationBudgetApproval`: `false`
- `parentAckMode`: `PERCENT`
- `parentAckPercentThreshold`: `80`
- `eligibleFamilyDefinition`: `ACTIVE_ROSTER_ONLY`
- `allowTeamOverrideThreshold`: `false`

## Migration Path

### For Existing Associations
1. No governance rules exist → system uses defaults
2. Association admins can visit `/association/[id]/governance` to configure
3. Once configured, rules apply to **all new budgets** created after that point
4. Existing budgets continue with their snapshotted thresholds

### For New Associations
1. During association onboarding, governance settings can be configured
2. If skipped, defaults apply

## Testing Scenarios

### Scenario 1: No Association Approval Required (Default)
1. Create association (no governance rules set)
2. Team creates budget → DRAFT
3. Treasurer submits → REVIEW
4. Coach approves → **TEAM_APPROVED** (skips association review)
5. Treasurer presents → PRESENTED

### Scenario 2: Association Approval Required
1. Association admin enables `requiresAssociationBudgetApproval`
2. Team creates budget → DRAFT
3. Treasurer submits → REVIEW
4. Coach approves → **ASSOCIATION_REVIEW**
5. Association finance admin approves → TEAM_APPROVED
6. Treasurer presents → PRESENTED

### Scenario 3: Association Requests Changes
1. Budget in ASSOCIATION_REVIEW
2. Association admin requests changes with notes
3. Budget returns to DRAFT
4. Treasurer revises and resubmits
5. Cycle repeats: REVIEW → ASSOCIATION_REVIEW

### Scenario 4: Parent Threshold Snapshotting
1. Association sets governance: COUNT mode, 12 families
2. Team creates budget
3. BudgetThresholdConfig created with mode=COUNT, countThreshold=12
4. Association later changes to 15 families
5. Existing budget still uses 12 (snapshotted)
6. New budgets use 15

## Future Enhancements (Not Implemented)

1. **Team Overrides**: Allow teams to customize thresholds within bounds
   - UI to set team-specific threshold
   - Validation against override min/max

2. **Notification System**: Automated emails when:
   - Budget enters ASSOCIATION_REVIEW
   - Association approves or requests changes

3. **Governance History**: Audit log of governance rule changes

4. **Multi-tier Approval**: Support for multiple association approval levels

5. **House League Auto-Approval**: Different rules based on team type

## File Structure

```
├── prisma/
│   └── schema.prisma (updated with AssociationGovernanceRule)
├── lib/
│   ├── db/
│   │   └── governance.ts (helper functions)
│   ├── budget-workflow/
│   │   └── association-approval.ts (server actions)
│   └── types/
│       └── budget-workflow.ts (updated transitions & badges)
├── app/
│   ├── api/
│   │   ├── association-governance/[associationId]/route.ts
│   │   └── budget-versions/[versionId]/
│   │       ├── association-approve/route.ts
│   │       └── association-request-changes/route.ts
│   ├── association/[associationId]/
│   │   └── governance/page.tsx
│   └── budget/
│       └── actions.ts (updated coach approval logic)
└── GOVERNANCE_RULES_IMPLEMENTATION.md (this file)
```

## Key Takeaways

✅ **Optional**: Associations can choose to enable or disable association approval
✅ **Configurable**: Parent thresholds can be COUNT or PERCENT based
✅ **Snapshotted**: Threshold config is captured at budget creation, not read dynamically
✅ **Defaults**: Sensible defaults ensure system works without configuration
✅ **Minimal**: No workflow engine, just clean guards and state transitions
✅ **Backward Compatible**: Existing budgets unaffected, new feature is additive

## Support & Documentation

For questions or issues:
1. Check this document first
2. Review code comments in `lib/budget-workflow/association-approval.ts`
3. Inspect governance settings UI at `/association/[id]/governance`
4. Verify state transitions in `lib/types/budget-workflow.ts`
