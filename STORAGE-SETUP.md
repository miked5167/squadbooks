# Storage Setup Guide

This guide explains how to set up Supabase Storage for receipt uploads.

## Option 1: Automated Setup (Recommended)

Run the setup API endpoint once:

```bash
curl -X POST http://localhost:3000/api/admin/setup-storage
```

This will create the `receipts` bucket with the correct configuration.

## Option 2: Manual Setup via Supabase Dashboard

### Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **Create a new bucket**
5. Configure the bucket:
   - **Name**: `receipts`
   - **Public**: Unchecked (private bucket)
   - **File size limit**: 5 MB
   - **Allowed MIME types**:
     - image/jpeg
     - image/jpg
     - image/png
     - image/webp
     - application/pdf
6. Click **Create bucket**

### Step 2: Set Up RLS Policies

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase/storage-policies.sql`
4. Paste into the SQL editor
5. Click **Run** to execute

The policies enforce:
- ✅ All team members can view their team's receipts
- ✅ Only TREASURER role can upload receipts
- ✅ Only TREASURER role can update receipts
- ✅ Only TREASURER role can delete receipts
- ✅ Files are organized by team: `receipts/{teamId}/{filename}`

## Verify Setup

After setup, verify the bucket exists:

```javascript
import { supabase } from '@/lib/storage'

const { data, error } = await supabase.storage.listBuckets()
console.log('Buckets:', data) // Should include 'receipts'
```

## Bucket Configuration

- **Bucket name**: `receipts`
- **Privacy**: Private (requires authentication)
- **File size limit**: 5 MB
- **Allowed types**: JPG, PNG, WebP, PDF
- **Path structure**: `{teamId}/{transactionId}_{timestamp}.{ext}`

## Troubleshooting

### Bucket already exists
If you see "Bucket already exists", the setup is complete. No action needed.

### Permission denied errors
Ensure RLS policies are created by running `supabase/storage-policies.sql`

### Upload failures
1. Check file size < 5MB
2. Verify MIME type is allowed
3. Confirm user has TREASURER role
4. Verify user's `clerkId` matches Clerk authentication
