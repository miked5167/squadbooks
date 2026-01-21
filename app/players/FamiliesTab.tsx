'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, UserPlus, Mail, Phone, Search, Copy, Check } from 'lucide-react'
import { EditFamilyDialog } from './EditFamilyDialog'
import { toast } from 'sonner'

interface Player {
  id: string
  firstName: string
  lastName: string
  jerseyNumber: string | null
  position: string | null
}

interface Family {
  id: string
  familyName: string
  primaryName: string | null
  primaryEmail: string
  primaryPhone: string | null
  secondaryName: string | null
  secondaryEmail: string | null
  secondaryPhone: string | null
  players: Player[]
}

interface FamiliesTabProps {
  families: Family[]
  teamName: string
  teamSeason: string
  isStaff: boolean
  userFamilyId?: string
}

export function FamiliesTab({
  families,
  teamName,
  teamSeason,
  isStaff,
  userFamilyId,
}: FamiliesTabProps) {
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(
    userFamilyId || (families.length > 0 ? families[0].id : null)
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [copiedEmails, setCopiedEmails] = useState(false)

  // Filter families based on search query
  const filteredFamilies = useMemo(() => {
    if (!searchQuery.trim()) return families

    const query = searchQuery.toLowerCase()
    return families.filter((family) => {
      // Search by family name
      if (family.familyName.toLowerCase().includes(query)) return true

      // Search by parent names
      if (family.primaryName?.toLowerCase().includes(query)) return true
      if (family.secondaryName?.toLowerCase().includes(query)) return true

      // Search by player names
      if (
        family.players.some(
          (player) =>
            player.firstName.toLowerCase().includes(query) ||
            player.lastName.toLowerCase().includes(query)
        )
      ) {
        return true
      }

      return false
    })
  }, [families, searchQuery])

  const selectedFamily = families.find((f) => f.id === selectedFamilyId)
  const canEdit = isStaff || selectedFamilyId === userFamilyId

  const handleCopyEmails = () => {
    if (!selectedFamily) return

    const emails = [
      selectedFamily.primaryEmail,
      selectedFamily.secondaryEmail,
    ].filter(Boolean)

    navigator.clipboard.writeText(emails.join(', '))
    setCopiedEmails(true)
    toast.success('Emails copied to clipboard')
    setTimeout(() => setCopiedEmails(false), 2000)
  }

  if (families.length === 0) {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-navy/60">Total Families</CardDescription>
              <CardTitle className="text-3xl text-navy">0</CardTitle>
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
              <CardTitle className="text-xl text-navy">{teamName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-navy/70">{teamSeason}</div>
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
                disabled
              >
                <Mail className="mr-2 w-4 h-4" />
                Export Contacts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        <Card className="border-0 shadow-card">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-navy/40" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">No families added yet</h3>
              {isStaff ? (
                <>
                  <p className="text-navy/60 mb-6 max-w-sm mx-auto">
                    Use 'Add Family' to register parent contacts
                  </p>
                  <Button className="bg-meadow hover:bg-meadow/90 text-white">
                    <UserPlus className="mr-2 w-4 h-4" />
                    Add First Family
                  </Button>
                </>
              ) : (
                <p className="text-navy/60 max-w-sm mx-auto">
                  Contact your team manager if this is incorrect
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
            <CardTitle className="text-xl text-navy">{teamName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-navy/70">{teamSeason}</div>
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

      {/* List + Detail Panel */}
      <Card className="border-0 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-navy">Family Directory</CardTitle>
            <CardDescription>Contact information for all registered families</CardDescription>
          </div>
          {isStaff && (
            <Button className="bg-meadow hover:bg-meadow/90 text-white">
              <UserPlus className="mr-2 w-4 h-4" />
              Add Family
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Family List */}
            <div className="w-full md:w-1/3 space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
                <Input
                  placeholder="Search families or players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Family List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {filteredFamilies.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-navy/60 text-sm">No families match your search</p>
                  </div>
                ) : (
                  filteredFamilies.map((family) => (
                    <button
                      key={family.id}
                      onClick={() => setSelectedFamilyId(family.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedFamilyId === family.id
                          ? 'bg-navy/5 border-navy/20 shadow-sm'
                          : 'bg-gray-50 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-navy truncate">
                              {family.familyName}
                            </h4>
                            {family.id === userFamilyId && (
                              <span className="flex-shrink-0 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                My Family
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-navy/60 mt-1">
                            {family.players.length > 0 ? (
                              <span>
                                {family.players.length} player
                                {family.players.length !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span>No players</span>
                            )}
                            {' • '}
                            <span>
                              {[family.primaryName, family.secondaryName]
                                .filter(Boolean)
                                .length || 1}{' '}
                              contact
                              {[family.primaryName, family.secondaryName].filter(Boolean)
                                .length !== 1
                                ? 's'
                                : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Column - Detail Panel */}
            <div className="flex-1 border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-6">
              {selectedFamily ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-navy">
                        {selectedFamily.familyName}
                      </h3>
                      {selectedFamily.id === userFamilyId && (
                        <p className="text-sm text-navy/60 mt-1">This is your family</p>
                      )}
                    </div>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-navy/20 text-navy hover:bg-navy/5"
                        onClick={() => setIsEditOpen(true)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>

                  {/* Parents/Guardians Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-navy uppercase tracking-wide">
                        Parents / Guardians
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-navy/60 hover:text-navy"
                        onClick={handleCopyEmails}
                      >
                        {copiedEmails ? (
                          <>
                            <Check className="mr-1 w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 w-3 h-3" />
                            Copy Emails
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Primary Guardian */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {selectedFamily.primaryName && (
                        <p className="font-medium text-navy">{selectedFamily.primaryName}</p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-navy/60 flex-shrink-0" />
                          <a
                            href={`mailto:${selectedFamily.primaryEmail}`}
                            className="text-navy/70 hover:text-navy hover:underline truncate"
                          >
                            {selectedFamily.primaryEmail}
                          </a>
                        </div>
                        {selectedFamily.primaryPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-navy/60 flex-shrink-0" />
                            <a
                              href={`tel:${selectedFamily.primaryPhone}`}
                              className="text-navy/70 hover:text-navy hover:underline"
                            >
                              {selectedFamily.primaryPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Secondary Guardian */}
                    {(selectedFamily.secondaryName ||
                      selectedFamily.secondaryEmail ||
                      selectedFamily.secondaryPhone) && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {selectedFamily.secondaryName && (
                          <p className="font-medium text-navy">{selectedFamily.secondaryName}</p>
                        )}
                        <div className="space-y-2">
                          {selectedFamily.secondaryEmail && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-navy/60 flex-shrink-0" />
                              <a
                                href={`mailto:${selectedFamily.secondaryEmail}`}
                                className="text-navy/70 hover:text-navy hover:underline truncate"
                              >
                                {selectedFamily.secondaryEmail}
                              </a>
                            </div>
                          )}
                          {selectedFamily.secondaryPhone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-navy/60 flex-shrink-0" />
                              <a
                                href={`tel:${selectedFamily.secondaryPhone}`}
                                className="text-navy/70 hover:text-navy hover:underline"
                              >
                                {selectedFamily.secondaryPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Players Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-navy uppercase tracking-wide">
                      Players
                    </h4>
                    {selectedFamily.players.length === 0 ? (
                      <p className="text-sm text-navy/60 italic">No players linked to this family</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedFamily.players.map((player) => (
                          <div
                            key={player.id}
                            className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-navy">
                                {player.firstName} {player.lastName}
                              </p>
                              <p className="text-sm text-navy/60">
                                {player.jerseyNumber && `#${player.jerseyNumber}`}
                                {player.jerseyNumber && player.position && ' • '}
                                {player.position}
                                {!player.jerseyNumber && !player.position && 'No details'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-navy/60">
                  <p>Select a family to view details</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedFamily && (
        <EditFamilyDialog
          family={selectedFamily}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  )
}
