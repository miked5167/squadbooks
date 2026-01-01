# SpendIntent API Documentation

## Overview

The SpendIntent APIs provide endpoints for creating spend intents and managing their approval workflows. These APIs integrate with the GTHL Authorization Rules Engine to determine whether a spend requires manual approval or can proceed under standing budget authorization.

## Endpoints

### 1. Create SpendIntent

**Endpoint:** `POST /api/spend-intents`

**Description:** Creates a new spend intent and determines its authorization requirements using the authorization rules engine.

**Authentication:** Required (Clerk JWT)

**Authorization:** User must belong to the specified team

#### Request Body

```json
{
  "teamId": "string (required)",
  "amountCents": "number (required)",
  "paymentMethod": "CASH | CHEQUE | E_TRANSFER (required)",
  "vendorId": "string (optional)",
  "vendorName": "string (optional)",
  "budgetLineItemId": "string (optional)",
  "currency": "string (optional, default: CAD)"
}
```

**Field Descriptions:**

- `teamId`: The ID of the team making the spend
- `amountCents`: Amount in cents (e.g., 25000 = $250.00)
- `paymentMethod`: How the payment will be made
- `vendorId`: ID of existing vendor (indicates known vendor)
- `vendorName`: Name of vendor if new/unknown
- `budgetLineItemId`: ID of the budget envelope this spend is associated with
- `currency`: Currency code (default: "CAD")

**Note:** Either `vendorId` OR `vendorName` must be provided (not both).

#### Response (Success - Standing Authorization)

**Status:** 200 OK

```json
{
  "spendIntent": {
    "id": "clx123abc456",
    "teamId": "team_abc123",
    "createdByUserId": "user_xyz789",
    "amountCents": 25000,
    "currency": "CAD",
    "vendorId": "vendor_123",
    "vendorName": null,
    "budgetLineItemId": "envelope_456",
    "paymentMethod": "E_TRANSFER",
    "authorizationType": "STANDING_BUDGET_AUTHORIZATION",
    "requiresManualApproval": false,
    "status": "AUTHORIZED",
    "authorizedAt": "2025-01-01T19:30:00.000Z",
    "createdAt": "2025-01-01T19:30:00.000Z",
    "updatedAt": "2025-01-01T19:30:00.000Z",
    "approvals": [],
    "team": {
      "id": "team_abc123",
      "name": "U13 AA Storm"
    },
    "creator": {
      "id": "user_xyz789",
      "name": "John Treasurer",
      "email": "treasurer@team.com"
    }
  },
  "authorizationDetails": {
    "requiresManualApproval": false,
    "authorizationType": "STANDING_BUDGET_AUTHORIZATION",
    "requiredApprovalsCount": 0,
    "minIndependentParentRepCount": 0,
    "reason": "Spend qualifies for standing budget authorization (budgeted, approved, known vendor, no conflict)",
    "conditions": {
      "hasBudgetLineItem": true,
      "budgetApproved": true,
      "vendorKnown": true,
      "noTreasurerConflict": true
    }
  }
}
```

#### Response (Success - Manual Approval Required)

**Status:** 200 OK

```json
{
  "spendIntent": {
    "id": "clx123abc789",
    "teamId": "team_abc123",
    "createdByUserId": "user_xyz789",
    "amountCents": 15000,
    "currency": "CAD",
    "vendorId": null,
    "vendorName": "New Vendor Inc",
    "budgetLineItemId": "envelope_456",
    "paymentMethod": "E_TRANSFER",
    "authorizationType": "MANUAL_SIGNER_APPROVAL",
    "requiresManualApproval": true,
    "status": "AUTHORIZATION_PENDING",
    "authorizedAt": null,
    "createdAt": "2025-01-01T19:30:00.000Z",
    "updatedAt": "2025-01-01T19:30:00.000Z",
    "approvals": [],
    "team": {
      "id": "team_abc123",
      "name": "U13 AA Storm"
    },
    "creator": {
      "id": "user_xyz789",
      "name": "John Treasurer",
      "email": "treasurer@team.com"
    }
  },
  "authorizationDetails": {
    "requiresManualApproval": true,
    "authorizationType": "MANUAL_SIGNER_APPROVAL",
    "requiredApprovalsCount": 2,
    "minIndependentParentRepCount": 1,
    "reason": "Manual approval required: unknown vendor",
    "conditions": {
      "hasBudgetLineItem": true,
      "budgetApproved": true,
      "vendorKnown": false,
      "noTreasurerConflict": true
    }
  }
}
```

