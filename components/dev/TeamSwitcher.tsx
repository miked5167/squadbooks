'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Users, RefreshCw, Building2 } from 'lucide-react'

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
    associationId: 'cmig8fz3f0000tg4o8qb5z8qm', // Will be auto-redirected to first association
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
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[1]) // Default to first team user
  const [isDevMode, setIsDevMode] = useState(false)
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

  // Don't render if not in dev mode
  if (!isDevMode) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* User Switcher Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 ${
            currentUser.isAssociation
              ? 'bg-gradient-to-r from-orange-600 to-red-600'
              : 'bg-gradient-to-r from-purple-600 to-blue-600'
          } text-white px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium`}
        >
          {currentUser.isAssociation ? (
            <Building2 className="w-5 h-5" />
          ) : (
            <Users className="w-5 h-5" />
          )}
          <div className="text-left">
            <div className="text-xs opacity-90">Dev Mode</div>
            <div className="text-sm font-semibold">
              {currentUser.division}
              {currentUser.role && !currentUser.isAssociation && (
                <span className="text-xs font-normal opacity-75 ml-1">
                  • {currentUser.role}
                </span>
              )}
            </div>
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
                  Switch Demo User
                </h3>
                <p className="text-xs mt-1 opacity-90">Select a user to test with</p>
              </div>

              <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => switchUser(user)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      currentUser.id === user.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-semibold text-gray-900">
                            {user.name}
                          </div>
                          {user.isAssociation && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Building2 className="w-3 h-3" />
                              Association
                            </span>
                          )}
                          {user.role && !user.isAssociation && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'Treasurer'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'Assistant Treasurer'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {user.userName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {user.isAssociation ? 'Oversees all teams' : `Division: ${user.division}`}
                        </div>
                      </div>
                      {currentUser.id === user.id && (
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
                  💡 Switching users will reload the page
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
