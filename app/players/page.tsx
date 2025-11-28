import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserPlus, Mail } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { FamilyCard } from './FamilyCard'
import { PlayersTab } from './PlayersTab'

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
          families: true,
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

  return (
    <div className="min-h-screen bg-cream">
      <AppSidebar />

      <main className="ml-64 px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-display-2 text-navy mb-2">Roster</h1>
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-card">
                <CardHeader className="pb-2">
                  <CardDescription className="text-navy/60">Total Families</CardDescription>
                  <CardTitle className="text-3xl text-navy">{families.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4 text-navy" />
                    <span className="text-navy/70">Registered families</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-card">
                <CardHeader className="pb-2">
                  <CardDescription className="text-navy/60">Team</CardDescription>
                  <CardTitle className="text-xl text-navy">{user.team.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-navy/70">{user.team.season}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-card">
                <CardHeader className="pb-2">
                  <CardDescription className="text-navy/60">Communication</CardDescription>
                  <CardTitle className="text-xl text-navy">Email List</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="border-navy/20 text-navy hover:bg-navy/5"
                    size="sm"
                  >
                    <Mail className="mr-2 w-4 h-4" />
                    Export Contacts
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Families List */}
            <Card className="border-0 shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-navy">Family Directory</CardTitle>
                  <CardDescription>Contact information for all registered families</CardDescription>
                </div>
                <Button className="bg-meadow hover:bg-meadow/90 text-white">
                  <UserPlus className="mr-2 w-4 h-4" />
                  Add Family
                </Button>
              </CardHeader>
              <CardContent>
                {families.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-navy/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-navy mb-2">No families added yet</h3>
                    <p className="text-navy/60 mb-6 max-w-sm mx-auto">
                      Use 'Add Family' to register parent contacts
                    </p>
                    <Button className="bg-meadow hover:bg-meadow/90 text-white">
                      <UserPlus className="mr-2 w-4 h-4" />
                      Add First Family
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {families.map((family) => (
                      <FamilyCard key={family.id} family={family} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
