'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, Mail, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { AddPlayerDialog } from './AddPlayerDialog'
import { useToast } from '@/hooks/use-toast'

interface Player {
  id: string
  firstName: string
  lastName: string
  jerseyNumber: string | null
  position: string | null
  status: string
  onboardingStatus: string
  familyId: string | null
  family: {
    id: string
    familyName: string
    primaryEmail: string
  } | null
}

interface Family {
  id: string
  familyName: string
}

interface PlayersTabProps {
  players: Player[]
  families: Family[]
  teamName: string
  teamSeason: string
  teamLevel: string | null
  teamType: string | null
  isTreasurer: boolean
}

export function PlayersTab({
  players,
  families,
  teamName,
  teamSeason,
  teamLevel,
  teamType,
  isTreasurer,
}: PlayersTabProps) {
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false)
  const [sendingInvite, setSendingInvite] = useState<string | null>(null)
  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INJURED':
        return 'bg-red-100 text-red-800'
      case 'AP':
        return 'bg-blue-100 text-blue-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AP':
        return 'AP (Affiliate)'
      default:
        return status.charAt(0) + status.slice(1).toLowerCase()
    }
  }

  const getOnboardingStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'INVITED':
        return 'bg-yellow-100 text-yellow-800'
      case 'NOT_INVITED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getOnboardingStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-3 h-3" />
      case 'INVITED':
        return <Clock className="w-3 h-3" />
      case 'NOT_INVITED':
        return <AlertCircle className="w-3 h-3" />
      default:
        return null
    }
  }

  const getOnboardingStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed'
      case 'INVITED':
        return 'Invited'
      case 'NOT_INVITED':
        return 'Not Invited'
      default:
        return status
    }
  }

  const handleSendInvite = async (player: Player) => {
    if (!player.familyId) {
      toast({
        title: 'Cannot Send Invite',
        description: 'This player must have a family record first. Please add family information.',
        variant: 'destructive',
      })
      return
    }

    if (!player.family?.primaryEmail) {
      toast({
        title: 'Cannot Send Invite',
        description: 'This family does not have a primary email address.',
        variant: 'destructive',
      })
      return
    }

    setSendingInvite(player.id)

    try {
      const response = await fetch('/api/parent-invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create invite')
      }

      toast({
        title: 'Invite Sent!',
        description: `Parent invitation sent to ${player.family.primaryEmail}`,
      })

      // Reload the page to update the status
      window.location.reload()
    } catch (error) {
      console.error('Error sending invite:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invite',
        variant: 'destructive',
      })
    } finally {
      setSendingInvite(null)
    }
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-navy/60">Total Players</CardDescription>
            <CardTitle className="text-3xl text-navy">{players.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm">
              <Users className="w-4 h-4 text-navy" />
              <span className="text-navy/70">Active roster</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-navy/60">Team</CardDescription>
            <CardTitle className="text-xl text-navy">{teamName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-navy/70">{teamSeason}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-navy/60">Division</CardDescription>
            <CardTitle className="text-xl text-navy">{teamLevel || 'Not Set'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-navy/70">
              {teamType ? teamType.replace('_', ' ') : 'Team Info'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Players List */}
      <Card className="border-0 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-navy">Team Players</CardTitle>
            <CardDescription>Complete roster with player details</CardDescription>
          </div>
          {isTreasurer && (
            <Button
              className="bg-meadow hover:bg-meadow/90 text-white"
              onClick={() => setIsAddPlayerOpen(true)}
            >
              <Plus className="mr-2 w-4 h-4" />
              Add Player
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-navy/40" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">No players added yet</h3>
              <p className="text-navy/60 mb-6 max-w-sm mx-auto">
                Once your roster is set, players will appear here
              </p>
              {isTreasurer && (
                <Button
                  className="bg-meadow hover:bg-meadow/90 text-white"
                  onClick={() => setIsAddPlayerOpen(true)}
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Add First Player
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-navy">
                      Player Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-navy">
                      Jersey #
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-navy">
                      Position
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Family</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-navy">
                      Onboarding
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-navy">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-navy font-medium">
                        {player.firstName} {player.lastName}
                      </td>
                      <td className="py-3 px-4 text-navy/70">
                        {player.jerseyNumber ? `#${player.jerseyNumber}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-navy/70">{player.position || '—'}</td>
                      <td className="py-3 px-4 text-navy/70">
                        {player.family?.familyName || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(player.status)}`}
                        >
                          {getStatusLabel(player.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getOnboardingStatusColor(player.onboardingStatus)}`}
                        >
                          {getOnboardingStatusIcon(player.onboardingStatus)}
                          {getOnboardingStatusLabel(player.onboardingStatus)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isTreasurer && player.onboardingStatus === 'NOT_INVITED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={() => handleSendInvite(player)}
                              disabled={sendingInvite === player.id}
                            >
                              {sendingInvite === player.id ? (
                                <>Sending...</>
                              ) : (
                                <>
                                  <Mail className="mr-1 w-3 h-3" />
                                  Invite
                                </>
                              )}
                            </Button>
                          )}
                          {isTreasurer && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-navy/20 text-navy hover:bg-navy/5"
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddPlayerDialog
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
        families={families}
      />
    </>
  )
}
