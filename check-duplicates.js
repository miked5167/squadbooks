require('dotenv').config({path: '.env.local'});
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

prisma.associationUser.groupBy({
  by: ['clerkUserId', 'associationId'],
  _count: true,
  having: {
    clerkUserId: {
      _count: {
        gt: 1
      }
    }
  }
}).then(duplicates => {
  console.log('\n=== Checking for Duplicate User-Association Pairs ===\n');
  if (duplicates.length > 0) {
    console.log('Found duplicates:');
    console.log(duplicates);
  } else {
    console.log('No duplicates found. Safe to proceed with schema update.');
  }
}).finally(() => prisma.$disconnect());
