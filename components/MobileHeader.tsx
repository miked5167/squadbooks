'use client'

import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'

interface MobileHeaderProps {
  children: ReactNode
  title?: string
}

export function MobileHeader({ children, title = 'HuddleBooks' }: MobileHeaderProps) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700">
      <div className="flex items-center justify-between px-4 py-3">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="p-2 rounded-lg text-white hover:bg-slate-700 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-slate-800 border-slate-700">
            {children}
          </SheetContent>
        </Sheet>

        <Logo variant="full" className="flex items-center gap-2" />

        <div className="w-10" /> {/* Spacer for centering */}
      </div>
    </div>
  )
}
