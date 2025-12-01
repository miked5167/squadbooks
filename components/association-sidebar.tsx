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
  Shield,
  CheckCircle2,
  AlertTriangle,
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

  // Governance navigation section
  const governanceNavigation = [
    {
      name: 'Rules',
      href: `/association/${associationId}/rules`,
      icon: Shield
    },
    {
      name: 'Compliance',
      href: `/association/${associationId}/compliance`,
      icon: CheckCircle2
    },
    {
      name: 'Violations',
      href: `/association/${associationId}/violations`,
      icon: AlertTriangle
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

  const sidebarContent = (
    <>
      {/* Logo & Association Name Section */}
      <div className="p-6 border-b border-white/10">
        <Link href={`/association/${associationId}/overview`} className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-golden to-meadow rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-white/20 text-white">
            HuddleBooks
          </span>
        </Link>
        <div className="text-xs text-white/60 mb-2 font-medium">COMMAND CENTER</div>
        <div className="flex items-center gap-2 text-sm text-white/90">
          <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-golden" />
          </div>
          <span className="font-medium truncate">
            {associationData?.abbreviation || associationData?.name || 'Loading...'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1 mb-6">
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
                    ? 'bg-white/20 text-white'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-white' : 'text-white/60 group-hover:text-white'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* Governance Section */}
        <div>
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Governance
            </p>
          </div>
          <div className="space-y-1">
            {governanceNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-white' : 'text-white/60 group-hover:text-white'
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          {mounted && (
            <>
              {DEV_MODE ? (
                // Dev mode: Show simple avatar
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-golden" />
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
                  {userData?.name || 'Admin'}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {userData?.role || 'Association Admin'}
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
      <div className="hidden lg:flex flex-col h-screen w-64 bg-gradient-to-br from-navy via-navy-medium to-navy border-r border-white/10 fixed left-0 top-0 z-40">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Content - Used by MobileHeader */}
      <div className="lg:hidden flex flex-col h-full bg-gradient-to-br from-navy via-navy-medium to-navy">
        {sidebarContent}
      </div>
    </>
  )
}
