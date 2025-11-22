# Apply Storage RLS Policies

The storage bucket "receipts" is already created, but RLS policies need to be applied manually.

## Steps to Apply Policies

### Via Supabase Dashboard (Recommended):

1. Open your Supabase project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire SQL from `supabase/storage-policies.sql`
5. Paste into the query editor
6. Click **Run** to execute

### What These Policies Do:

- **View policy**: Users can view receipts from their own team
- **Upload policy**: Treasurers can upload receipts for their team
- **Update policy**: Treasurers can update receipts for their team
- **Delete policy**: Treasurers can delete receipts for their team

All policies enforce team isolation - users can only access receipts for teams they belong to.

## Verification

After applying policies, test the receipt upload:

1. Navigate to http://localhost:3000/expenses/new
2. Fill out an expense form
3. Upload a receipt (JPG, PNG, or PDF under 5MB)
4. Submit the form
5. Verify the receipt appears in the transaction list

## Troubleshooting

If you get permission errors:
- Verify you're logged in with a user that has TREASURER role
- Check that the user belongs to a team
- Verify the bucket exists in Supabase Storage

## Alternative: Public Bucket (Not Recommended for Production)

For quick MVP testing only, you could make the bucket public:

```sql
-- TEMPORARY: Make bucket public for testing
UPDATE storage.buckets
SET public = true
WHERE id = 'receipts';
```

**Important**: This is NOT recommended for production as receipts may contain sensitive financial information.
