import { prisma } from '../lib/prisma'

async function check() {
  const cols = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'transactions'
    ORDER BY ordinal_position
  `
  console.table(cols)
  await prisma.$disconnect()
}

check()
