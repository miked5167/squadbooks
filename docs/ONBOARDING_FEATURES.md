# Onboarding Wizard - New Features

This document describes the new features added to the HuddleBooks onboarding wizard.

## Table of Contents
1. [Back Button Navigation](#back-button-navigation)
2. [Accept Invitation Flow](#accept-invitation-flow)
3. [Analytics & Funnel Tracking](#analytics--funnel-tracking)

---

## Back Button Navigation

### Overview
Users can now navigate backward through the onboarding wizard to edit previous entries without losing progress.

### Implementation Details

#### Files Modified
- `app/onboarding/components/StepBudget.tsx`
- `app/onboarding/components/StepPowerUp.tsx`
- `app/onboarding/components/StepTeamBasics.tsx`
- `app/onboarding/page.tsx`

#### How It Works
1. Each step component now accepts an `onBack` prop
2. Step 1 (Team Basics) accepts `initialData` to prefill the form when returning from Step 2
3. When returning to Step 1 with an existing `teamId`, the form skips API calls and proceeds with cached data
4. State is preserved in the parent component (`page.tsx`) via `wizardData`

#### User Experience
- Back buttons appear on Steps 2 and 3
- Returning to previous steps shows previously entered data
- No duplicate team creation when editing Step 1 after creating a team

#### Code Example
```typescript
// In page.tsx
<StepBudget
  teamId={wizardData.teamId}
  teamLevel={wizardData.teamLevel}
  onComplete={(budgetTotal) => {
    setWizardData({ ...wizardData, budgetTotal });
    setCurrentStep(3);
  }}
  onBack={() => setCurrentStep(1)}
/>
```

---

## Accept Invitation Flow

### Overview
Team members can now accept email invitations to join existing teams.

### Implementation Details

#### New Files Created
- `app/accept-invitation/page.tsx` - Invitation acceptance UI
- `app/api/accept-invitation/route.ts` - API for validating and accepting invitations

#### Database Schema
The `Invitation` model includes:
- `token` - Unique token for the invitation URL
- `email` - Invited user's email
- `name` - Invited user's name
- `role` - Role they'll have (PRESIDENT, BOARD_MEMBER, etc.)
- `expiresAt` - Expiration date (7 days from creation)
- `acceptedAt` - Timestamp when accepted

#### Invitation Flow
1. Treasurer sends invitation from Step 3 of onboarding or Settings
2. Invitee receives email with unique link: `/accept-invitation?token=xyz`
3. Invitee clicks link and sees invitation details
4. Invitee signs in or creates account
5. System links user to team with specified role
6. Invitation marked as accepted
7. User redirected to dashboard

#### API Endpoints

**GET /api/accept-invitation?token={token}**
- Validates token and returns invitation details
- Returns 404 if invalid token
- Returns 410 if expired or already accepted

**POST /api/accept-invitation**
- Accepts the invitation
- Creates or updates user record
- Links user to team
- Creates audit log entry

#### Security Features
- Tokens are unique and non-guessable
- Invitations expire after 7 days
- Cannot accept invitation twice
- Email verification through Clerk authentication

#### Code Example
```typescript
// Sending invitation from Step 3
const response = await fetch('/api/onboarding/invitations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teamId,
    teamName,
    email: 'president@example.com',
    name: 'John Smith',
    role: 'PRESIDENT',
  }),
});
```

---

## Analytics & Funnel Tracking

### Overview
Comprehensive analytics system that tracks user progression through the onboarding funnel to identify drop-off points and optimization opportunities.

### Implementation Details

#### New Files Created
- `lib/analytics/onboarding-analytics.ts` - Client-side tracking utilities
- `lib/analytics/funnel-analytics.ts` - Server-side analytics queries
- `app/api/analytics/onboarding/route.ts` - Analytics ingestion endpoint
- `app/api/analytics/funnel/route.ts` - Analytics retrieval endpoint
- `app/admin/analytics/page.tsx` - Analytics dashboard UI

#### Tracked Events
- **start** - User begins a step
- **complete** - User finishes a step and proceeds
- **back** - User navigates backward
- **skip** - User skips optional features (Step 3)
- **abandon** - User closes browser/tab (tracked via `beforeunload`)

#### Event Data Structure
```typescript
{
  step: 2,
  stepName: 'Budget Setup',
  action: 'complete',
  timestamp: '2025-01-21T12:30:00Z',
  metadata: {
    budgetTotal: 25000,
  },
  screenWidth: 1920,
  screenHeight: 1080,
  userAgent: 'Mozilla/5.0...'
}
```

#### Storage
Events are stored in the `audit_logs` table with:
- `action` = `ONBOARDING_{ACTION}` (e.g., `ONBOARDING_COMPLETE`)
- `entityType` = `Onboarding`
- `entityId` = `step-{stepNumber}`
- `newValues` = JSON containing event details

#### Metrics Calculated
1. **Step Progression**
   - Users who started each step
   - Users who completed each step
   - Users who went back from each step

2. **Conversion Rate**
   - Percentage of users who complete all steps

3. **Drop-off Analysis**
   - Which steps have highest abandonment
   - Drop-off rates per step

4. **Time Analysis**
   - Average time spent on each step
   - Identifies steps that are too slow/confusing

5. **Back Navigation**
   - How often users go back to edit
   - Which steps trigger the most edits

#### Analytics Dashboard
Access at `/admin/analytics`

Features:
- **Key Metrics Cards**
  - Total users started
  - Total completions
  - Conversion rate
  - Total abandons

- **Funnel Visualization**
  - Visual progress bars for each step
  - Shows completed, abandoned, and back navigation counts

- **Drop-off Analysis**
  - Ranked list of steps by drop-off rate
  - Helps identify problem areas

- **Time Analytics**
  - Average duration per step
  - Helps identify friction points

#### Integration Example
```typescript
// In page.tsx
useEffect(() => {
  // Track when user starts a step
  trackOnboardingEvent({
    step: currentStep,
    stepName: getStepName(currentStep),
    action: 'start',
  });

  // Setup abandon tracking
  const cleanup = setupAbandonTracking(currentStep, getStepName(currentStep));
  return cleanup;
}, [currentStep]);
```

#### Querying Analytics
```typescript
// Server-side query
import { getOnboardingFunnelMetrics } from '@/lib/analytics/funnel-analytics';

const metrics = await getOnboardingFunnelMetrics(
  new Date('2025-01-01'), // Start date
  new Date('2025-01-31')  // End date
);

console.log(metrics.conversionRate); // 68.5
console.log(metrics.dropOffPoints); // Array of drop-off analysis
```

---

## Testing the Features

### Back Button Navigation
1. Start onboarding at `/onboarding`
2. Complete Step 1 with team details
3. On Step 2, click "← Back"
4. Verify Step 1 form is prefilled with previous data
5. Click "Continue →" without changing anything
6. Verify you proceed to Step 2 without creating duplicate team

### Accept Invitation
1. Complete onboarding wizard to Step 3
2. Add an approver with email and name
3. Check invitation email (in development, check logs for the invitation URL)
4. Open invitation URL in incognito window
5. Click "Create Account" or "Sign In"
6. After authentication, verify auto-accept and redirect to dashboard
7. Verify user's role is set correctly in database

### Analytics Tracking
1. Open browser DevTools Network tab
2. Complete onboarding wizard
3. Verify POST requests to `/api/analytics/onboarding` for each step
4. Navigate to `/admin/analytics`
5. Verify metrics are displayed correctly
6. Test different date ranges
7. Verify drop-off and time metrics

### Abandon Tracking
1. Start onboarding at `/onboarding`
2. Complete Step 1
3. On Step 2, close the browser tab
4. Check audit logs for `ONBOARDING_ABANDON` event
5. Verify analytics dashboard shows abandon count

---

## Environment Variables

No new environment variables required. Existing variables used:
- `RESEND_API_KEY` - For sending invitation emails
- `NEXT_PUBLIC_APP_URL` - For generating invitation URLs

---

## Database Migrations

Run the following to update your database:
```bash
npx prisma db push
npx prisma generate
```

This adds:
- `PRESIDENT` role to `UserRole` enum
- `Invitation` model
- Relationship between `Team` and `Invitation`

---

## Future Enhancements

### Back Button Navigation
- [ ] Add confirmation dialog if user has unsaved changes
- [ ] Allow editing team name/details after creation
- [ ] Add "Save Draft" functionality

### Accept Invitation
- [ ] Resend invitation feature
- [ ] Bulk invitation import via CSV
- [ ] Custom invitation message/branding
- [ ] Invitation reminder emails

### Analytics
- [ ] Export analytics to CSV/PDF
- [ ] Real-time dashboard with WebSocket updates
- [ ] A/B testing framework for onboarding variations
- [ ] Integration with PostHog/Mixpanel/Amplitude
- [ ] Cohort analysis (compare user groups)
- [ ] Email alerts for low conversion rates

---

## API Reference

### POST /api/onboarding/invitations
Send a team invitation

**Request:**
```json
{
  "teamId": "clx123",
  "teamName": "Storm U13 AA",
  "email": "john@example.com",
  "name": "John Smith",
  "role": "PRESIDENT"
}
```

**Response:**
```json
{
  "success": true,
  "invitation": {
    "id": "clx456",
    "email": "john@example.com",
    "name": "John Smith",
    "role": "PRESIDENT"
  }
}
```

### GET /api/accept-invitation?token={token}
Validate invitation token

**Response:**
```json
{
  "success": true,
  "invitation": {
    "email": "john@example.com",
    "name": "John Smith",
    "role": "PRESIDENT",
    "team": {
      "id": "clx123",
      "name": "Storm U13 AA",
      "level": "aa",
      "season": "2024-2025"
    }
  }
}
```

### POST /api/accept-invitation
Accept invitation (requires authentication)

**Request:**
```json
{
  "token": "abc123xyz"
}
```

**Response:**
```json
{
  "success": true,
  "team": {
    "id": "clx123",
    "name": "Storm U13 AA"
  }
}
```

### POST /api/analytics/onboarding
Track onboarding event

**Request:**
```json
{
  "step": 2,
  "stepName": "Budget Setup",
  "action": "complete",
  "metadata": {
    "budgetTotal": 25000
  },
  "timestamp": "2025-01-21T12:30:00Z",
  "screenWidth": 1920,
  "screenHeight": 1080,
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /api/analytics/funnel?days=30
Get funnel metrics

**Response:**
```json
{
  "success": true,
  "metrics": {
    "step1Started": 100,
    "step1Completed": 85,
    "step2Started": 85,
    "step2Completed": 70,
    "step3Started": 70,
    "step3Completed": 50,
    "step3Skipped": 10,
    "step4Reached": 60,
    "totalAbandons": 15,
    "conversionRate": 60,
    "dropOffPoints": [...]
  },
  "durations": [...],
  "dateRange": {
    "start": "2024-12-22T00:00:00Z",
    "end": "2025-01-21T00:00:00Z",
    "days": 30
  }
}
```

---

## Support

For questions or issues, check:
- [Main README](../README.md)
- [Project Documentation](../docs/)
- GitHub Issues

---

**Last Updated:** January 21, 2025
**Version:** 1.0.0
