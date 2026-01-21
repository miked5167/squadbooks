import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'receipts'

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Upload a receipt file to Supabase Storage
 */
export async function uploadReceipt(
  file: File,
  teamId: string,
  transactionId: string
): Promise<{ url: string; path: string }> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      'Invalid file type. Only JPG, PNG, WebP, and PDF files are allowed.'
    )
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit')
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const fileName = `${transactionId}_${timestamp}.${fileExt}`
  const filePath = `${teamId}/${fileName}`

  // Upload file
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return {
    url: publicUrlData.publicUrl,
    path: filePath,
  }
}

/**
 * Delete a receipt file from Supabase Storage
 */
export async function deleteReceipt(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path])

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Get a signed URL for a private receipt (valid for 1 hour)
 */
export async function getReceiptSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 3600) // 1 hour

  if (error) {
    console.error('Signed URL error:', error)
    throw new Error(`Failed to get signed URL: ${error.message}`)
  }

  return data.signedUrl
}
