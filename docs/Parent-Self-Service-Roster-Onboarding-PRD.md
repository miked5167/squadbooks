# Parent Self-Service Roster Onboarding — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 2025-11-28
**Status:** Draft

## Overview
This feature allows team admins to onboard players by simply entering a parent email and player name. The parent then receives a secure, single-use magic link that takes them to a self-service page where they complete the player's roster information.

This reduces admin workload, increases data accuracy, and moves sensitive information entry (medical notes, emergency contacts) to the parent.

The feature must work during:
- Team onboarding wizard
- Mid-season roster updates
- Manual additions

CSV import must continue to be supported.

---

## Goals

### Primary Goals
- Reduce admin data-entry workload.
- Ensure accurate, up-to-date roster information.
- Improve privacy by having parents enter their own sensitive data.
- Provide a frictionless parent flow (no password/login required).

### Secondary Goals
- Provide admins visibility into onboarding progress.
- Enable automated reminders for incomplete data.
- Lay groundwork for future parent portal features.

---

## User Roles

### Team Admin / Treasurer / Coach
- Adds player + parent email manually OR via CSV.
- Sends parent invites.
- Monitors roster completion.
- Resends reminders.

### Parent / Guardian
- Receives invite email with unique magic link.
- Confirms player info.
- Completes roster details (contacts, medical notes, etc.).
- Submits form.

---

## Core Use Cases

### 1. Admin Adds Player Manually
Admin inputs:
- Player Name (required)
- Parent/Guardian Name (optional)
- Parent Email (required)
- Optional: jersey number, position

System creates a "Pending Parent Completion" status.

### 2. Admin Imports via CSV
CSV mapping:
- Player Name
- Parent Email
- (Optional) Parent Name
- (Optional) Jersey / Position

After import, admin can bulk-send invites.

### 3. Parent Receives Magic Link
Email includes:
- Player name
- Team name
- Secure, single-use tokenized URL
  - Example: `/onboarding/parent?token=XYZ`

### 4. Parent Completes Roster Info
Parent-facing form includes:
- Confirm Player Name (locked after submission)
- Parent/Guardian Name
- Contact Info (email, phone)
- Emergency Contact (name, relation, phone)
- Medical Information (allergies, notes)
- Optional: Player photo
- Submit

### 5. Admin Views Progress
Admin dashboard section shows:
- Player name
- Parent email
- Status: Not Sent / Invited / Completed
- Invite sent date
- Last reminder date
- Actions:
  - Resend invite
  - Copy link
  - Complete manually

---

## Flow Diagram (Text)

```
Admin adds or imports players →
System creates roster entries →
Admin clicks "Send Parent Invites" →
System sends magic link emails →
Parent clicks link →
Parent sees prefilled player info →
Parent completes roster form →
System marks player as COMPLETE →
Admin dashboard updates in real time
```

---

## Functional Requirements

### Backend
- Generate secure, single-use, expiring magic link tokens.
- Token tied to:
  - parentId
  - playerId
  - teamId
- Token expiration default: 7 days (configurable).
- Magic link can be refreshed and reissued.
- Track:
  - inviteSentAt
  - remindersSentCount
  - completedAt
- Ensure parent form writes to Player + Parent tables.
- Prevent re-submission after completion unless admin enables edit.

### Frontend (Admin)
- UI to add players manually.
- UI to import CSV.
- "Send Invites" button.
- Roster completion tracker table.
- Status chips (Pending / Sent / Completed).
- Resend invite button.
- Copy onboarding link button.

### Frontend (Parent)
- Mobile-optimized page.
- Prefilled data (read-only where appropriate).
- Form to capture required info.
- Submit success screen.
- Token invalid/expired screen with option to request a new link.

---

## Email Requirements

**Subject:**
```
Complete Your Player's Roster Information for {TEAM_NAME}
```

**Body:**
- Friendly message
- Magic link button
- Expiration warning
- Support email for help

---

