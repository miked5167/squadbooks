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
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Budget', href: '/budget', icon: PiggyBank },
  { name: 'Approvals', href: '/approvals', icon: CheckCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function AppNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-navy to-navy-medium rounded-lg flex items-center justify-center">
              <span className="text-golden text-lg font-bold">S</span>
            </div>
            <span className="text-xl font-bold text-navy">Squadbooks</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    isActive
                      ? 'bg-navy text-white'
                      : 'text-navy/70 hover:text-navy hover:bg-navy/5'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Right side - User button */}
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-navy hover:bg-navy/5 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200 animate-slide-up-fade">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                    isActive
                      ? 'bg-navy text-white'
                      : 'text-navy/70 hover:text-navy hover:bg-navy/5'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </header>
  )
}
