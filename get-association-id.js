const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAssociationId() {
  const team = await prisma.team.findUnique({
    where: { id: 'cminhmzhi000gtgpcgvw5ogk9' },
    include: {
      associationTeam: {
        include: {
          association: true
        }
      }
    }
  });

  if (team?.associationTeam?.association) {
    console.log('Association ID:', team.associationTeam.association.id);
    console.log('Association Name:', team.associationTeam.association.name);
  } else {
    console.log('No association found for this team');

    // Try to find any association
    const anyAssociation = await prisma.association.findFirst();
    if (anyAssociation) {
      console.log('Found association:', anyAssociation.id, anyAssociation.name);
    }
  }

  await prisma.$disconnect();
}

getAssociationId().catch(console.error);
