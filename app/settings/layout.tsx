/**
 * Settings Layout
 * Tab-based navigation for all settings sections
 * Only accessible to Treasurers and Assistant Treasurers
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppSidebar } from '@/components/app-sidebar'
import Link from 'next/link'
import {
  Building2,
  Users,
  FolderTree,
  Shield,
  Bell,
  ScrollText,
  Calendar
} from 'lucide-react'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      role: true,
      name: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/')
  }

  // Only Treasurers and Assistant Treasurers can access Settings
  if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
    redirect('/dashboard')
  }

  // Only Treasurers (not assistants) can access certain sensitive sections
  const isTreasurer = user.role === 'TREASURER'

  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar />
      {/* Header */}
      <div className="ml-64 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy">
                Settings
              </h1>
              <p className="text-sm text-navy/60 mt-1">
                Manage team settings, users, and preferences
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-navy">{user.team.name}</p>
              <p className="text-xs text-navy/60">{user.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="ml-64 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            <nav className="flex space-x-1 min-w-max py-2" aria-label="Settings navigation">
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors text-navy/70 hover:text-navy"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Team Profile</span>
              </Link>

              {isTreasurer && (
                <Link
                  href="/settings/users"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors text-navy/70 hover:text-navy"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Users & Roles</span>
                </Link>
              )}

              <Link
                href="/settings/categories"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors text-navy/70 hover:text-navy"
              >
                <FolderTree className="w-4 h-4" />
                <span className="hidden sm:inline">Budget & Categories</span>
              </Link>

              <Link
                href="/settings/transaction-rules"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors text-navy/70 hover:text-navy"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Transaction Rules</span>
              </Link>

              <Link
                href="/settings/notifications"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors text-navy/70 hover:text-navy"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </Link>

              {isTreasurer && (
                <>
                  <Link
                    href="/settings/audit"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors text-navy/70 hover:text-navy"
                  >
                    <ScrollText className="w-4 h-4" />
                    <span className="hidden sm:inline">Audit & Compliance</span>
                  </Link>

                  <Link
                    href="/settings/end-of-season"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors text-navy/70 hover:text-navy"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">End of Season</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="ml-64 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  )
}