#### Error Responses

**401 Unauthorized:**

```json
{
  "error": "Unauthorized"
}
```

**400 Bad Request:**

```json
{
  "error": "amountCents is required"
}
```

**403 Forbidden:**

```json
{
  "error": "User not found or does not belong to this team"
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal server error",
  "details": "Error message"
}
```

---

### 2. Approve SpendIntent

**Endpoint:** `POST /api/spend-intents/[spendIntentId]/approve`

**Description:** Approves a spend intent. Requires signing authority. Creates an approval record and checks if authorization threshold is met.

**Authentication:** Required (Clerk JWT)

**Authorization:** User must be a signing authority on the team

#### Request Body

```json
{
  "note": "string (optional)"
}
```

**Field Descriptions:**

- `note`: Optional comment/note about the approval

#### Response (Success - Approval Added, Not Yet Authorized)

**Status:** 200 OK

```json
{
  "spendIntent": {
    "id": "clx123abc789",
    "teamId": "team_abc123",
    "createdByUserId": "user_xyz789",
    "amountCents": 15000,
    "currency": "CAD",
    "vendorName": "New Vendor Inc",
    "paymentMethod": "E_TRANSFER",
    "authorizationType": "MANUAL_SIGNER_APPROVAL",
    "requiresManualApproval": true,
    "status": "AUTHORIZATION_PENDING",
    "authorizedAt": null,
    "createdAt": "2025-01-01T19:30:00.000Z",
    "updatedAt": "2025-01-01T19:31:00.000Z",
    "approvals": [
      {
        "id": "approval_123",
        "spendIntentId": "clx123abc789",
        "approverUserId": "user_signer1",
        "isIndependentParentRep": false,
        "note": "Looks good to me",
        "approvedAt": "2025-01-01T19:31:00.000Z",
        "approver": {
          "id": "user_signer1",
          "name": "Sarah President",
          "email": "president@team.com"
        }
      }
    ],
    "team": {
      "id": "team_abc123",
      "name": "U13 AA Storm"
    },
    "creator": {
      "id": "user_xyz789",
      "name": "John Treasurer",
      "email": "treasurer@team.com"
    }
  },
  "approval": {
    "id": "approval_123",
    "spendIntentId": "clx123abc789",
    "approverUserId": "user_signer1",
    "isIndependentParentRep": false,
    "note": "Looks good to me",
    "approvedAt": "2025-01-01T19:31:00.000Z",
    "createdAt": "2025-01-01T19:31:00.000Z",
    "approver": {
      "id": "user_signer1",
      "name": "Sarah President",
      "email": "president@team.com"
    }
  },
  "approvalSummary": {
    "approvalsCount": 1,
    "independentParentRepApprovalsCount": 0,
    "requiredApprovalsCount": 2,
    "requiredIndependentParentRepCount": 1,
    "missing": {
      "approvalsRemaining": 1,
      "independentParentRepRemaining": 1
    },
    "isAuthorized": false
  }
}
```

#### Response (Success - Authorized After Approval)

**Status:** 200 OK

```json
{
  "spendIntent": {
    "id": "clx123abc789",
    "status": "AUTHORIZED",
    "authorizedAt": "2025-01-01T19:32:00.000Z",
    "approvals": [
      {
        "id": "approval_123",
        "approver": {
          "id": "user_signer1",
          "name": "Sarah President"
        },
        "isIndependentParentRep": false,
        "approvedAt": "2025-01-01T19:31:00.000Z"
      },
      {
        "id": "approval_456",
        "approver": {
          "id": "user_signer2",
          "name": "Mike Board Member"
        },
        "isIndependentParentRep": true,
        "approvedAt": "2025-01-01T19:32:00.000Z"
      }
    ]
  },
  "approval": {
    "id": "approval_456",
    "approver": {
      "id": "user_signer2",
      "name": "Mike Board Member",
      "email": "boardmember@team.com"
    }
  },
  "approvalSummary": {
    "approvalsCount": 2,
    "independentParentRepApprovalsCount": 1,
    "requiredApprovalsCount": 2,
    "requiredIndependentParentRepCount": 1,
    "missing": {
      "approvalsRemaining": 0,
      "independentParentRepRemaining": 0
    },
    "isAuthorized": true
  }
}
```

