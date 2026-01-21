# Activity & Audit Implementation Guide

## Overview

The Activity/Audit page has been transformed from a basic log viewer into a comprehensive oversight and audit tool with:

- **Day-based grouping** for better readability
- **Advanced filtering** by user, date range, category, and search
- **Event categorization** with icons and color coding
- **Potential issues detection** for anomalies and suspicious patterns
- **Weekly activity summaries** with aggregated statistics
- **Event details drawer** with before/after diffs
- **Pagination** for performance
- **Reduced onboarding noise** by hiding step-by-step events

---

## Architecture

### 1. Data Model

**Updated `AuditLog` model** (`prisma/schema.prisma:513-537`):

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  teamId     String
  userId     String
  action     String   // "CREATE_TRANSACTION", "APPROVE_EXPENSE", etc.
  entityType String   // "Transaction", "Approval", etc.
  entityId   String
  oldValues  Json?    // Previous state snapshot
  newValues  Json?    // New state snapshot
  metadata   Json?    // Extra contextual data (vendor, amount, category, etc.)
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@index([teamId])
  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@index([action])
  @@map("audit_logs")
}
```

**Key fields:**
- `oldValues` / `newValues`: Store JSON snapshots for before/after diffs
- `metadata`: Additional context like vendor, amount, category for searchability
- Indexes on `action` for efficient category filtering

---

### 2. Core Libraries

#### Event Configuration (`lib/activity/event-config.ts`)

Maps audit actions to display configuration:

```typescript
{
  category: EventCategoryType,      // For filtering
  icon: LucideIcon,                 // Visual representation
  badgeVariant: BadgeVariant,       // Color coding
  label: string,                    // Human-readable label
  hideByDefault?: boolean           // For noisy events
}
```

**Event categories:**
- Transactions
- Approvals
- Budget Changes
- Settings Changes
- Users & Roles
- Receipts
- Categories
- Onboarding
- Season Closure

**Badge variants** (color coding):
- `success` (green): Approvals, completions
- `error` (red): Rejections, deletions
- `warning` (yellow): Updates, modifications
- `info` (blue): Creations
- `purple`: Settings changes
- `default` (gray): Other

#### Grouping Utilities (`lib/activity/grouping.ts`)

**`groupAuditLogsByDay(logs)`**
- Groups events by calendar day
- Returns array of `{ date, label, events }`
- Labels: "Today", "Yesterday", or formatted date
- Sorted newest first

**`formatDateLabel(date)`**
- Returns "Today" / "Yesterday" / "Nov 25, 2025"

**`generateEventSummary(log)`**
- Creates human-readable event descriptions
- Example: "created a transaction for $150 at Starbucks"
- Uses metadata and newValues/oldValues for context

#### Potential Issues Detection (`lib/activity/potential-issues.ts`)

Rule-based anomaly detection:

1. **Self-approvals**: Submitter == approver
2. **Duplicate expenses**: Same vendor + amount within 7 days
3. **Missing receipts**: Transactions > 7 days old without receipt
4. **Multiple edits**: 3+ edits within 24 hours

Each issue includes:
- Type, severity (high/medium/low)
- Title, description
- Link to entity
- Detection timestamp

#### Weekly Summary (`lib/activity/weekly-summary.ts`)

**`getActivitySummary(teamId, options)`**

Aggregates statistics:
- Total events
- Transactions created/approved/rejected
- Budget changes, settings changes
- Users added
- Top active users
- Category breakdown

Supports periods: today, last 7 days, last 30 days, this month, last month

---

### 3. API Routes

#### `GET /api/activity/logs`

Query parameters:
- `page`, `pageSize`: Pagination
- `search`: Free-text search (vendor, amount, category, user)
- `userId`: Filter by user
- `categories`: Comma-separated list
- `actions`: Comma-separated action types
- `startDate`, `endDate`: Date range
- `hideOnboarding`: Boolean (default: true)

Returns:
```json
{
  "logs": [...],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalCount": 150,
    "totalPages": 6
  }
}
```

#### `GET /api/activity/summary`

Query parameters:
- `period`: 'day', 'week', or 'month'

Returns:
```json
{
  "summary": { ... },
  "issues": [ ... ]
}
```

#### `GET /api/team/members`

Returns list of team members for user filter dropdown.

---

### 4. UI Components

#### `ActivityPage` (`app/activity/page.tsx`)

Main page component with:
- Weekly summary card
- Potential issues card
- Filter bar
- Grouped activity feed
- Pagination
- Event details drawer

State management:
- Filters, pagination, selected event
- API data fetching with React hooks
- Sticky filter bar (stays visible on scroll)

#### `ActivityFiltersBar`

Provides:
- Search input (vendor, amount, category, user)
- Date range selector (Today, 7 days, 30 days, All)
- User selector dropdown
- Category filter pills
- Hide/show onboarding toggle
- Clear all filters button
- Results count

#### `ActivityFeed`

Renders list of events with:
- Icon, badge, timestamp
- User name + action summary
- Entity type and ID
- Click to open details drawer
- Keyboard accessible (Tab, Enter, Esc)

#### `EventDetailsDrawer`

Displays full event details:
- User information
- Event details (action, entity, timestamp)
- Transaction-specific details (if applicable)
- **Before/After diff** of changed fields
- Additional metadata
- Technical details (IP, user agent)
- Link to view entity

#### `WeeklySummaryCard`

Shows:
- Stats grid (transactions, approvals, budget changes, etc.)
- Top active users (top 3)
- Activity breakdown by category

#### `PotentialIssuesCard`

Lists detected issues:
- Severity badge (high/medium/low)
- Description
- Link to entity
- Collapsible section

---

## How Filtering Works

### Server-side Filtering

The `/api/activity/logs` route builds a Prisma `where` clause from query parameters:

```typescript
// User filter
if (userIdFilter) {
  where.userId = userIdFilter
}

