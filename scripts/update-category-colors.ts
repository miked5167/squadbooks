import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🎨 Updating Team Operations category colors...\n')

  // Update Team Operations categories from indigo (#6366F1) to cyan (#06B6D4)
  const result = await prisma.category.updateMany({
    where: {
      heading: 'Team Operations',
    },
    data: {
      color: '#06B6D4',
    },
  })

  console.log(`✅ Updated ${result.count} Team Operations categories to cyan (#06B6D4)`)
  console.log('   This provides better visual distinction from Travel & Tournaments (purple)\n')

  // Verify the update
  const updatedCategories = await prisma.category.findMany({
    where: {
      heading: 'Team Operations',
    },
    select: {
      name: true,
      color: true,
    },
  })

  console.log('📋 Updated categories:')
  updatedCategories.forEach((cat) => {
    console.log(`   - ${cat.name}: ${cat.color}`)
  })
  console.log()
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
