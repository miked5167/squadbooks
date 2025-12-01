'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  CheckCircle,
  FileText,
  Settings,
  Users,
  HelpCircle,
  Activity,
  User,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Budget', href: '/budget', icon: PiggyBank },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  {
    name: 'Approvals',
    href: '/approvals',
    icon: CheckCircle,
    requiresRole: ['TREASURER', 'ASSISTANT_TREASURER'] // Only show to treasurers
  },
  { name: 'Roster', href: '/players', icon: Users },
  { name: 'Reports', href: '/reports', icon: FileText },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    requiresRole: ['TREASURER', 'ASSISTANT_TREASURER'] // Only show to treasurers
  },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Support', href: '/support', icon: HelpCircle },
]

interface UserData {
  name: string
  role: string
  team: {
    name: string
  }
}

export function AppSidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    setMounted(true)

    // Fetch current user data for role-based navigation
    async function fetchUserData() {
      try {
        const res = await fetch('/api/user/me')
        if (res.ok) {
          const data = await res.json()
          setUserData(data)
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }

    fetchUserData()
  }, [])

  const sidebarContent = (
    <>
      {/* Logo & Team Name Section */}
      <div className="p-6 border-b border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-navy to-navy-medium rounded-lg flex items-center justify-center">
            <span className="text-golden text-lg font-bold">S</span>
          </div>
          <span className="text-xl font-bold text-white">Squadbooks</span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center">
            <Users className="w-4 h-4 text-slate-300" />
          </div>
          <span className="font-medium text-white truncate">
            {userData?.team.name || 'My Team'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation
            .filter((item) => {
              // Filter based on role requirements
              if (item.requiresRole && userData?.role) {
                return item.requiresRole.includes(userData.role)
              }
              return true
            })
            .map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              )
            })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          {mounted && (
            <>
              {DEV_MODE ? (
                // Dev mode: Show simple avatar
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-300" />
                </div>
              ) : (
                // Production: Show Clerk UserButton
                (() => {
                  const { UserButton } = require('@clerk/nextjs')
                  return (
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: 'w-10 h-10',
                        },
                      }}
                    />
                  )
                })()
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userData?.name || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {userData?.role.replace('_', ' ') || 'Loading...'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex flex-col h-screen w-64 bg-slate-800 border-r border-slate-700 fixed left-0 top-0 z-40">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Content - Used by MobileHeader */}
      <div className="lg:hidden flex flex-col h-full bg-slate-800">
        {sidebarContent}
      </div>
    </>
  )
}
