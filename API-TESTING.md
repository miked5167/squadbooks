# API Testing Guide

This document provides examples for testing the Squadbooks API endpoints.

## Prerequisites

1. Start the development server:
```bash
npm run dev
```

2. Ensure you have:
   - A user authenticated via Clerk (get session token from browser DevTools)
   - User has TREASURER role in the database
   - At least one category created for the team

## Authentication

All endpoints require authentication. Include the Clerk session token in requests:

```bash
# Get session token from browser:
# 1. Open DevTools (F12)
# 2. Go to Application > Cookies
# 3. Find __session cookie value
```

## Transaction Endpoints

### 1. Create Transaction (POST /api/transactions)

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -d '{
    "type": "EXPENSE",
    "amount": 150.50,
    "categoryId": "YOUR_CATEGORY_ID",
    "vendor": "Hockey Equipment Store",
    "description": "New practice jerseys",
    "transactionDate": "2025-01-15",
    "receiptUrl": "https://example.com/receipt.pdf"
  }'
```

**Expected Response** (201 Created):
```json
{
  "transaction": {
    "id": "clx...",
    "type": "EXPENSE",
    "status": "APPROVED",
    "amount": "150.50",
    "vendor": "Hockey Equipment Store",
    ...
  },
  "approvalRequired": false,
  "message": "Transaction created successfully."
}
```

**Test Case: High-value transaction requiring approval:**
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -d '{
    "type": "EXPENSE",
    "amount": 500.00,
    "categoryId": "YOUR_CATEGORY_ID",
    "vendor": "Tournament Registration",
    "transactionDate": "2025-01-15"
  }'
```

**Expected Response** (201 Created):
```json
{
  "transaction": { ... },
  "approvalRequired": true,
  "message": "Transaction created. Approval required from president."
}
```

### 2. List Transactions (GET /api/transactions)

```bash
# Get all transactions
curl http://localhost:3000/api/transactions \
  -H "Cookie: __session=YOUR_SESSION_TOKEN"

# With filters
curl "http://localhost:3000/api/transactions?type=EXPENSE&status=APPROVED&page=1&perPage=20" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN"

# Filter by date range
curl "http://localhost:3000/api/transactions?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN"

# Sort by amount descending
curl "http://localhost:3000/api/transactions?sortBy=amount&sortOrder=desc" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "transactions": [
    {
      "id": "clx...",
      "type": "EXPENSE",
      "status": "APPROVED",
      "amount": "150.50",
      "vendor": "Hockey Equipment Store",
      "category": {
        "name": "Equipment",
        "heading": "Equipment"
      },
      "creator": {
        "name": "John Doe",
        "role": "TREASURER"
      },
      "approvals": []
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 50,
    "total": 15,
    "totalPages": 1
  }
}
```

### 3. Get Single Transaction (GET /api/transactions/:id)

```bash
curl http://localhost:3000/api/transactions/YOUR_TRANSACTION_ID \
  -H "Cookie: __session=YOUR_SESSION_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "id": "clx...",
  "type": "EXPENSE",
  "status": "APPROVED",
  "amount": "150.50",
  "vendor": "Hockey Equipment Store",
  "description": "New practice jerseys",
  "transactionDate": "2025-01-15T00:00:00.000Z",
  "receiptUrl": "https://...",
  "receiptPath": "team123/trans456_1234567890.pdf",
  "category": { ... },
  "creator": { ... },
  "approvals": [],
  "budgetRemaining": "1849.50"
}
```

### 4. Update Transaction (PUT /api/transactions/:id)

```bash
curl -X PUT http://localhost:3000/api/transactions/YOUR_TRANSACTION_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -d '{
    "amount": 175.00,
    "description": "New practice jerseys - updated quantity"
  }'
```

**Expected Response** (200 OK):
```json
{
  "transaction": { ... },
  "message": "Transaction updated successfully"
}
```

**Error Cases:**
- 403 if transaction is APPROVED or REJECTED
- 404 if transaction not found
- 403 if user is not TREASURER

### 5. Delete Transaction (DELETE /api/transactions/:id)

