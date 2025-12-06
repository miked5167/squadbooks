import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST() {
  try {
    logger.info('Setting up storage bucket as public')

    // Update the receipts bucket to be public
    const { data, error } = await supabase.storage.updateBucket('receipts', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
      ],
    })

    if (error) {
      logger.error('Error updating storage bucket', new Error(error.message), { bucket: 'receipts' })
      return NextResponse.json(
        { error: 'Failed to update bucket', details: error.message },
        { status: 500 }
      )
    }

    logger.info('Storage bucket updated successfully', { bucket: 'receipts', public: true })

    return NextResponse.json({
      success: true,
      message: 'Storage bucket configured successfully',
      bucket: 'receipts',
      configuration: {
        public: true,
        fileSizeLimit: '5MB',
        allowedMimeTypes: ['JPEG', 'JPG', 'PNG', 'WebP', 'PDF'],
      },
      note: 'Public bucket - anyone with the link can access files. For MVP testing only.',
    })
  } catch (error: any) {
    logger.error('Storage setup error', error as Error)
    return NextResponse.json(
      { error: 'Setup failed', details: error.message },
      { status: 500 }
    )
  }
}
