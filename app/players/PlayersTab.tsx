'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'
import { AddPlayerDialog } from './AddPlayerDialog'

interface Player {
  id: string
  firstName: string
  lastName: string
  jerseyNumber: string | null
  position: string | null
  status: string
  family: {
    familyName: string
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
                      <td className="py-3 px-4 text-right">
                        {isTreasurer && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-navy/20 text-navy hover:bg-navy/5"
                          >
                            Edit
                          </Button>
                        )}
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
