# Future Feature: Ice Cost Compliance Monitoring

> **Status:** Future Release - Documentation Only
> **Created:** January 2026
> **Context:** Association dashboard scaling and compliance monitoring

## Problem Statement

### The GTHL Lawsuit Context

The Greater Toronto Hockey League (GTHL) faced a class action lawsuit where parents alleged that registration fees were not being spent appropriately on their children's hockey experience. Ice time is typically the largest expense for youth hockey teams, and without transparency into how these costs compare across teams, associations are vulnerable to:

- **Compliance allegations:** Claims that some teams receive better ice time than others
- **Financial mismanagement:** Difficulty identifying teams with unusual spending patterns
- **Parent distrust:** Lack of visibility into where fees actually go

For an association managing 470+ teams, manual oversight of ice costs is impossible. Automated outlier detection becomes essential for proactive compliance monitoring.

## Proposed Solution: Three-View UI Pattern

Rather than presenting all 470 teams in a single list, the UI should be **problem-first** - surfacing what needs attention while allowing drill-down for analysis.

### View 1: Attention Queue (Default)

**Purpose:** Show only teams that need action

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 Needs Attention (12 teams)                               │
├─────────────────────────────────────────────────────────────┤
│ Atom A Hawks     │ Ice cost 47% above division avg │ Review │
│ Peewee AA Storm  │ Missing 3 receipts              │ Review │
│ Bantam B Thunder │ Budget exceeded by $1,200       │ Review │
└─────────────────────────────────────────────────────────────┘
```

**Key characteristics:**
- Only shows teams with actionable issues
- Sorted by severity/urgency
- One-click navigation to team detail
- Badge count visible from association dashboard

### View 2: Team Comparison / Analytics

**Purpose:** Compare teams across divisions for equity analysis

```
┌─────────────────────────────────────────────────────────────┐
│ Ice Cost Comparison - Atom Division                         │
├─────────────────────────────────────────────────────────────┤
│ Division Avg: $12,400/season                                │
│                                                             │
│ ████████████████████ Atom A Hawks      $18,200 (+47%) ⚠️    │
│ ████████████████     Atom A Lightning  $14,100 (+14%)       │
│ ███████████████      Atom AA Storm     $13,200 (+6%)        │
│ ██████████████       Atom A Thunder    $12,400 (avg)        │
│ █████████████        Atom B Wolves     $11,800 (-5%)        │
│ ████████████         Atom B Bears      $10,900 (-12%)       │
└─────────────────────────────────────────────────────────────┘
```

**Key characteristics:**
- Visual bar chart for quick pattern recognition
- Comparison within same division (apples to apples)
- Outliers flagged with warning indicators
- Drill-down to see what's driving the difference

### View 3: Full Team List (Existing)

**Purpose:** Traditional list view for specific team lookup

- Search/filter capabilities
- Useful when you know which team you're looking for
- Paginated or virtualized for 470+ teams

## Data Model Enhancements

Current ice expense tracking captures amount and date. For meaningful compliance monitoring, additional data points are needed:

### Proposed Ice Expense Schema

```typescript
interface IceExpense {
  // Existing fields
  id: string;
  teamId: string;
  amount: number;
  date: Date;
  description: string;
  receiptUrl?: string;

  // New fields for compliance monitoring
  hours: number;              // Duration of ice time
  facility: string;           // Arena/rink name
  iceType: 'practice' | 'game' | 'tournament' | 'skills';
  timeSlot: 'prime' | 'non-prime' | 'weekend';