```bash
curl -X DELETE http://localhost:3000/api/transactions/YOUR_TRANSACTION_ID \
  -H "Cookie: __session=YOUR_SESSION_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "message": "Transaction deleted successfully"
}
```

**Error Cases:**
- 403 if transaction status is not DRAFT
- 404 if transaction not found

## Receipt Endpoints

### 1. Upload Receipt (POST /api/receipts/upload)

**Upload standalone receipt:**
```bash
curl -X POST http://localhost:3000/api/receipts/upload \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -F "file=@/path/to/receipt.pdf"
```

**Upload and attach to transaction:**
```bash
curl -X POST http://localhost:3000/api/receipts/upload \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -F "file=@/path/to/receipt.pdf" \
  -F "transactionId=YOUR_TRANSACTION_ID"
```

**Expected Response** (200 OK):
```json
{
  "message": "Receipt uploaded and attached to transaction",
  "url": "https://...supabase.co/storage/v1/object/public/receipts/...",
  "path": "team123/trans456_1234567890.pdf",
  "transactionId": "clx..."
}
```

**Validation Tests:**
- File too large (>5MB): Returns 400 error
- Invalid MIME type (e.g., .txt): Returns 400 error
- Missing file: Returns 400 error
- Non-TREASURER user: Returns 403 error

### 2. Delete Receipt (DELETE /api/receipts/delete)

**Delete by path:**
```bash
curl -X DELETE http://localhost:3000/api/receipts/delete \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -d '{
    "path": "team123/trans456_1234567890.pdf"
  }'
```

**Delete by transaction ID:**
```bash
curl -X DELETE http://localhost:3000/api/receipts/delete \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -d '{
    "transactionId": "YOUR_TRANSACTION_ID"
  }'
```

**Expected Response** (200 OK):
```json
{
  "message": "Receipt deleted successfully",
  "path": "team123/trans456_1234567890.pdf"
}
```

## Admin Endpoints

### Setup Storage Bucket (POST /api/admin/setup-storage)

```bash
curl -X POST http://localhost:3000/api/admin/setup-storage
```

**Expected Response** (201 Created):
```json
{
  "message": "Storage bucket created successfully",
  "bucket": { ... },
  "note": "RLS policies should be configured in Supabase dashboard or via SQL"
}
```

## Common Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Only treasurers can create transactions"
}
```

### 404 Not Found
```json
{
  "error": "Transaction not found"
}
```

### 400 Bad Request
```json
{
  "error": "Amount must be positive"
}
```

## Testing Checklist

### Transaction Flow
- [ ] Create INCOME transaction (auto-approved)
- [ ] Create EXPENSE < $200 (auto-approved)
- [ ] Create EXPENSE > $200 (requires approval)
- [ ] Update DRAFT transaction
- [ ] Update PENDING transaction
- [ ] Attempt to update APPROVED transaction (should fail)
- [ ] Delete DRAFT transaction
- [ ] Attempt to delete APPROVED transaction (should fail)
- [ ] List transactions with filters
- [ ] Get single transaction with budget info

### Receipt Flow
- [ ] Upload standalone receipt
- [ ] Upload receipt attached to transaction
- [ ] Upload invalid file type (should fail)
- [ ] Upload file > 5MB (should fail)
- [ ] Delete receipt by path
- [ ] Delete receipt by transaction ID
- [ ] Verify receipt auto-deleted when transaction deleted

### Authorization
- [ ] All endpoints reject unauthenticated requests
- [ ] Non-TREASURER cannot create/update/delete transactions
- [ ] Non-TREASURER cannot upload/delete receipts
- [ ] Users can only access their team's data

### Data Validation
- [ ] Amount must be positive
- [ ] Amount cannot exceed $100,000
- [ ] Transaction date cannot be in future
- [ ] Category must belong to team
- [ ] Required fields validation

## Notes

- Replace `YOUR_SESSION_TOKEN` with actual Clerk session token
- Replace `YOUR_CATEGORY_ID` and `YOUR_TRANSACTION_ID` with actual IDs from your database
- For browser testing, you can use the Network tab in DevTools to see actual requests
- Consider using tools like Postman or Thunder Client for easier API testing
