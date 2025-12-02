import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  // Check for duplicate association names
  const duplicateAssociations = await prisma.$queryRaw`
    SELECT name, COUNT(*) as count
    FROM associations
    GROUP BY name
    HAVING COUNT(*) > 1
  `;

  console.log('Duplicate association names:', duplicateAssociations);

  // Check for duplicate association rules
  const duplicateRules = await prisma.$queryRaw`
    SELECT "associationId", name, COUNT(*) as count
    FROM association_rules
    GROUP BY "associationId", name
    HAVING COUNT(*) > 1
  `;

  console.log('Duplicate association rules:', duplicateRules);

  await prisma.$disconnect();
}

checkDuplicates();