#### Error Responses

**401 Unauthorized:**

```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden:**

```json
{
  "error": "Only signing authorities can approve spend intents"
}
```

**404 Not Found:**

```json
{
  "error": "Spend intent not found"
}
```

**400 Bad Request - Already Approved:**

```json
{
  "error": "You have already approved this spend intent"
}
```

**400 Bad Request - No Approval Required:**

```json
{
  "error": "This spend intent does not require manual approval"
}
```

---

### 3. Get Approval Summary

**Endpoint:** `GET /api/spend-intents/[spendIntentId]/approval-summary`

**Description:** Retrieves the approval summary for a spend intent, including current approvals, required counts, and missing requirements.

**Authentication:** Required (Clerk JWT)

**Authorization:** User must belong to the team

#### Response (Success)

**Status:** 200 OK

```json
{
  "spendIntent": {
    "id": "clx123abc789",
    "status": "AUTHORIZATION_PENDING",
    "authorizationType": "MANUAL_SIGNER_APPROVAL",
    "requiresManualApproval": true,
    "amountCents": 15000,
    "currency": "CAD",
    "paymentMethod": "E_TRANSFER",
    "authorizedAt": null,
    "createdAt": "2025-01-01T19:30:00.000Z",
    "team": {
      "id": "team_abc123",
      "name": "U13 AA Storm"
    },
    "creator": {
      "id": "user_xyz789",
      "name": "John Treasurer",
      "email": "treasurer@team.com"
    }
  },
  "approvalSummary": {
    "approvalsCount": 1,
    "independentParentRepApprovalsCount": 0,
    "requiredApprovalsCount": 2,
    "requiredIndependentParentRepCount": 1,
    "missing": {
      "approvalsRemaining": 1,
      "independentParentRepRemaining": 1
    },
    "isAuthorized": false
  },
  "approvals": [
    {
      "id": "approval_123",
      "approver": {
        "id": "user_signer1",
        "name": "Sarah President",
        "email": "president@team.com",
        "role": "PRESIDENT",
        "userType": null
      },
      "isIndependentParentRep": false,
      "note": "Approved",
      "approvedAt": "2025-01-01T19:31:00.000Z"
    }
  ]
}
```

#### Error Responses

**401 Unauthorized:**

```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden:**

```json
{
  "error": "User not found or does not belong to this team"
}
```

**404 Not Found:**

```json
{
  "error": "Spend intent not found"
}
```

---

## Example Workflows

### Workflow 1: Standing Authorization (No Manual Approval)

```bash
# Create spend intent with all conditions met
POST /api/spend-intents
{
  "teamId": "team_123",
  "amountCents": 25000,
  "paymentMethod": "E_TRANSFER",
  "vendorId": "vendor_known",
  "budgetLineItemId": "envelope_approved"
}

# Response: status = "AUTHORIZED", no approvals needed
{
  "spendIntent": {
    "status": "AUTHORIZED",
    "authorizationType": "STANDING_BUDGET_AUTHORIZATION",
    "requiresManualApproval": false
  }
}
```

### Workflow 2: Manual Approval Required

