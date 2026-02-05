import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/admin/setup-storage
 * One-time setup endpoint to create storage bucket and RLS policies
 * Only run this once during initial setup
 */
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create the receipts bucket
    const { data: bucket, error: bucketError } = await supabaseAdmin.storage.createBucket(
      'receipts',
      {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
      }
    )

    if (bucketError) {
      // Bucket might already exist
      if (bucketError.message.includes('already exists')) {
        return NextResponse.json(
          {
            message: 'Storage bucket already exists',
            bucket: 'receipts',
          },
          { status: 200 }
        )
      }
      throw bucketError
    }

    // Note: RLS policies need to be created via SQL
    // Execute RLS policy setup
    const { error: policyError } = await supabaseAdmin.rpc('create_storage_policies')

    if (policyError && !policyError.message.includes('already exists')) {
      logger.warn('Policy creation warning:', policyError)
    }

    return NextResponse.json(
      {
        message: 'Storage bucket created successfully',
        bucket,
        note: 'RLS policies should be configured in Supabase dashboard or via SQL',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Storage setup error', error as Error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to setup storage' }, { status: 500 })
  }
}
