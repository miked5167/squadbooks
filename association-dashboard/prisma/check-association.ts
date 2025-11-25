/**
 * Check Association Data
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🔍 Checking association data...\n')

  const clerkUserId = process.env.SEED_CLERK_USER_ID || 'user_35mxqUEnd8SXJxf6VCvRJW0zMTi'
  console.log(`Checking for Clerk user: ${clerkUserId}\n`)

  // Check all associations
  const { data: associations, error: assocError } = await supabase
    .from('associations')
    .select('*')

  if (assocError) {
    console.error('Error fetching associations:', assocError)
  } else {
    console.log('📊 Associations in database:')
    associations?.forEach(a => {
      console.log(`  - ID: ${a.id}`)
      console.log(`    Name: ${a.name}`)
      console.log(`    Abbreviation: ${a.abbreviation}`)
      console.log('')
    })
  }

  // Check association_users for this Clerk user
  const { data: associationUsers, error: userError } = await supabase
    .from('association_users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)

  if (userError) {
    console.error('Error fetching association users:', userError)
  } else {
    console.log('👤 Association users for this Clerk ID:')
    if (associationUsers && associationUsers.length > 0) {
      associationUsers.forEach(au => {
        console.log(`  - Association ID: ${au.association_id}`)
        console.log(`    Name: ${au.name}`)
        console.log(`    Email: ${au.email}`)
        console.log(`    Role: ${au.role}`)
        console.log('')
      })
    } else {
      console.log('  ❌ No association users found for this Clerk ID!')
    }
  }

  // Check if specific association ID exists
  const targetAssociationId = '39c54b59-b5cc-406a-85cb-baec193db2cb'
  const { data: specificAssoc, error: specificError } = await supabase
    .from('associations')
    .select('*')
    .eq('id', targetAssociationId)
    .single()

  console.log(`🎯 Checking specific association ID: ${targetAssociationId}`)
  if (specificError) {
    console.log('  ❌ NOT FOUND')
  } else if (specificAssoc) {
    console.log(`  ✅ FOUND: ${specificAssoc.name}`)
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
