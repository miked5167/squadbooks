import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// The Clerk ID from your server logs
const CLERK_USER_ID = 'user_35mxqUEnd8SXJxf6VCvRJW0zMTi'

async function main() {
  try {
    console.log('🔍 Checking for user with Clerk ID:', CLERK_USER_ID)

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: {
        clerkId: CLERK_USER_ID,
      },
    })

    if (user) {
      console.log('✅ User already exists:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Team ID: ${user.teamId || 'None'}`)
    } else {
      console.log('❌ User not found in database')
      console.log('Creating user...')

      // Create the user
      user = await prisma.user.create({
        data: {
          clerkId: CLERK_USER_ID,
          email: 'miked5167@gmail.com',
          name: 'Mike',
          role: 'TREASURER',
        },
      })

      console.log('✅ User created successfully:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Clerk ID: ${user.clerkId}`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
