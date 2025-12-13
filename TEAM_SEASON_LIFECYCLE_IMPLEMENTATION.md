# Team Season Lifecycle State Machine - Implementation Guide

## Overview

This implementation provides a robust, auditable lifecycle state machine for HuddleBooks team seasons. It tracks teams through their season lifecycle with canonical states, enforced transitions, and UI gating based on state + role.

**Key Principle**: This is a straightforward enum + transition guards approach. NO workflow engine infrastructure has been built.

## Canonical States

The system uses 9 lifecycle states stored in `TeamSeason.state`:

1. **SETUP** - Initial team setup, no budget yet
2. **BUDGET_DRAFT** - Treasurer creating/editing budget
3. **BUDGET_REVIEW** - Budget submitted to coach for review
4. **TEAM_APPROVED** - Coach approved budget
5. **PRESENTED** - Budget presented to parents for acknowledgement
6. **LOCKED** - Parent threshold met, budget locked
7. **ACTIVE** - Season active, transactions allowed
8. **CLOSEOUT** - Closeout initiated
9. **ARCHIVED** - Season archived (terminal state)

## Data Model

### TeamSeason Model

```prisma
model TeamSeason {
  id            String          @id @default(cuid())
  teamId        String
  associationId String          @db.Uuid

  // Season identification
  seasonLabel   String          // "2024-2025"
  seasonStart   DateTime        @db.Date
  seasonEnd     DateTime        @db.Date

  // Canonical lifecycle state
  state          TeamSeasonState @default(SETUP)
  stateUpdatedAt DateTime        @default(now())

  // Budget version references
  presentedVersionId String?      // BudgetVersion.id presented to parents
  lockedVersionId    String?      // BudgetVersion.id that's locked

  // Lifecycle timestamps
  activeAt    DateTime?
  closedAt    DateTime?
  archivedAt  DateTime?

  // Policy snapshot (immutable for this season)
  policySnapshotId String?

  // Rollup helpers
  lastActivityAt                    DateTime?
  eligibleFamiliesCount             Int?
  approvalsCountForPresentedVersion Int?

  // Relations
  team           Team
  policySnapshot TeamPolicySnapshot?
  stateChanges   TeamSeasonStateChange[]
}
```

### TeamPolicySnapshot Model

Captures association policies at team season creation. Immutable for the season duration.

### TeamSeasonStateChange Model

Audit log for all state transitions with actor tracking.

## Allowed Transitions

### Happy Path
- SETUP → BUDGET_DRAFT (treasurer starts budget)
- BUDGET_DRAFT → BUDGET_REVIEW (treasurer submits)
- BUDGET_REVIEW → BUDGET_DRAFT (coach requests changes)
- BUDGET_REVIEW → TEAM_APPROVED (coach approves)
- TEAM_APPROVED → PRESENTED (coach presents to parents)
- PRESENTED → LOCKED (system: parent threshold met)
- LOCKED → ACTIVE (system: first transaction OR manual "Start Season")
- ACTIVE → CLOSEOUT (treasurer initiates)
- CLOSEOUT → ARCHIVED (finalize)

### Budget Update Loop (Versioning)
From PRESENTED, LOCKED, or ACTIVE:
- → BUDGET_REVIEW (treasurer proposes update, creates v+1)
- → TEAM_APPROVED (coach approves new version)
- → PRESENTED (coach presents new version)
- → LOCKED (parent threshold met for new version)

## Service Layer

### Core Services

#### 1. `lib/services/team-season-lifecycle.ts`

Main transition function:

```typescript
transitionTeamSeason(
  teamSeasonId: string,
  action: TeamSeasonAction,
  actorUserId: string | null,
  metadata?: Record<string, any>
): Promise<TransitionResult>
```

**Features**:
- Validates allowed transitions
- Checks user permissions by role
- Validates transition-specific requirements
- Creates audit log entries
- Updates timestamps atomically

Helper functions:
- `getAvailableActions(teamSeasonId, userId)` - Returns actions user can perform
- `isModifiable(state)` - Check if state allows modifications
- `areTransactionsAllowed(state)` - Check if transactions are permitted

