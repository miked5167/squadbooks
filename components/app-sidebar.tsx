'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
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
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Budget', href: '/budget', icon: PiggyBank },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Roster', href: '/players', icon: Users },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Support', href: '/support', icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-gray-200 fixed left-0 top-0 z-40">
      {/* Logo & Team Name Section */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-navy to-navy-medium rounded-lg flex items-center justify-center">
            <span className="text-golden text-lg font-bold">S</span>
          </div>
          <span className="text-xl font-bold text-navy">Squadbooks</span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-navy/70">
          <div className="w-6 h-6 bg-navy/10 rounded flex items-center justify-center">
            <Users className="w-4 h-4 text-navy" />
          </div>
          <span className="font-medium text-navy">My Team</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-navy text-white'
                    : 'text-navy/70 hover:text-navy hover:bg-navy/5'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-white' : 'text-navy/50 group-hover:text-navy'
                )} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          {mounted && (
            <>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10'
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">User</p>
                <p className="text-xs text-navy/60 truncate">Treasurer</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
