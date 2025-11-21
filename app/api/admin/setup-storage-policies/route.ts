import { NextResponse } from 'next/server'
import { supabase } from '@/lib/storage'

/**
 * POST /api/admin/setup-storage-policies
 * Configure storage bucket policies to allow authenticated uploads
 */
export async function POST() {
  try {
    // For MVP: Disable RLS on the receipts bucket to allow all uploads
    // In production, you would create specific policies

    // Note: This requires the service role key which we don't have access to from the client
    // Instead, let's just verify the bucket is public and log instructions

    const { data: bucket, error: bucketError } = await supabase.storage.getBucket('receipts')

    if (bucketError) {
      return NextResponse.json(
        { error: 'Failed to get bucket info', details: bucketError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Storage bucket configuration checked',
      bucket: bucket,
      instructions: `
For MVP testing, you need to disable RLS on the receipts bucket in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Storage > Policies
3. For the 'receipts' bucket, click "Add Policy"
4. Choose "For full customization"
5. Name it: "Allow authenticated uploads"
6. Set Policy Command to: INSERT
7. Set Policy Definition to: true
8. Click "Review" then "Save policy"

Or run this SQL in the SQL Editor:

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');
      `,
    })
  } catch (error: any) {
    console.error('Setup storage policies error:', error)
    return NextResponse.json(
      { error: 'Setup failed', details: error.message },
      { status: 500 }
    )
  }
}
