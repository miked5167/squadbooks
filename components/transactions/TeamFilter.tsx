'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface Team {
  id: string
  name: string
  division?: string | null
  season?: string | null
}

interface TeamFilterProps {
  className?: string
}

export function TeamFilter({ className }: TeamFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch accessible teams
  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch('/api/teams/accessible')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Teams fetch failed:', response.status, errorData)
          if (response.status === 401) {
            console.error('Authentication required - please log in')
          }
          throw new Error(errorData.error || 'Failed to fetch teams')
        }

        const data = await response.json()
        setTeams(data.teams || [])

        // If user has only one team, auto-select it
        if (data.teams?.length === 1) {
          setSelectedTeamIds([data.teams[0].id])
        } else if (data.teams?.length > 1) {
          // For association users, default to all teams
          setSelectedTeamIds(data.teams.map((t: Team) => t.id))
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [])

  // Update URL when selection changes
  useEffect(() => {
    if (loading) return

    const params = new URLSearchParams(searchParams.toString())

    if (selectedTeamIds.length > 0 && selectedTeamIds.length < teams.length) {
      // Only set teamIds param if not all teams are selected
      params.set('teamIds', selectedTeamIds.join(','))
    } else {
      // Remove param if all teams selected (default behavior)
      params.delete('teamIds')
    }

    // Reset cursor when filter changes
    params.delete('cursor')

    router.push(`?${params.toString()}`, { scroll: false })
  }, [selectedTeamIds, teams.length, loading])

  const handleToggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev => {
      if (prev.includes(teamId)) {
        // Don't allow deselecting all teams
        if (prev.length === 1) return prev
        return prev.filter(id => id !== teamId)
      } else {
        return [...prev, teamId]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedTeamIds(teams.map(t => t.id))
  }

  const handleClearAll = () => {
    // Keep at least one team selected
    if (teams.length > 0) {
      setSelectedTeamIds([teams[0].id])
    }
  }

  // Don't show filter if only one team
  if (teams.length <= 1) {
    return null
  }

  const selectedTeams = teams.filter(t => selectedTeamIds.includes(t.id))
  const allSelected = selectedTeamIds.length === teams.length

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between"
          >
            {loading ? (
              <span className="text-muted-foreground">Loading teams...</span>
            ) : allSelected ? (
              <span>All Teams ({teams.length})</span>
            ) : selectedTeams.length === 0 ? (
              <span className="text-muted-foreground">Select teams...</span>
            ) : selectedTeams.length === 1 ? (
              <span>{selectedTeams[0].name}</span>
            ) : (
              <span>{selectedTeams.length} teams selected</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search teams..." />
            <CommandEmpty>No teams found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={allSelected ? handleClearAll : handleSelectAll}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                      allSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="font-medium">{allSelected ? 'Clear All' : 'Select All'}</span>
                </div>
              </CommandItem>
              {teams.map(team => {
                const isSelected = selectedTeamIds.includes(team.id)
                return (
                  <CommandItem
                    key={team.id}
                    onSelect={() => handleToggleTeam(team.id)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <div>{team.name}</div>
                      {team.division && (
                        <div className="text-muted-foreground text-xs">
                          {team.division}
                          {team.season && ` • ${team.season}`}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {!allSelected && selectedTeams.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTeams.slice(0, 3).map(team => (
            <Badge key={team.id} variant="secondary" className="text-xs">
              {team.name}
            </Badge>
          ))}
          {selectedTeams.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedTeams.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
