/**
 * Setup Storage Policies Script
 * Run this with: npx tsx scripts/setup-storage-policies.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStoragePolicies() {
  console.log('🚀 Setting up storage policies for receipts bucket...\n')

  const policies = [
    {
      name: 'Allow authenticated SELECT',
      operation: 'SELECT',
      sql: `
        CREATE POLICY "Allow authenticated SELECT on receipts"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'receipts');
      `
    },
    {
      name: 'Allow authenticated INSERT',
      operation: 'INSERT',
      sql: `
        CREATE POLICY "Allow authenticated INSERT on receipts"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'receipts');
      `
    },
    {
      name: 'Allow authenticated UPDATE',
      operation: 'UPDATE',
      sql: `
        CREATE POLICY "Allow authenticated UPDATE on receipts"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'receipts');
      `
    },
    {
      name: 'Allow authenticated DELETE',
      operation: 'DELETE',
      sql: `
        CREATE POLICY "Allow authenticated DELETE on receipts"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'receipts');
      `
    }
  ]

  // First, enable RLS on storage.objects
  console.log('📋 Enabling RLS on storage.objects...')
  try {
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    })
    console.log('✅ RLS enabled\n')
  } catch (error: any) {
    if (error.message?.includes('already enabled')) {
      console.log('✅ RLS already enabled\n')
    } else {
      console.log('⚠️  Could not enable RLS (might need manual setup)\n')
    }
  }

  // Create each policy
  for (const policy of policies) {
    console.log(`📝 Creating policy: ${policy.name}...`)
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: policy.sql })

      if (error) {
        if (error.message?.includes('already exists')) {
          console.log(`   ✅ Policy already exists - ${policy.operation}`)
        } else {
          console.log(`   ❌ Error: ${error.message}`)
        }
      } else {
        console.log(`   ✅ Created ${policy.operation} policy`)
      }
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}`)
    }
  }

  console.log('\n🎉 Storage policy setup complete!')
  console.log('\n📝 Summary:')
  console.log('   - Bucket: receipts')
  console.log('   - Access: Authenticated users only')
  console.log('   - Operations: SELECT, INSERT, UPDATE, DELETE')
  console.log('\n✅ Receipt uploads should now work!')
}

setupStoragePolicies().catch(console.error)