```bash
# Step 1: Create spend intent (unknown vendor)
POST /api/spend-intents
{
  "teamId": "team_123",
  "amountCents": 15000,
  "paymentMethod": "E_TRANSFER",
  "vendorName": "New Vendor Inc",
  "budgetLineItemId": "envelope_approved"
}

# Response: status = "AUTHORIZATION_PENDING"
{
  "spendIntent": {
    "status": "AUTHORIZATION_PENDING",
    "requiresManualApproval": true
  },
  "authorizationDetails": {
    "requiredApprovalsCount": 2,
    "minIndependentParentRepCount": 1
  }
}

# Step 2: First approval (president)
POST /api/spend-intents/clx123abc789/approve
{
  "note": "Looks good"
}

# Response: Still pending (need 1 more approval + 1 independent parent rep)
{
  "approvalSummary": {
    "approvalsCount": 1,
    "independentParentRepApprovalsCount": 0,
    "missing": {
      "approvalsRemaining": 1,
      "independentParentRepRemaining": 1
    },
    "isAuthorized": false
  }
}

# Step 3: Second approval (parent board member)
POST /api/spend-intents/clx123abc789/approve
{
  "note": "Approved"
}

# Response: AUTHORIZED
{
  "spendIntent": {
    "status": "AUTHORIZED",
    "authorizedAt": "2025-01-01T19:32:00.000Z"
  },
  "approvalSummary": {
    "approvalsCount": 2,
    "independentParentRepApprovalsCount": 1,
    "isAuthorized": true
  }
}

# Step 4: Check approval summary
GET /api/spend-intents/clx123abc789/approval-summary

# Response: Full summary with all approvals
```

---

## Authorization Logic

The authorization engine evaluates the following conditions:

### Standing Budget Authorization (All 4 Must Be True)

1. ✅ **Budget Line Item Present**: `budgetLineItemId` is not null/empty
2. ✅ **Budget Approved**: Budget status is `APPROVED`
3. ✅ **Known Vendor**: `vendorId` is provided (not `vendorName`)
4. ✅ **No Treasurer Conflict**: Treasurer is NOT the payee

### Manual Signer Approval Required

If **ANY** of the above conditions fails, manual approval is required:

- **Required Approvals**: 2
- **Required Independent Parent Reps**: 1

### Independent Parent Representative

A user is considered an independent parent representative if:

- `userType === 'PARENT'`, OR
- `role === 'PARENT'`, OR
- `role === 'BOARD_MEMBER'`

---

## Database Schema

### SpendIntent Table

```sql
CREATE TABLE spend_intents (
  id                      TEXT PRIMARY KEY,
  team_id                 TEXT NOT NULL,
  created_by_user_id      TEXT NOT NULL,
  amount_cents            INTEGER NOT NULL,
  currency                VARCHAR(3) DEFAULT 'CAD',
  vendor_id               TEXT,
  vendor_name             VARCHAR(255),
  budget_line_item_id     TEXT,
  payment_method          TEXT NOT NULL, -- CASH | CHEQUE | E_TRANSFER
  authorization_type      TEXT NOT NULL, -- STANDING_BUDGET_AUTHORIZATION | MANUAL_SIGNER_APPROVAL
  requires_manual_approval BOOLEAN DEFAULT false,
  status                  TEXT DEFAULT 'PROPOSED', -- PROPOSED | AUTHORIZATION_PENDING | AUTHORIZED | ...
  authorized_at           TIMESTAMP,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);
```

### SpendIntentApproval Table

```sql
CREATE TABLE spend_intent_approvals (
  id                       TEXT PRIMARY KEY,
  spend_intent_id          TEXT NOT NULL,
  approver_user_id         TEXT NOT NULL,
  is_independent_parent_rep BOOLEAN NOT NULL,
  note                     TEXT,
  approved_at              TIMESTAMP DEFAULT NOW(),
  created_at               TIMESTAMP DEFAULT NOW(),

  UNIQUE (spend_intent_id, approver_user_id)
);
```

---

## Testing

Integration tests are available in `app/api/spend-intents/spend-intents.test.ts`.

Test coverage includes:

- Standing authorization scenarios
- Manual approval requirements
- Approval workflow (partial and full authorization)
- Duplicate approval prevention
- Signing authority verification
- Approval summary calculations

---

## Notes

- All amounts are in **cents** (e.g., 25000 = $250.00)
- Timestamps are in **ISO 8601 format**
- The authorization rules engine is stateless and can be called independently
- Approvals are **immutable** once created
- A user can only approve a spend intent **once**
- Spend intents transition from `AUTHORIZATION_PENDING` → `AUTHORIZED` when threshold is met
