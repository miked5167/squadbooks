-- Storage RLS Policies for Receipts Bucket
-- Run this in Supabase SQL Editor after creating the 'receipts' bucket

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for rerunning this script)
DROP POLICY IF EXISTS "Users can view team receipts" ON storage.objects;
DROP POLICY IF EXISTS "Treasurers can upload team receipts" ON storage.objects;
DROP POLICY IF EXISTS "Treasurers can update team receipts" ON storage.objects;
DROP POLICY IF EXISTS "Treasurers can delete team receipts" ON storage.objects;

-- Policy 1: Users can view receipts from their own team
-- File path format: {teamId}/{filename}
CREATE POLICY "Users can view team receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM public."User"
    WHERE clerk_id = auth.uid()::text
  )
);

-- Policy 2: Treasurers can upload receipts for their team
CREATE POLICY "Treasurers can upload team receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM public."User"
    WHERE clerk_id = auth.uid()::text
    AND role = 'TREASURER'
  )
);

-- Policy 3: Treasurers can update receipts for their team
CREATE POLICY "Treasurers can update team receipts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM public."User"
    WHERE clerk_id = auth.uid()::text
    AND role = 'TREASURER'
  )
);

-- Policy 4: Treasurers can delete receipts for their team
CREATE POLICY "Treasurers can delete team receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM public."User"
    WHERE clerk_id = auth.uid()::text
    AND role = 'TREASURER'
  )
);

-- Grant usage on storage schema to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
