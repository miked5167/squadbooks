const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findFirst({
  where: { name: 'Abigail Thompson' },
  select: { role: true, teamId: true }
})
.then(u => {
  console.log('Abigail role:', u?.role);
  console.log('Team ID:', u?.teamId);
})
.finally(() => prisma.$disconnect());
