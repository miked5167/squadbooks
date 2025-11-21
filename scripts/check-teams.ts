import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTeams() {
  const teams = await prisma.team.findMany()
  console.log('Teams:', teams.map(t => ({ name: t.name, id: t.id })))
  await prisma.$disconnect()
}

checkTeams()