#### 2. `lib/services/team-season-auto-transitions.ts`

Automatic transitions:

```typescript
// Call after each parent budget approval
checkAndLockBudget(teamSeasonId, budgetVersionId): Promise<boolean>

// Call after creating a transaction
autoActivateOnFirstTransaction(teamId, seasonLabel): Promise<boolean>

// Update rollup helpers
updateTeamSeasonRollupData(teamSeasonId): Promise<void>
```

#### 3. `lib/services/team-policy-snapshot.ts`

Policy snapshot management:

```typescript
createPolicySnapshot(associationId): Promise<string>

createTeamSeasonWithSnapshot(
  teamId,
  associationId,
  seasonLabel,
  seasonStart,
  seasonEnd
): Promise<string>

getTeamSeasonPolicy(teamSeasonId)
```

## Integration Points

### 1. Budget Workflow Integration

**When creating a budget version and presenting to parents:**

```typescript
// After presenting budget to parents
const result = await transitionTeamSeason(
  teamSeasonId,
  'PRESENT_BUDGET',
  coachUserId,
  {
    presentedVersionId: budgetVersion.id,
    versionNumber: budgetVersion.versionNumber
  }
)
```

**When parent approves budget:**

```typescript
// After parent acknowledgement is saved
await checkAndLockBudget(teamSeasonId, budgetVersionId)
```

**When proposing budget update:**

```typescript
// Treasurer proposes update (creates v+1)
const result = await transitionTeamSeason(
  teamSeasonId,
  'PROPOSE_BUDGET_UPDATE',
  treasurerUserId,
  {
    changeSummary: "Increased equipment budget by $500",
    newVersionNumber: currentVersion + 1
  }
)
```

### 2. Transaction Creation Integration

**When creating a transaction:**

```typescript
// Check if transactions are allowed
const teamSeason = await prisma.teamSeason.findUnique({
  where: { teamId_seasonLabel: { teamId, seasonLabel } }
})

if (!teamSeason || !areTransactionsAllowed(teamSeason.state)) {
  throw new Error('Transactions not allowed in current state')
}

// Create transaction...

// Auto-activate if first transaction
await autoActivateOnFirstTransaction(teamId, seasonLabel)
```

### 3. Team Creation Integration

**When creating a new team:**

```typescript
// After team is created
const teamSeasonId = await createTeamSeasonWithSnapshot(
  team.id,
  associationId,
  "2024-2025",
  new Date("2024-09-01"),
  new Date("2025-08-31")
)
```

## UI Gating

### Budget Page Actions

Based on state and role, show/hide these buttons:

**Treasurer:**
- BUDGET_DRAFT: "Submit for Coach Review"
- PRESENTED/LOCKED/ACTIVE: "Propose Update"
- ACTIVE: "Initiate Closeout"

**Coach:**
- BUDGET_REVIEW: "Approve" / "Request Changes"
- TEAM_APPROVED: "Present to Parents"

**Parent:**
- PRESENTED: "Acknowledge/Approve Budget"
- LOCKED/ACTIVE/CLOSEOUT/ARCHIVED: Read-only

**Example implementation:**

```typescript
// In budget page component
const availableActions = await getAvailableActions(teamSeasonId, userId)

{availableActions.includes('SUBMIT_BUDGET_FOR_REVIEW') && (
  <Button onClick={handleSubmitForReview}>
    Submit for Coach Review
  </Button>
)}

{availableActions.includes('APPROVE_BUDGET') && (
  <Button onClick={handleApproveBudget}>
    Approve Budget
  </Button>
)}
```

## Association Rollup

### API Endpoint

`GET /api/association/[associationId]/team-seasons/rollup`

**Query parameters:**
- `state` - Filter by specific state
- `seasonLabel` - Filter by season
- `needsAttention` - Filter teams needing attention
- `includeStats` - Include statistics summary

**Response:**

