'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'For Associations', href: '#associations' },
  { label: 'For Teams', href: '#teams' },
  { label: 'Trust & Security', href: '#trust' },
  { label: 'FAQ', href: '#faq' },
]

export function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)

    const targetId = href.replace('#', '')
    const element = document.getElementById(targetId)

    if (element) {
      const offset = 80 // Account for sticky navbar height
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <>
      <nav className="bg-navy/95 sticky top-0 z-50 border-b border-white/10 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/huddlebooks-logo.png"
                alt="HuddleBooks"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
              <span className="hidden border-l border-white/20 pl-3 text-xs text-white/60 md:inline-block">
                Built for Associations
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center space-x-8 lg:flex">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={e => handleLinkClick(e, link.href)}
                  className="cursor-pointer text-sm font-medium text-white/80 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden items-center space-x-4 lg:flex">
              <a
                href="#demo"
                onClick={e => handleLinkClick(e, '#demo')}
                className="bg-golden text-navy hover:bg-golden/90 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-300"
              >
                Request a Demo
              </a>
              <a
                href="#updates"
                onClick={e => handleLinkClick(e, '#updates')}
                className="cursor-pointer text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                Get Updates
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="bg-navy/95 absolute inset-0 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Content */}
          <div className="bg-navy absolute top-16 right-0 left-0 border-b border-white/10 shadow-xl">
            <div className="container mx-auto space-y-4 px-4 py-6">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={e => handleLinkClick(e, link.href)}
                  className="block cursor-pointer py-2 text-base font-medium text-white/80 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}

              <div className="space-y-3 border-t border-white/10 pt-4">
                <a
                  href="#demo"
                  onClick={e => handleLinkClick(e, '#demo')}
                  className="bg-golden text-navy hover:bg-golden/90 block cursor-pointer rounded-lg px-6 py-3 text-center font-semibold transition-all duration-300"
                >
                  Request a Demo
                </a>
                <a
                  href="#updates"
                  onClick={e => handleLinkClick(e, '#updates')}
                  className="block cursor-pointer rounded-lg border-2 border-white/30 px-6 py-3 text-center font-semibold text-white transition-all duration-300 hover:bg-white/10"
                >
                  Get Updates
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
