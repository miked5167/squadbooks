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
        behavior: 'smooth'
      })
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-navy/95 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/huddlebooks-logo.png"
                alt="HuddleBooks"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center space-x-4">
              <a
                href="#demo"
                onClick={(e) => handleLinkClick(e, '#demo')}
                className="text-white/80 hover:text-white text-sm font-medium transition-colors cursor-pointer"
              >
                Request a Demo
              </a>
              <a
                href="#updates"
                onClick={(e) => handleLinkClick(e, '#updates')}
                className="px-6 py-2.5 bg-golden text-navy font-semibold rounded-lg hover:bg-golden/90 transition-all duration-300 text-sm"
              >
                Get Updates
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
            className="absolute inset-0 bg-navy/95 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Content */}
          <div className="absolute top-16 left-0 right-0 bg-navy border-b border-white/10 shadow-xl">
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="block text-white/80 hover:text-white text-base font-medium py-2 transition-colors cursor-pointer"
                >
                  {link.label}
                </a>
              ))}

              <div className="pt-4 border-t border-white/10 space-y-3">
                <a
                  href="#demo"
                  onClick={(e) => handleLinkClick(e, '#demo')}
                  className="block text-center px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300 cursor-pointer"
                >
                  Request a Demo
                </a>
                <a
                  href="#updates"
                  onClick={(e) => handleLinkClick(e, '#updates')}
                  className="block text-center px-6 py-3 bg-golden text-navy font-semibold rounded-lg hover:bg-golden/90 transition-all duration-300 cursor-pointer"
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