// Date range
if (startDate || endDate) {
  where.createdAt = {
    gte: startDate,
    lte: endDate
  }
}

// Categories map to actions
if (categories.includes('TRANSACTIONS')) {
  where.action = {
    in: ['CREATE_TRANSACTION', 'UPDATE_TRANSACTION', 'DELETE_TRANSACTION']
  }
}
```

### Client-side Search

For search queries, we fetch data and filter in memory (for simplicity):
- User name
- Metadata fields (vendor, amount, category)
- New values (for updated fields)

This could be optimized with database-specific JSON search in production.

---

## How Grouping Works

**Day-based grouping** is implemented in `lib/activity/grouping.ts`:

```typescript
function groupAuditLogsByDay(logs) {
  const groupMap = new Map<string, AuditLogWithUser[]>()

  for (const log of logs) {
    const dateKey = getDateKey(log.createdAt) // "YYYY-MM-DD"
    groupMap.set(dateKey, [...existing, log])
  }

  return Array.from(groupMap.entries()).map(([dateKey, events]) => ({
    date: new Date(dateKey),
    label: formatDateLabel(date),
    events: events.sort((a, b) => b.createdAt - a.createdAt)
  }))
}
```

Each group renders:
- Sticky day header ("Today", "Yesterday", etc.)
- Events within that day (newest first)

---

## How Before/After Diffs Work

The `EventDetailsDrawer` compares `oldValues` and `newValues`:

```typescript
Object.keys(newValues).map(key => {
  const oldValue = oldValues[key]
  const newValue = newValues[key]

  if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
    // Show diff: Before (red) → After (green)
  }
})
```

Displays:
- Field name
- Before value (red background)
- Arrow
- After value (green background)

---

## Onboarding Noise Reduction

By default, onboarding step events are hidden:

```typescript
hideOnboarding: true
```

This filters out events like:
- `ONBOARDING_STEP_1_START`
- `ONBOARDING_STEP_2_COMPLETE`
- etc.

But keeps:
- `ONBOARDING_START`
- `ONBOARDING_COMPLETE`

Users can toggle "Show onboarding" to see all events.

---

## Usage Examples

### Creating Audit Logs with Metadata

```typescript
import { createAuditLog, AuditAction, EntityType } from '@/lib/db/audit'

await createAuditLog({
  teamId: team.id,
  userId: user.id,
  action: AuditAction.CREATE_TRANSACTION,
  entityType: EntityType.TRANSACTION,
  entityId: transaction.id,
  newValues: {
    vendor: transaction.vendor,
    amount: transaction.amount,
    category: transaction.category,
    status: transaction.status,
  },
  metadata: {
    vendor: transaction.vendor,
    amount: transaction.amount,
    category: category.name,
  },
  ipAddress: requestMetadata.ipAddress,
  userAgent: requestMetadata.userAgent,
})
```

### Updating Entities with Diffs

```typescript
const oldValues = {
  amount: oldTransaction.amount,
  category: oldTransaction.category,
  status: oldTransaction.status,
}

