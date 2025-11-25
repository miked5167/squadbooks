/**
 * Dashboard Layout
 *
 * Provides a consistent layout for all dashboard pages with:
 * - Sidebar navigation
 * - Header with association name and user menu
 * - Main content area
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import {
  LayoutDashboard,
  Users,
  Bell,
  FileText,
  Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { UserButtonWrapper } from '@/components/user-button-wrapper'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  // Check authentication
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  // Get user's association
  const associationUser = await prisma.associationUser.findUnique({
    where: {
      clerkUserId: userId,
    },
    include: {
      association: true,
    },
  })

  if (!associationUser || !associationUser.association) {
    // TODO: Redirect to onboarding if no association
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Association Found</h1>
          <p className="text-muted-foreground">
            You are not associated with any organization.
          </p>
        </div>
      </div>
    )
  }

  const association = associationUser.association
  const associationId = association.id

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-muted/10">
        <div className="flex h-full flex-col">
          {/* Logo / Association Name */}
          <div className="flex h-16 items-center px-6 border-b">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {association.abbreviation || association.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-none">
                  {association.abbreviation || association.name}
                </span>
                {association.season && (
                  <span className="text-xs text-muted-foreground">
                    {association.season}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <NavLink
              href={`/`}
              icon={<LayoutDashboard className="h-5 w-5" />}
              label="Overview"
            />
            <NavLink
              href={`/teams`}
              icon={<Users className="h-5 w-5" />}
              label="Teams"
            />
            <NavLink
              href={`/alerts`}
              icon={<Bell className="h-5 w-5" />}
              label="Alerts"
            />
            <NavLink
              href={`/reports`}
              icon={<FileText className="h-5 w-5" />}
              label="Reports"
            />
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserButtonWrapper />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {associationUser.name || associationUser.email}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {associationUser.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>

          {/* Association Name (mobile) */}
          <div className="flex items-center md:hidden">
            <span className="text-sm font-semibold">
              {association.abbreviation || association.name}
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User menu (mobile) */}
          <div className="flex items-center gap-4 md:hidden">
            <UserButtonWrapper />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

// Navigation Link Component
interface NavLinkProps {
  href: string
  icon: React.ReactNode
  label: string
}

function NavLink({ href, icon, label }: NavLinkProps) {
  // Note: In a real app, you'd use usePathname() or similar to highlight active route
  // For now, we'll keep it simple
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-muted-foreground"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
