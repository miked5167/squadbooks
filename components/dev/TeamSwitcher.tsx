'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  Users,
  RefreshCw,
  Building2,
  Play,
  Trash2,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
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
    associationId: '2a98f680-97df-4215-8209-12806863c5ea', // Newmarket Minor Hockey Association
  },
  // U13 AA Storm
  {
    id: 'cmig8gd1o0000tg4om4ddrqta-treasurer',
    name: 'U13 AA Storm',
    userId: 'demo_2025_2026_000002',
    userName: 'U13 AA Storm Treasurer',
    division: 'U13 AA',
    role: 'Treasurer',
  },
  {
    id: 'cmig8gd1o0000tg4om4ddrqta-assistant',
    name: 'U13 AA Storm',
    userId: 'demo_2025_2026_000003',
    userName: 'U13 AA Storm Asst Treasurer',
    division: 'U13 AA',
    role: 'Assistant Treasurer',
  },
  {
    id: 'cmig8gd1o0000tg4om4ddrqta-parent',
    name: 'U13 AA Storm',
    userId: 'demo_2025_2026_000004',
    userName: 'U13 AA Storm Parent',
    division: 'U13 AA',
    role: 'Parent',
  },
  // U15 A Thunder
  {
    id: 'cmig8ilgv00gntg4oky4n5lfu-treasurer',
    name: 'U15 A Thunder',
    userId: 'demo_2025_2026_000041',
    userName: 'U15 A Thunder Treasurer',
    division: 'U15 A',
    role: 'Treasurer',
  },
  {
    id: 'cmig8ilgv00gntg4oky4n5lfu-assistant',
    name: 'U15 A Thunder',
    userId: 'demo_2025_2026_000042',
    userName: 'U15 A Thunder Asst Treasurer',
    division: 'U15 A',
    role: 'Assistant Treasurer',
  },
  {
    id: 'cmig8ilgv00gntg4oky4n5lfu-parent',
    name: 'U15 A Thunder',
    userId: 'demo_2025_2026_000043',
    userName: 'U15 A Thunder Parent',
    division: 'U15 A',
    role: 'Parent',
  },
  // U11 AAA Lightning
  {
    id: 'cmig8kspb00wytg4oz4mz59f4-treasurer',
    name: 'U11 AAA Lightning',
    userId: 'demo_2025_2026_000076',
    userName: 'U11 AAA Lightning Treasurer',
    division: 'U11 AAA',
    role: 'Treasurer',
  },
  {
    id: 'cmig8kspb00wytg4oz4mz59f4-assistant',
    name: 'U11 AAA Lightning',
    userId: 'demo_2025_2026_000077',
    userName: 'U11 AAA Lightning Asst Treasurer',
    division: 'U11 AAA',
    role: 'Assistant Treasurer',
  },
  {
    id: 'cmig8kspb00wytg4oz4mz59f4-parent',
    name: 'U11 AAA Lightning',
    userId: 'demo_2025_2026_000078',
    userName: 'U11 AAA Lightning Parent',
    division: 'U11 AAA',
    role: 'Parent',
  },
]