## Security Requirements
- Tokens must be:
  - UUID or cryptographically secure
  - One-time use
  - Expire after X days
  - Marked invalid after submission
- Parent cannot access another child's record
- Parent cannot modify player name unless allowed by admin
- Tokens stored hashed in database (similar to password reset tokens)

---

## Database Changes

### New Table: `ParentInviteToken`
```
id (uuid)
parentId
playerId
teamId
tokenHash
expiresAt
usedAt
createdAt
updatedAt
```

### Update `Player`
Add:
- `onboardingStatus` ("not_invited" | "invited" | "completed")
- `completedAt`
- `inviteSentAt`
- `reminderCount`

### Update `Parent`
Add:
- `primaryPhone`
- `secondaryPhone`
- `address` (optional future expansion)

---

## Non-Functional Requirements
- Page must load in <200ms (cached server-side).
- Email delivery must use existing mail provider.
- Parent flow must work without login.
- Must support multiple players per household (open one link per child).

---

## Edge Cases
- Parent email is wrong → admin edits email → resend invite.
- Parent has multiple children → each child gets unique link.
- Parent completes first child but abandons second → reminders needed.
- Token expired → parent sees "Token expired" screen + "Request new link".

---

## Milestones

### Phase 1 — MVP Core (Completed)
- ✅ Manual player addition
- ✅ Generate + send magic links (individual)
- ✅ Parent onboarding form
- ✅ Update player status to completed
- ✅ Admin progress visibility (onboarding column)
- ✅ Token security (hashing, expiry, one-time use)
- ✅ Email templates with team branding

### Phase 1.5 — Bulk Actions & CSV Integration (Deferred)

**Bulk Invite Actions:**
- "Send Invites to All" button
  - Bulk-send to all NOT_INVITED players with families
  - Smart filtering (only sends to players with family email)
- Checkbox selection UI
  - Multi-select players in roster table
  - Bulk action toolbar appears when selection made
- Confirmation dialog
  - Shows count of invites to be sent
  - Lists player names and recipient emails
  - "Send X Invites" button with loading state

**CSV Import Integration:**
- Post-import workflow
  - After CSV import completes, show summary of imported players
  - Display count: total imported, ready for invites, missing family info
- "Send Invites Now" option
  - Offer in import success dialog
  - Pre-select all imported players for batch invite
- Batch tracking
  - Track which players were imported together
  - Enable "Send invites to this import batch" action

**Individual Player Actions:**
- "Resend Invite" button
  - Available for INVITED status players
  - Regenerates new token, invalidates old one
  - Sends fresh email with new expiry date
  - Increments reminder count
- "Copy Link" button
  - Generates shareable onboarding URL
  - Copies to clipboard with toast notification
  - Useful for manual sharing (SMS, messaging apps)
- "Mark as Complete" override
  - Admin can manually mark player as COMPLETED
  - Skips parent form requirement
  - Requires confirmation dialog
  - Audit log entry created

**Progress Dashboard Enhancements:**
- Status filter dropdown
  - Filter options: All / Not Invited / Invited / Completed
  - Shows count for each status in dropdown
  - Persists filter selection in URL query params
- Bulk action toolbar
  - Appears when 1+ players selected via checkbox
  - Actions: Send Invites, Export Selected, Deselect All
  - Shows selection count
- Enhanced table columns
  - Add "Invite Sent" column (date or "—")
  - Add "Reminder Count" column (number or "—")
  - Sortable by onboarding status and invite date

### Phase 2 (1 Week)
- Automated reminder system
  - Scheduled job to check incomplete invites
  - Send reminder emails after X days
  - Configurable reminder cadence
  - Max reminder limit
- Multiple guardians per family
  - Support primary + secondary contacts
  - Separate onboarding links per guardian
- Edit player/parent data after completion
  - Allow parents to update info post-submission
  - Admin approval workflow for changes
  - Version history tracking

### Phase 3 (Later)
- Parent login portal
- Parent dashboard (payments, budget view, transactions)

---

# End of Document
