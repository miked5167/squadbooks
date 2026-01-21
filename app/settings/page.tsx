/**
 * Team Profile Settings Page
 * Main settings page for configuring team information
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save } from 'lucide-react'

interface TeamProfile {
  id: string
  name: string
  teamType?: string
  ageDivision?: string
  competitiveLevel?: string
  level?: string
  season: string
  logoUrl?: string | null
  associationName?: string | null
  seasonStartDate?: string | null
  seasonEndDate?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
}

export default function TeamProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<TeamProfile | null>(null)

  // Fetch team profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          console.error('Settings API error:', errorData)
          throw new Error(errorData.error || 'Failed to fetch team profile')
        }
        const data = await res.json()
        console.log('Settings API response:', data)
        setProfile(data.team)
      } catch (error: any) {
        console.error('Settings fetch error:', error)
        toast({
          title: 'Error',
          description: error.message || 'Failed to load team profile',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [toast])

  // Handle form submission
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profile) return

    setSaving(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: profile }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save team profile')
      }

      const data = await res.json()
      setProfile(data.team)

      toast({
        title: 'Success',
        description: 'Team profile updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save team profile',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-navy/60">Failed to load team profile</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-navy">Team Profile</h2>
          <p className="text-sm text-navy/60 mt-1">
            Update your team's basic information and contact details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy border-b border-gray-200 pb-2">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="season">Season *</Label>
                <Input
                  id="season"
                  value={profile.season}
                  onChange={(e) => setProfile({ ...profile, season: e.target.value })}
                  placeholder="e.g., 2024-2025"
                  required
                />
              </div>

              <div>
                <Label htmlFor="teamType">Team Type</Label>
                <Select
                  value={profile.teamType || ''}
                  onValueChange={(value) => setProfile({ ...profile, teamType: value })}
                >
                  <SelectTrigger id="teamType">
                    <SelectValue placeholder="Select team type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOUSE_LEAGUE">House League</SelectItem>
                    <SelectItem value="REPRESENTATIVE">Representative</SelectItem>
                    <SelectItem value="ADULT_RECREATIONAL">Adult Recreational</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ageDivision">Age Division</Label>
                <Select
                  value={profile.ageDivision || ''}
                  onValueChange={(value) => setProfile({ ...profile, ageDivision: value })}
                >
                  <SelectTrigger id="ageDivision">
                    <SelectValue placeholder="Select age division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="U7">U7</SelectItem>
                    <SelectItem value="U9">U9</SelectItem>
                    <SelectItem value="U11">U11</SelectItem>
                    <SelectItem value="U13">U13</SelectItem>
                    <SelectItem value="U15">U15</SelectItem>
                    <SelectItem value="U18">U18</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="competitiveLevel">Competitive Level</Label>
                <Select
                  value={profile.competitiveLevel || ''}
                  onValueChange={(value) =>
                    setProfile({ ...profile, competitiveLevel: value })
                  }
                >
                  <SelectTrigger id="competitiveLevel">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AAA">AAA</SelectItem>
                    <SelectItem value="AA">AA</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="BB">BB</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="MD">MD</SelectItem>
                    <SelectItem value="HOUSE_RECREATIONAL">House/Recreational</SelectItem>
                    <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="level">Custom Level</Label>
                <Input
                  id="level"
                  value={profile.level || ''}
                  onChange={(e) => setProfile({ ...profile, level: e.target.value })}
                  placeholder="e.g., Bantam A"
                />
              </div>
            </div>
          </div>

          {/* Season Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy border-b border-gray-200 pb-2">
              Season Dates
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seasonStartDate">Season Start Date</Label>
                <Input
                  id="seasonStartDate"
                  type="date"
                  value={
                    profile.seasonStartDate
                      ? new Date(profile.seasonStartDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      seasonStartDate: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="seasonEndDate">Season End Date</Label>
                <Input
                  id="seasonEndDate"
                  type="date"
                  value={
                    profile.seasonEndDate
                      ? new Date(profile.seasonEndDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      seasonEndDate: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Association & Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy border-b border-gray-200 pb-2">
              Association & Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="associationName">Association Name</Label>
                <Input
                  id="associationName"
                  value={profile.associationName || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, associationName: e.target.value })
                  }
                  placeholder="e.g., City Minor Hockey Association"
                />
              </div>

              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={profile.contactName || ''}
                  onChange={(e) => setProfile({ ...profile, contactName: e.target.value })}
                  placeholder="Treasurer name"
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={profile.contactEmail || ''}
                  onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                  placeholder="treasurer@example.com"
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={profile.contactPhone || ''}
                  onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="logoUrl">Team Logo URL</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={profile.logoUrl || ''}
                  onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