const newValues = {
  amount: updatedTransaction.amount,
  category: updatedTransaction.category,
  status: updatedTransaction.status,
}

await createAuditLog({
  action: AuditAction.UPDATE_TRANSACTION,
  entityType: EntityType.TRANSACTION,
  entityId: transaction.id,
  oldValues,
  newValues,
  metadata: {
    vendor: transaction.vendor,
    amount: newValues.amount,
  },
  // ...
})
```

---

## Future Enhancements

### AI-Powered Summary (Placeholder Ready)

The `WeeklySummaryCard` is structured to support AI-generated summaries:

```typescript
// Current: Simple count-based summary
// Future: Replace with AI call
const aiSummary = await generateAISummary(teamId, dateRange)
```

The `getActivitySummary` function can be extended to call an AI model for natural language insights.

### Advanced Anomaly Detection

Current rules are simple. Future enhancements:
- Machine learning models for anomaly detection
- Customizable rule thresholds per team
- Trend analysis and forecasting

### Export & Reporting

Add ability to:
- Export filtered audit logs to CSV/PDF
- Schedule automated reports
- Email digests to team admins

---

## Performance Considerations

1. **Pagination**: Limited to 25 events per page
2. **Indexes**: Database indexes on `teamId`, `userId`, `action`, `createdAt`, and composite indexes
3. **Eager loading**: User data included in single query
4. **Sticky headers**: CSS `position: sticky` for filter bar and day headers
5. **Lazy loading**: Event details only loaded when drawer opens

---

## Keyboard Accessibility

- **Tab**: Navigate between filters and events
- **Enter/Space**: Open event details
- **Esc**: Close event details drawer
- Focus management in drawer

---

## Testing Checklist

- [ ] Filter by user
- [ ] Filter by date range
- [ ] Filter by category
- [ ] Search by vendor/amount/category
- [ ] Toggle onboarding events
- [ ] Clear all filters
- [ ] Click event to open drawer
- [ ] View before/after diffs
- [ ] Navigate pagination
- [ ] Check potential issues detection
- [ ] Verify weekly summary stats
- [ ] Test keyboard navigation
- [ ] Verify responsive layout

---

## File Structure

```
lib/
  activity/
    event-config.ts          # Event categorization & display config
    grouping.ts              # Day-based grouping utilities
    potential-issues.ts      # Anomaly detection
    weekly-summary.ts        # Activity summary generation
  db/
    audit.ts                 # Audit log creation & querying

app/
  activity/
    page.tsx                 # Main Activity page (client component)
  api/
    activity/
      logs/route.ts          # Filtered audit logs API
      summary/route.ts       # Summary & issues API
    team/
      members/route.ts       # Team members API

components/
  activity/
    activity-filters.tsx     # Filter bar component
    activity-feed.tsx        # Event list component
    event-details-drawer.tsx # Event details drawer
    weekly-summary-card.tsx  # Summary card
    potential-issues-card.tsx # Issues card

prisma/
  schema.prisma            # Updated AuditLog model
```

---

## Maintenance Notes

### Adding New Event Types

1. Update `lib/db/audit.ts` with new action constant
2. Add mapping in `lib/activity/event-config.ts`:
   ```typescript
   MY_NEW_ACTION: {
     category: EventCategory.SETTINGS,
     icon: Settings,
     badgeVariant: 'purple',
     label: 'My Action Label',
   }
   ```
3. Update `generateEventSummary()` in `grouping.ts` if custom summary needed

### Adding New Issue Detection Rules

Add function to `lib/activity/potential-issues.ts`:

```typescript
async function detectMyNewIssue(teamId: string): Promise<PotentialIssue[]> {
  // Query logic
  // Return array of issues
}
```

Include in `detectPotentialIssues()`.

---

## Questions & Support

For issues or questions, refer to:
- Prisma schema: `prisma/schema.prisma`
- Event config: `lib/activity/event-config.ts`
- Main page: `app/activity/page.tsx`