export function TeamSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'scenarios'>('users')
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[1]) // Default to first team user
  const [isDevMode, setIsDevMode] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if we're in dev mode
    const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
    setIsDevMode(devMode)

    if (devMode) {
      // Load saved user from localStorage
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
    // Save to both localStorage (for UI state) and cookie (for server-side auth)
    localStorage.setItem('dev_user_id', user.userId)

    // Set cookie that server can read
    document.cookie = `dev_user_id=${user.userId}; path=/; max-age=31536000; SameSite=Lax`

    setCurrentUser(user)
    setIsOpen(false)

    // Route to appropriate dashboard based on user type
    if (user.isAssociation) {
      // Redirect to /association which will auto-detect the user's association
      window.location.href = '/association'
    } else {
      window.location.href = '/dashboard'
    }
  }

  // Helper: Validate UUID format
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  // Scenario actions
  const resetAssociationRules = async () => {
    if (!confirm('This will delete all association rules. Continue?')) return

    setLoading('reset-rules')
    try {
      // Get association ID with fallback
      let associationId = currentUser.associationId || '2a98f680-97df-4215-8209-12806863c5ea'

      // Validate it's a UUID (not a CUID)
      if (!isValidUUID(associationId)) {
        console.warn(`Invalid UUID format: ${associationId}, using default Newmarket association`)
        associationId = '2a98f680-97df-4215-8209-12806863c5ea'
        toast.info('Using default association (cached data detected)')
      }

      const response = await fetch(`/api/dev/association-rules?associationId=${associationId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Association rules cleared')
      } else {
        toast.error(data.error || 'Failed to reset rules')
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Error resetting association rules:', error)
      toast.error('An error occurred. Check console for details.')
    } finally {
      setLoading(null)
    }
  }

  const resetTeamData = async () => {
    const teamUser = DEMO_USERS.find(u => !u.isAssociation && u.role === 'Treasurer')
    if (!teamUser) {
      toast.error('No team found')
      return
    }

    if (!confirm(`This will clear all financial data for the selected team. Continue?`)) return

    setLoading('reset-team')
    try {
      // Extract teamId from the demo user ID (first part before hyphen)
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
    if (!teamUser) {
      toast.error('No team found')
      return
    }

    if (!confirm('Generate 9 months of transactions for end-of-season demo?')) return

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
        toast.error(data.error || 'Failed to fast-forward season')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const generateReports = async () => {
    const teamUser = DEMO_USERS.find(u => !u.isAssociation && u.role === 'Treasurer')
    if (!teamUser) {
      toast.error('No team found')
      return
    }

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
          description: '3 reports generated successfully',
          duration: 5000,
        })
        console.log('Season Reports:', data.reports)
      } else {
        toast.error(data.error || 'Failed to generate reports')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  // Don't render if not in dev mode
  if (!isDevMode) {
    return null
  }

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {/* User Switcher Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 ${
            currentUser.isAssociation
              ? 'bg-gradient-to-r from-orange-600 to-red-600'
              : 'bg-gradient-to-r from-purple-600 to-blue-600'
          } rounded-lg px-4 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl`}
        >
          {currentUser.isAssociation ? (
            <Building2 className="h-5 w-5" />
          ) : (
            <Users className="h-5 w-5" />
          )}
          <div className="text-left">
            <div className="text-xs opacity-90">Dev Mode</div>
            <div className="text-sm font-semibold">
              {currentUser.division}
              {currentUser.role && !currentUser.isAssociation && (
                <span className="ml-1 text-xs font-normal opacity-75">• {currentUser.role}</span>
              )}
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Menu */}
            <div
              className={`absolute right-0 bottom-full mb-2 ${activeTab === 'scenarios' ? 'w-[500px]' : 'w-80'} z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl`}
            >
              {/* Header with Tabs */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="flex border-b border-white/20">
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                      activeTab === 'users' ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-4 w-4" />
                      Switch User
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('scenarios')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                      activeTab === 'scenarios' ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Demo Scenarios
                    </div>
                  </button>
                </div>
                <div className="px-4 py-2">
                  <p className="text-xs opacity-90">
                    {activeTab === 'users'
                      ? 'Select a user to test with'
                      : 'Quickly set up demo scenarios'}
                  </p>
                </div>
              </div>

              {/* Users Tab Content */}
              {activeTab === 'users' && (
                <div className="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto">
                  {DEMO_USERS.map(user => (
                    <button
                      key={user.id}
                      onClick={() => switchUser(user)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                        currentUser.id === user.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold text-gray-900">{user.name}</div>
                            {user.isAssociation && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                                <Building2 className="h-3 w-3" />
                                Association
                              </span>
                            )}
                            {user.role && !user.isAssociation && (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  user.role === 'Treasurer'
                                    ? 'bg-purple-100 text-purple-800'
                                    : user.role === 'Assistant Treasurer'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {user.role}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">{user.userName}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            {user.isAssociation
                              ? 'Oversees all teams'
                              : `Division: ${user.division}`}
                          </div>
                        </div>
                        {currentUser.id === user.id && (
                          <div className="ml-2 flex-shrink-0">
                            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
                    <p className="text-xs text-gray-600">💡 Switching users will reload the page</p>
                  </div>
                </div>
              )}

              {/* Scenarios Tab Content */}
              {activeTab === 'scenarios' && (
                <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
                  {/* Association Scenarios */}
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Building2 className="h-4 w-4 text-orange-600" />
                      Association Scenarios
                    </h4>
                    <button
                      onClick={resetAssociationRules}
                      disabled={loading === 'reset-rules'}
                      className="flex w-full items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        {loading === 'reset-rules' ? (
                          <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                        ) : (
                          <Trash2 className="h-5 w-5 text-orange-600" />
                        )}
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">Reset All Rules</div>
                          <div className="text-xs text-gray-600">
                            Clear all rules for clean demo
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Team Scenarios */}
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Users className="h-4 w-4 text-purple-600" />
                      Team Scenarios
                    </h4>
                    <button
                      onClick={resetTeamData}
                      disabled={loading === 'reset-team'}
                      className="flex w-full items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        {loading === 'reset-team' ? (
                          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                        ) : (
                          <RefreshCw className="h-5 w-5 text-purple-600" />
                        )}
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">
                            Reset Team to Day 1
                          </div>
                          <div className="text-xs text-gray-600">Clear all financial data</div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Season Management */}
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      Season Management
                    </h4>
                    <button
                      onClick={fastForwardSeason}
                      disabled={loading === 'fast-forward'}
                      className="flex w-full items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        {loading === 'fast-forward' ? (
                          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                        ) : (
                          <Play className="h-5 w-5 text-green-600" />
                        )}
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">
                            Fast-Forward to Season End
                          </div>
                          <div className="text-xs text-gray-600">Generate 9 months of data</div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={generateReports}
                      disabled={loading === 'generate-reports'}
                      className="flex w-full items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        {loading === 'generate-reports' ? (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-blue-600" />
                        )}
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">
                            Generate Season Reports
                          </div>
                          <div className="text-xs text-gray-600">
                            Financial & compliance reports
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Info Footer */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                      <p className="text-xs text-blue-800">
                        These actions are only available in dev mode and help set up demo scenarios
                        for presentations.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
