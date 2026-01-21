import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { prisma } from '@/lib/prisma'
import { PlayersTab } from './PlayersTab'
import { FamiliesTab } from './FamiliesTab'

export default async function RosterPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch user and team data
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      team: {
        include: {
          families: {
            include: {
              players: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  jerseyNumber: true,
                  position: true,
                },
                orderBy: [
                  { lastName: 'asc' },
                  { firstName: 'asc' },
                ],
              },
            },
            orderBy: {
              familyName: 'asc',
            },
          },
          players: {
            include: {
              family: {
                select: {
                  id: true,
                  familyName: true,
                  primaryEmail: true,
                },
              },
            },
            orderBy: [
              { lastName: 'asc' },
              { firstName: 'asc' },
            ],
          },
        },
      },
    },
  })

  if (!user) {
    redirect('/onboarding')
  }

  const families = user.team.families || []
  const players = user.team.players || []

  // Check if user is treasurer (authorized to manage players)
  const isTreasurer = user.role === 'TREASURER' || user.role === 'ASSISTANT_TREASURER'

  // Check if user is staff (can manage families)
  const isStaff = user.role !== 'PARENT'

  // Find user's family (if they're a parent)
  const userFamily = families.find(
    (family) =>
      family.primaryEmail === user.email || family.secondaryEmail === user.email
  )

  return (
    <div className="min-h-screen bg-cream">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">Roster</h1>
          <p className="text-lg text-navy/70">Manage your team's players and family contacts</p>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="families">Families</TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-6">
            <PlayersTab
              players={players}
              families={families}
              teamName={user.team.name}
              teamSeason={user.team.season}
              teamLevel={user.team.level}
              teamType={user.team.teamType}
              isTreasurer={isTreasurer}
            />
          </TabsContent>

          {/* Families Tab */}
          <TabsContent value="families" className="space-y-6">
            <FamiliesTab
              families={families}
              teamName={user.team.name}
              teamSeason={user.team.season}
              isStaff={isStaff}
              userFamilyId={userFamily?.id}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
