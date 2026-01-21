const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.update({
  where: { email: 'u13-aa-storm.treasurer@demo.huddlebooks.app' },
  data: { role: 'PRESIDENT' }
})
.then(u => {
  console.log('Updated Abigail to PRESIDENT');
  console.log('New role:', u.role);
})
.finally(() => prisma.$disconnect());
