'use client'

import { useState, useEffect } from 'react'
import {
  ChevronDown,
  Users,
  RefreshCw,
  Building2,
  Play,
  Trash2,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface DemoUser {
  id: string
  name: string
  userId: string
  userName: string
  division: string
  role?: string
  isAssociation?: boolean
  associationId?: string
}

const DEMO_USERS: DemoUser[] = [
  // Association Admin
  {
    id: 'association-admin',
    name: 'HuddleBooks Command Center',
    userId: 'demo_2025_2026_000001',
    userName: 'Association Admin',
    division: 'Command Center',
    role: 'Association',
    isAssociation: true,
    associationId: '2a98f680-97df-4215-8209-12806863c5ea',
  },
  // U13 AA Storm
  {
    id: 'cminhmzhi000gtgpcgvw5ogk9-treasurer',
    name: 'U13 AA Storm',
    userId: 'demo_2025_2026_000002',
    userName: 'U13 AA Storm Treasurer',
    division: 'U13 AA',
    role: 'Treasurer',
  },
  {
    id: 'cminhmzhi000gtgpcgvw5ogk9-assistant',
    name: 'U13 AA Storm',
    userId: 'demo_2025_2026_000003',
    userName: 'U13 AA Storm Asst Treasurer',
    division: 'U13 AA',
    role: 'Assistant Treasurer',
  },
  {
    id: 'cminhmzhi000gtgpcgvw5ogk9-parent',
    name: 'U13 AA Storm',
    userId: 'demo_2025_2026_000006',
    userName: 'U13 AA Storm Parent',
    division: 'U13 AA',
    role: 'Parent',
  },
  // U15 A Thunder
  {
    id: 'cminhpyqi00mttgpco9bi7upp-treasurer',
    name: 'U15 A Thunder',
    userId: 'demo_2025_2026_000042',
    userName: 'U15 A Thunder Treasurer',
    division: 'U15 A',
    role: 'Treasurer',
  },
  {
    id: 'cminhpyqi00mttgpco9bi7upp-assistant',
    name: 'U15 A Thunder',
    userId: 'demo_2025_2026_000043',
    userName: 'U15 A Thunder Asst Treasurer',
    division: 'U15 A',
    role: 'Assistant Treasurer',
  },
  {
    id: 'cminhpyqi00mttgpco9bi7upp-parent',
    name: 'U15 A Thunder',
    userId: 'demo_2025_2026_000046',
    userName: 'U15 A Thunder Parent',
    division: 'U15 A',
    role: 'Parent',
  },
  // U11 AAA Lightning
  {
    id: 'cminhsu9d0188tgpc5wngdamd-treasurer',
    name: 'U11 AAA Lightning',
    userId: 'demo_2025_2026_000078',
    userName: 'U11 AAA Lightning Treasurer',
    division: 'U11 AAA',
    role: 'Treasurer',
  },
  {
    id: 'cminhsu9d0188tgpc5wngdamd-assistant',
    name: 'U11 AAA Lightning',
    userId: 'demo_2025_2026_000079',
    userName: 'U11 AAA Lightning Asst Treasurer',
    division: 'U11 AAA',
    role: 'Assistant Treasurer',
  },
  {
    id: 'cminhsu9d0188tgpc5wngdamd-parent',
    name: 'U11 AAA Lightning',
    userId: 'demo_2025_2026_000082',
    userName: 'U11 AAA Lightning Parent',
    division: 'U11 AAA',
    role: 'Parent',
  },
]

export function DevModeSidebarSwitcher() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'scenarios'>('users')
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[1])
  const [isDevMode, setIsDevMode] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
    setIsDevMode(devMode)

    if (devMode) {
      const savedUserId = localStorage.getItem('dev_user_id')
      if (savedUserId) {
        const user = DEMO_USERS.find(u => u.userId === savedUserId)
        if (user) {
          setCurrentUser(user)
        }
      }
    }
  }, [])

  const switchUser = (user: DemoUser) => {
    localStorage.setItem('dev_user_id', user.userId)
    document.cookie = `dev_user_id=${user.userId}; path=/; max-age=31536000; SameSite=Lax`
    setCurrentUser(user)
    setIsExpanded(false)

    if (user.isAssociation) {
      window.location.href = '/association'
    } else {
      window.location.href = '/dashboard'
    }
  }

  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  const resetAssociationRules = async () => {
    if (!confirm('This will delete all association rules. Continue?')) return
    setLoading('reset-rules')
    try {
      let associationId = currentUser.associationId || '2a98f680-97df-4215-8209-12806863c5ea'
      if (!isValidUUID(associationId)) {
        associationId = '2a98f680-97df-4215-8209-12806863c5ea'
        toast.info('Using default association')
      }
      const response = await fetch(`/api/dev/association-rules?associationId=${associationId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || 'Association rules cleared')
      } else {
        toast.error(data.error || 'Failed to reset rules')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const resetTeamData = async () => {
    const teamUser = DEMO_USERS.find(u => !u.isAssociation && u.role === 'Treasurer')
    if (!teamUser) return
    if (!confirm('Clear all financial data?')) return
    setLoading('reset-team')
    try {
      const teamId = teamUser.id.split('-')[0]
      const response = await fetch('/api/dev/reset-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || 'Team reset successfully')
      } else {
        toast.error(data.error || 'Failed to reset team')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const fastForwardSeason = async () => {
    const teamUser = DEMO_USERS.find(u => !u.isAssociation && u.role === 'Treasurer')
    if (!teamUser) return
    if (!confirm('Generate 9 months of transactions?')) return
    setLoading('fast-forward')
    try {
      const teamId = teamUser.id.split('-')[0]
      const response = await fetch('/api/dev/fast-forward-season', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success(`${data.generated.transactions} transactions generated`, {
          description: `Budget: ${data.seasonStats.budgetUsed}% used`,
          duration: 5000,
        })
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const generateReports = async () => {
    const teamUser = DEMO_USERS.find(u => !u.isAssociation && u.role === 'Treasurer')
    if (!teamUser) return
    setLoading('generate-reports')
    try {
      const teamId = teamUser.id.split('-')[0]
      const response = await fetch('/api/dev/season-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message, {
          description: '3 reports generated',
          duration: 5000,
        })
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const resetAssociation = async () => {
    if (!confirm('This will delete the association and all its data. You can then go through onboarding again. Continue?')) return
    setLoading('reset-association')
    try {
      let associationId = currentUser.associationId || '2a98f680-97df-4215-8209-12806863c5ea'
      if (!isValidUUID(associationId)) {
        associationId = '2a98f680-97df-4215-8209-12806863c5ea'
        toast.info('Using default association')
      }
      const response = await fetch(`/api/dev/reset-association?associationId=${associationId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || 'Association reset successfully')
        setTimeout(() => {
          window.location.href = '/association/onboarding'
        }, 1000)
      } else {
        toast.error(data.error || 'Failed to reset association')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const resetTeamOnboarding = async () => {
    // Don't allow resetting if viewing as association admin
    if (currentUser.isAssociation) {
      toast.error('Please switch to a team user first')
      return
    }
    if (!confirm('This will delete the team and all its data. You can then go through team onboarding again. Continue?')) return
    setLoading('reset-team-onboarding')
    try {
      const teamId = currentUser.id.split('-')[0]
      const response = await fetch(`/api/dev/reset-team-onboarding?teamId=${teamId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || 'Team reset successfully')
        setTimeout(() => {
          window.location.href = '/onboarding'
        }, 1000)
      } else {
        toast.error(data.error || 'Failed to reset team')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  if (!isDevMode) return null

  return (
    <div className="border-t border-white/10">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium text-slate-300">Dev Mode</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'users'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'scenarios'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scenarios
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {DEMO_USERS.map(user => (
                <button
                  key={user.id}
                  onClick={() => switchUser(user)}
                  className={`w-full px-2 py-2 rounded text-left transition-colors ${
                    currentUser.id === user.id
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {user.isAssociation ? (
                      <Building2 className="h-3 w-3 text-orange-400 flex-shrink-0" />
                    ) : (
                      <Users className="h-3 w-3 text-blue-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{user.division}</div>
                      <div className="text-xs text-slate-400 truncate">{user.role}</div>
                    </div>
                    {currentUser.id === user.id && (
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Scenarios Tab */}
          {activeTab === 'scenarios' && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <button
                onClick={resetAssociationRules}
                disabled={loading === 'reset-rules'}
                className="w-full px-2 py-2 rounded bg-orange-500/10 hover:bg-orange-500/20 disabled:opacity-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {loading === 'reset-rules' ? (
                    <Loader2 className="h-3 w-3 animate-spin text-orange-400" />
                  ) : (
                    <Trash2 className="h-3 w-3 text-orange-400" />
                  )}
                  <span className="text-xs text-slate-200">Reset Rules</span>
                </div>
              </button>

              <button
                onClick={resetAssociation}
                disabled={loading === 'reset-association'}
                className="w-full px-2 py-2 rounded bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {loading === 'reset-association' ? (
                    <Loader2 className="h-3 w-3 animate-spin text-red-400" />
                  ) : (
                    <Building2 className="h-3 w-3 text-red-400" />
                  )}
                  <span className="text-xs text-slate-200">Reset Association</span>
                </div>
              </button>

              <button
                onClick={resetTeamOnboarding}
                disabled={loading === 'reset-team-onboarding'}
                className="w-full px-2 py-2 rounded bg-yellow-500/10 hover:bg-yellow-500/20 disabled:opacity-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {loading === 'reset-team-onboarding' ? (
                    <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />
                  ) : (
                    <Users className="h-3 w-3 text-yellow-400" />
                  )}
                  <span className="text-xs text-slate-200">Reset Team Onboarding</span>
                </div>
              </button>

              <button
                onClick={resetTeamData}
                disabled={loading === 'reset-team'}
                className="w-full px-2 py-2 rounded bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {loading === 'reset-team' ? (
                    <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                  ) : (
                    <RefreshCw className="h-3 w-3 text-purple-400" />
                  )}
                  <span className="text-xs text-slate-200">Reset Team</span>
                </div>
              </button>

              <button
                onClick={fastForwardSeason}
                disabled={loading === 'fast-forward'}
                className="w-full px-2 py-2 rounded bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {loading === 'fast-forward' ? (
                    <Loader2 className="h-3 w-3 animate-spin text-green-400" />
                  ) : (
                    <Play className="h-3 w-3 text-green-400" />
                  )}
                  <span className="text-xs text-slate-200">Fast-Forward</span>
                </div>
              </button>

              <button
                onClick={generateReports}
                disabled={loading === 'generate-reports'}
                className="w-full px-2 py-2 rounded bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {loading === 'generate-reports' ? (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                  ) : (
                    <FileText className="h-3 w-3 text-blue-400" />
                  )}
                  <span className="text-xs text-slate-200">Gen Reports</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