  // Derived/computed
  costPerHour?: number;       // amount / hours
}
```

### Why These Fields Matter

| Field | Compliance Value |
|-------|------------------|
| **hours** | Enables cost-per-hour comparison (normalizes different booking lengths) |
| **facility** | Different arenas have different rates; explains legitimate variance |
| **iceType** | Game ice often costs more than practice; tournament ice varies |
| **timeSlot** | Prime time (evenings/weekends) costs more; explains variance |

### Example Analysis

Without additional data:
> "Atom A Hawks spent $18,200 on ice vs division average of $12,400"
> *Why? We don't know.*

With additional data:
> "Atom A Hawks spent $18,200 on ice ($85/hr average)"
> "They have 15% more practice hours than other Atom A teams"
> "They use prime-time slots 80% of the time vs 50% division average"
> "Their home facility (Scotiabank Pond) charges 20% more than other arenas"
> *Now we can explain the variance or identify if it needs investigation.*

## Outlier Detection Logic

### Flagging Rules (Configurable per Association)

```typescript
interface OutlierThresholds {
  // Percentage above division average to flag
  costVarianceWarning: number;   // Default: 25%
  costVarianceCritical: number;  // Default: 50%

  // Cost per hour thresholds
  costPerHourMax: number;        // Default: $150/hr

  // Comparison basis
  compareTo: 'division' | 'ageGroup' | 'allTeams';
}
```

### Flagging Algorithm (Pseudocode)

```
For each team in division:
  1. Calculate team's total ice spend
  2. Calculate division average ice spend
  3. Calculate variance percentage

  If variance > criticalThreshold:
    Flag as CRITICAL (red)
  Else if variance > warningThreshold:
    Flag as WARNING (yellow)
  Else:
    Flag as NORMAL (green)

  // Secondary checks
  If costPerHour > costPerHourMax:
    Add flag: "High hourly rate"
  If primeTimePercentage > 90%:
    Add note: "Primarily prime-time bookings"
```

## UX Considerations for Volunteer Treasurers

### Challenge: Part-Time, Non-Technical Users

Association treasurers are typically:
- Volunteers with day jobs
- Parents, not accountants
- Limited time for administrative tasks
- Using the system evenings/weekends

### Design Principles

1. **Surface problems, don't make them dig**
   - Dashboard shows "12 teams need attention" not "View 470 teams"
   - Email digest: "3 new issues this week" with direct links

2. **Explain, don't just flag**
   - Not just "Ice cost is high" but "Ice cost is 47% above similar teams, primarily due to prime-time bookings"
   - Actionable guidance: "Review with team manager" or "Approve if prime-time is intentional"

3. **One-click resolution paths**
   - "Mark as Reviewed" with optional note
   - "Request Explanation from Team Manager" (sends email)
   - "Flag for Board Review" (escalates)

4. **Reduce cognitive load**
   - Color coding (red/yellow/green) over numbers
   - Trend arrows (↑↓→) for quick pattern recognition
   - Mobile-friendly for checking on the go

## Implementation Considerations

### Phase 1: Data Collection
- Add optional fields to ice expense entry
- Bulk import support from arena invoices
- Retroactive data entry for historical analysis

### Phase 2: Basic Comparison
- Division-level aggregation
- Simple variance calculation
- Basic flagging with manual thresholds

### Phase 3: Smart Detection
- Configurable thresholds per association
- Multi-factor analysis (hours + facility + time slot)
- Trend analysis (month-over-month, year-over-year)

### Phase 4: Proactive Notifications
- Weekly digest emails to association treasurers
- Real-time alerts for critical outliers
- Board reporting dashboards

## Related Features

- **Team Health Scoring** (see `docs/TEAM_HEALTH_SCORING.md`) - Ice compliance could be a factor
- **Budget Approval Workflow** - Flag ice expenses during approval if outlier
- **Season Closure** - Include ice cost analysis in year-end reports

## Open Questions

1. **Data entry burden:** How do we make entering hours/facility/time slot easy for team treasurers?
   - OCR from arena invoices?
   - Integration with arena booking systems?
   - Default facility per team?

2. **Historical data:** Should we require this data going forward only, or attempt to enrich historical records?

3. **Privacy:** Should teams see how they compare to others, or only association admins?

4. **Thresholds:** Should we provide suggested thresholds based on aggregate data across associations?

---

*This document captures feature discussions for future development. Implementation timeline TBD based on customer feedback and roadmap priorities.*