```json
{
  "rollup": [
    {
      "teamSeasonId": "...",
      "teamName": "Storm U13 AA",
      "division": "U13",
      "seasonLabel": "2024-2025",
      "state": "PRESENTED",
      "stateUpdatedAt": "2024-12-01T10:00:00Z",
      "lastActivityAt": "2024-12-13T15:30:00Z",
      "approvalsProgress": {
        "approvedCount": 12,
        "eligibleCount": 18,
        "percentApproved": 66.67
      },
      "needsAttention": false,
      "needsAttentionReasons": []
    }
  ],
  "stats": {
    "total": 25,
    "byState": {
      "SETUP": 2,
      "BUDGET_DRAFT": 5,
      "BUDGET_REVIEW": 3,
      "TEAM_APPROVED": 1,
      "PRESENTED": 4,
      "LOCKED": 6,
      "ACTIVE": 3,
      "CLOSEOUT": 1,
      "ARCHIVED": 0
    }
  }
}
```

### Needs Attention Flags

The system automatically flags teams that need attention:

- **Approvals pending > 14 days** - PRESENTED state for > 14 days
- **No activity > 30 days** - ACTIVE state with no transactions in 30+ days
- **Budget in review > 7 days** - BUDGET_REVIEW state for > 7 days

## Hard Rules

1. **No editing locked/archived budgets** - Updates must use "Propose Update" to create a new BudgetVersion
2. **Parent acknowledgements only in PRESENTED** - Cannot approve unless state is PRESENTED and presentedVersionId is set
3. **Transactions blocked before LOCKED** - By default, transactions are only allowed in LOCKED, ACTIVE, CLOSEOUT states
4. **ARCHIVED is terminal** - No outgoing transitions, no financial modifications

## Migration Strategy

### For Existing Teams

1. **Create TeamSeason records** for active teams:
   ```sql
   INSERT INTO team_seasons (
     team_id, association_id, season_label,
     season_start, season_end, state
   )
   SELECT
     t.id, at.association_id, t.season,
     t.season_start_date, t.season_end_date,
     CASE
       WHEN b.status = 'LOCKED' THEN 'ACTIVE'::team_season_state
       WHEN b.status = 'PRESENTED' THEN 'PRESENTED'::team_season_state
       ELSE 'SETUP'::team_season_state
     END
   FROM teams t
   LEFT JOIN association_teams at ON at.team_id = t.id
   LEFT JOIN budgets b ON b.team_id = t.id
   ```

2. **Create policy snapshots** for existing team seasons

3. **Update integrations** gradually:
   - Start with new teams
   - Add lifecycle checks to budget workflow
   - Add lifecycle checks to transaction creation
   - Deploy UI gating

## Testing Checklist

- [ ] Create new team season with policy snapshot
- [ ] Transition through happy path (SETUP → ARCHIVED)
- [ ] Test budget update loop (PRESENTED → BUDGET_REVIEW → ... → LOCKED)
- [ ] Test automatic LOCKED transition when parent threshold met
- [ ] Test automatic ACTIVE transition on first transaction
- [ ] Test permission checks for each action
- [ ] Test UI gating shows/hides correct buttons by role
- [ ] Test association rollup API with filters
- [ ] Test needs attention flags
- [ ] Verify audit log entries for all transitions

## Files Created

### Schema
- `prisma/schema.prisma` - Added enums and models

### Types
- `lib/types/team-season.ts` - TypeScript types

### Services
- `lib/services/team-season-lifecycle.ts` - Core transition logic
- `lib/services/team-season-auto-transitions.ts` - Automatic transitions
- `lib/services/team-policy-snapshot.ts` - Policy snapshot management

### Queries
- `lib/db/team-season-rollup.ts` - Association rollup queries

### API
- `app/api/association/[associationId]/team-seasons/rollup/route.ts` - Rollup endpoint

## Next Steps

1. **UI Implementation** - Update budget page and dashboard with state-based actions
2. **Integration** - Wire up transitions in budget workflow and transaction creation
3. **Testing** - Run through all scenarios with real data
4. **Documentation** - Update user documentation with new workflow
5. **Migration** - Create migration script for existing teams

## Support

For questions or issues:
- Check audit logs in `team_season_state_changes` table
- Review transition guards in `team-season-lifecycle.ts`
- Verify permissions in service layer
- Check state machine diagram in project docs
