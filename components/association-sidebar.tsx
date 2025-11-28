'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  AlertCircle,
  DollarSign,
  FileText,
  Settings,
  Building2,
  User,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

interface AssociationSidebarProps {
  associationId: string
}

interface AssociationData {
  name: string
  abbreviation?: string
}

interface UserData {
  name: string
  email: string
  role: string
}

export function AssociationSidebar({ associationId }: AssociationSidebarProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [associationData, setAssociationData] = useState<AssociationData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)

  // Navigation items for association dashboard
  const navigation = [
    {
      name: 'Overview',
      href: `/association/${associationId}/overview`,
      icon: LayoutDashboard
    },
    {
      name: 'Teams',
      href: `/association/${associationId}/teams`,
      icon: Users
    },
    {
      name: 'Alerts',
      href: `/association/${associationId}/alerts`,
      icon: AlertCircle
    },
    {
      name: 'Financials',
      href: `/association/${associationId}/financials`,
      icon: DollarSign
    },
    {
      name: 'Reports',
      href: `/association/${associationId}/reports`,
      icon: FileText
    },
    {
      name: 'Settings',
      href: `/association/${associationId}/settings`,
      icon: Settings
    },
  ]

  useEffect(() => {
    setMounted(true)

    // Fetch association data
    async function fetchData() {
      try {
        // For now, use mock data in dev mode or fetch from API
        if (DEV_MODE) {
          setAssociationData({
            name: 'Newmarket Minor Hockey',
            abbreviation: 'NMHA',
          })
          setUserData({
            name: 'Association Admin',
            email: 'admin@demo.huddlebooks.app',
            role: 'Association Admin',
          })
        } else {
          // In production, fetch from API
          const res = await fetch(`/api/association/${associationId}`)
          if (res.ok) {
            const data = await res.json()
            setAssociationData(data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch association data:', error)
      }
    }

    fetchData()
  }, [associationId])

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-gray-200 fixed left-0 top-0 z-40">
      {/* Logo & Association Name Section */}
      <div className="p-6 border-b border-gray-200">
        <Link href={`/association/${associationId}/overview`} className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            HuddleBooks
          </span>
        </Link>
        <div className="text-xs text-gray-500 mb-2 font-medium">COMMAND CENTER</div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-orange-600" />
          </div>
          <span className="font-medium truncate">
            {associationData?.abbreviation || associationData?.name || 'Loading...'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-orange-600'
                  )}
                />
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
              {DEV_MODE ? (
                // Dev mode: Show simple avatar
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-orange-600" />
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
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userData?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userData?.role || 'Association Admin'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
