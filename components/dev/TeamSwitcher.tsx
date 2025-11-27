'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Users, RefreshCw } from 'lucide-react'

interface DemoTeam {
  id: string
  name: string
  userId: string
  userName: string
  division: string
}

const DEMO_TEAMS: DemoTeam[] = [
  {
    id: 'cmig8gd1o0000tg4om4ddrqta',
    name: 'U13 AA Storm',
    userId: 'demo_2025_2026_000002',
    userName: 'U13 AA Storm Treasurer',
    division: 'U13 AA',
  },
  {
    id: 'cmig8ilgv00gntg4oky4n5lfu',
    name: 'U15 A Thunder',
    userId: 'demo_2025_2026_000041',
    userName: 'U15 A Thunder Treasurer',
    division: 'U15 A',
  },
  {
    id: 'cmig8kspb00wytg4oz4mz59f4',
    name: 'U11 AAA Lightning',
    userId: 'demo_2025_2026_000076',
    userName: 'U11 AAA Lightning Treasurer',
    division: 'U11 AAA',
  },
]

export function TeamSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTeam, setCurrentTeam] = useState<DemoTeam>(DEMO_TEAMS[0])
  const [isDevMode, setIsDevMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we're in dev mode
    const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
    setIsDevMode(devMode)

    if (devMode) {
      // Load saved team from localStorage
      const savedUserId = localStorage.getItem('dev_user_id')
      if (savedUserId) {
        const team = DEMO_TEAMS.find(t => t.userId === savedUserId)
        if (team) {
          setCurrentTeam(team)
        }
      }
    }
  }, [])

  const switchTeam = (team: DemoTeam) => {
    // Save to both localStorage (for UI state) and cookie (for server-side auth)
    localStorage.setItem('dev_user_id', team.userId)

    // Set cookie that server can read
    document.cookie = `dev_user_id=${team.userId}; path=/; max-age=31536000; SameSite=Lax`

    setCurrentTeam(team)
    setIsOpen(false)

    // Reload the page to apply the new user context
    window.location.href = '/dashboard'
  }

  // Don't render if not in dev mode
  if (!isDevMode) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Team Switcher Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
        >
          <Users className="w-5 h-5" />
          <div className="text-left">
            <div className="text-xs opacity-90">Dev Mode</div>
            <div className="text-sm font-semibold">{currentTeam.division}</div>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Switch Demo Team
                </h3>
                <p className="text-xs mt-1 opacity-90">Select a team to test with</p>
              </div>

              <div className="divide-y divide-gray-100">
                {DEMO_TEAMS.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => switchTeam(team)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      currentTeam.id === team.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {team.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {team.userName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Division: {team.division}
                        </div>
                      </div>
                      {currentTeam.id === team.id && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  💡 Switching teams will reload the page
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
