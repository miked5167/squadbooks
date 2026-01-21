import { prisma } from '../lib/prisma'

async function addAssistantTreasurer() {
  try {
    // Get Clerk ID from command line argument
    const clerkId = process.argv[2]
    const email = process.argv[3]
    const name = process.argv[4] || 'Assistant Treasurer'

    if (!clerkId || !email) {
      console.log('❌ Missing required arguments')
      console.log('\nUsage:')
      console.log('  npx tsx scripts/add-assistant-treasurer.ts <clerkId> <email> [name]')
      console.log('\nExample:')
      console.log('  npx tsx scripts/add-assistant-treasurer.ts user_2abc123xyz assistant@example.com "John Smith"')
      console.log('\nHow to get your Clerk ID:')
      console.log('  1. Sign up with a new email at http://localhost:3000/sign-up')
      console.log('  2. After signing in, go to http://localhost:3000/api/debug/clerk-id')
      console.log('  3. Copy the user ID shown')
      process.exit(1)
    }

    console.log('🔍 Looking for your team...\n')

    // Find Mike's team (the user running this is Mike)
    const mike = await prisma.user.findUnique({
      where: { email: 'miked5167@gmail.com' },
      include: { team: true }
    })

    if (!mike) {
      console.log('❌ Could not find Mike\'s account. Are you using the correct database?')
      process.exit(1)
    }

    console.log(`✅ Found team: ${mike.team.name}`)
    console.log(`   Team ID: ${mike.teamId}\n`)

    // Check if a user with this Clerk ID already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (existingUser) {
      console.log('⚠️  A user with this Clerk ID already exists:')
      console.log(`   Name: ${existingUser.name}`)
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   Role: ${existingUser.role}`)
      console.log(`   Team: ${existingUser.teamId}\n`)

      // Update their role to ASSISTANT_TREASURER if needed
      if (existingUser.role !== 'ASSISTANT_TREASURER') {
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'ASSISTANT_TREASURER',
            teamId: mike.teamId, // Move to Mike's team if different
          }
        })
        console.log('✅ Updated user role to ASSISTANT_TREASURER')
        console.log(`   User is now on team: ${mike.team.name}`)
      } else {
        console.log('✅ User already has ASSISTANT_TREASURER role')
      }

      process.exit(0)
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingEmail) {
      console.log('❌ A user with this email already exists:')
      console.log(`   Name: ${existingEmail.name}`)
      console.log(`   Role: ${existingEmail.role}`)
      console.log(`   Clerk ID: ${existingEmail.clerkId}\n`)
      console.log('💡 Use a different email or update the existing user\'s Clerk ID')
      process.exit(1)
    }

    // Create the new Assistant Treasurer
    console.log('🔨 Creating Assistant Treasurer...\n')

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        role: 'ASSISTANT_TREASURER',
        teamId: mike.teamId,
      }
    })

    console.log('✅ Successfully created Assistant Treasurer!')
    console.log(`   Name: ${newUser.name}`)
    console.log(`   Email: ${newUser.email}`)
    console.log(`   Role: ${newUser.role}`)
    console.log(`   Team: ${mike.team.name}`)
    console.log(`   Clerk ID: ${newUser.clerkId}\n`)

    console.log('🎉 You can now test the approval workflow!')
    console.log('\n📋 Next steps:')
    console.log('   1. Sign out from your current account')
    console.log(`   2. Sign in with: ${email}`)
    console.log('   3. As Mike (Treasurer), create an expense over $200')
    console.log('   4. As Assistant Treasurer, go to /approvals to review it\n')

  } catch (error) {
    console.error('❌ Error creating Assistant Treasurer:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addAssistantTreasurer()
