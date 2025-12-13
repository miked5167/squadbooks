require('dotenv').config({path: '.env.local'});
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

prisma.association.findMany({
  select: {
    name: true,
    id: true,
    createdAt: true
  },
  orderBy: {
    createdAt: 'desc'
  }
}).then(associations => {
  console.log('\n=== Existing Associations ===\n');
  associations.forEach((a, i) => {
    console.log(`${i+1}. ${a.name}`);
    console.log(`   ID: ${a.id}`);
    console.log(`   Created: ${a.createdAt}`);
    console.log('');
  });
  console.log(`Total: ${associations.length} associations\n`);
}).finally(() => prisma.$disconnect());
