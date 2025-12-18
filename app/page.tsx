'use client'

import Image from 'next/image'
import { NavBar } from '@/components/landing/NavBar'
import { EmailSignupForm } from '@/components/landing/EmailSignupForm'
import { DemoRequestForm } from '@/components/landing/DemoRequestForm'

export default function Home() {
  return (
    <div className="min-h-screen">
      <NavBar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-medium to-navy">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-32 pb-32 lg:pb-40 relative">
          <div className="max-w-5xl mx-auto text-center">
            {/* Logo */}
            <div className="mb-4 flex justify-center animate-slide-up-fade">
              <Image
                src="/huddlebooks-logo.png"
                alt="HuddleBooks"
                width={300}
                height={300}
                priority
                className="w-48 md:w-64 h-auto mix-blend-lighten"
              />
            </div>

            {/* Tagline */}
            <p className="text-white/70 text-sm md:text-base italic mb-8 animate-slide-up-fade">
              Where every dollar is validated — not just approved.
            </p>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-meadow/20 backdrop-blur-sm px-5 py-2.5 rounded-full text-meadow border border-meadow/30 text-sm font-medium mb-8 animate-slide-up-fade">
              <span className="flex h-2 w-2 rounded-full bg-meadow animate-pulse"></span>
              Built for youth hockey teams & associations
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
              Protect Team Funds.
              <br />
              Build Parent Trust.
              <br />
              <span className="text-golden">Run a Tighter Season.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl lg:text-2xl text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
              HuddleBooks validates every transaction against a parent-approved budget, giving teams, parents, and associations clear visibility into how money is actually spent — all season long.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <a
                href="#updates"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('updates')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="group px-8 py-4 bg-golden text-navy font-semibold rounded-lg hover:bg-golden/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-golden/20 w-full sm:w-auto text-center text-lg"
              >
                Get Updates
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a
                href="#demo"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300 w-full sm:w-auto text-center backdrop-blur-sm text-lg"
              >
                Request a Demo
              </a>
            </div>

            {/* Micro-copy */}
            <p className="text-white/60 text-sm max-w-2xl mx-auto">
              Pre-launch. No spam. We&apos;ll email product updates, beta access openings, and launch announcements.
            </p>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F8FAFC"/>
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-cream scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4">
                How It Works
              </h2>
              <p className="text-lg md:text-xl text-navy/70 max-w-3xl mx-auto">
                Simple, transparent financial management designed specifically for volunteer-run hockey organizations
              </p>
            </div>

            {/* Steps */}
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-golden/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-golden">
                  <span className="text-2xl font-bold text-golden">1</span>
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Approve the Budget Up Front</h3>
                <p className="text-navy/70">
                  Parents review and approve the season budget before spending begins. Everyone knows the plan — ice time, tournaments, equipment, and more.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-golden/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-golden">
                  <span className="text-2xl font-bold text-golden">2</span>
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Validate Spending Against the Budget</h3>
                <p className="text-navy/70">
                  As transactions occur, receipts and spending are logged and automatically validated against your approved budget. Catch issues early, not at season-end.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-golden/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-golden">
                  <span className="text-2xl font-bold text-golden">3</span>
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Maintain Transparency All Season</h3>
                <p className="text-navy/70">
                  Parents, treasurers, and associations see exactly how money is spent — all season long. No surprises, no guesswork, just trust.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Associations Section */}
      <section id="associations" className="py-20 lg:py-28 bg-white scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-navy/5 rounded-full text-navy font-medium text-sm mb-4">
                  For Associations
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-navy mb-6">
                  Oversight Without the Overhead
                </h2>
                <p className="text-lg text-navy/70 mb-8">
                  Monitor all your teams&apos; finances from one dashboard. Ensure compliance, catch issues early, and maintain the integrity of your association.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-meadow rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy mb-1">Real-time Dashboard</h4>
                      <p className="text-navy/70 text-sm">Track budget health across all teams at a glance</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-meadow rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy mb-1">Policy Enforcement</h4>
                      <p className="text-navy/70 text-sm">Set budget caps and approval rules automatically</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-meadow rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy mb-1">Audit-Ready Reports</h4>
                      <p className="text-navy/70 text-sm">Export comprehensive financial records for season-end</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-navy to-navy-medium p-8 rounded-2xl shadow-xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <div className="text-golden text-sm font-medium mb-2">Association Dashboard</div>
                  <div className="text-white text-2xl font-bold mb-4">12 Teams Monitored</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-white/80 text-sm">
                      <span>Teams on track</span>
                      <span className="text-meadow font-semibold">10/12</span>
                    </div>
                    <div className="flex justify-between items-center text-white/80 text-sm">
                      <span>Pending approvals</span>
                      <span className="text-golden font-semibold">4</span>
                    </div>
                    <div className="flex justify-between items-center text-white/80 text-sm">
                      <span>Total budget overseen</span>
                      <span className="text-white font-semibold">$340,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Teams Section */}
      <section id="teams" className="py-20 lg:py-28 bg-lightblue scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 bg-white p-8 rounded-2xl shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-cream rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-meadow/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-meadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-navy/60">Ice Time</div>
                        <div className="font-semibold text-navy">$8,500 / $10,000</div>
                      </div>
                    </div>
                    <div className="text-meadow text-sm font-medium">85%</div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-cream rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-golden/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-golden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-navy/60">Equipment</div>
                        <div className="font-semibold text-navy">$2,100 / $3,500</div>
                      </div>
                    </div>
                    <div className="text-meadow text-sm font-medium">60%</div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-cream rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-navy/60">Tournaments</div>
                        <div className="font-semibold text-navy">$4,200 / $6,000</div>
                      </div>
                    </div>
                    <div className="text-meadow text-sm font-medium">70%</div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="inline-block px-4 py-2 bg-navy/5 rounded-full text-navy font-medium text-sm mb-4">
                  For Teams
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-navy mb-6">
                  Simplify Team Finances
                </h2>
                <p className="text-lg text-navy/70 mb-8">
                  Stop juggling spreadsheets and shoebox receipts. HuddleBooks makes it easy for treasurers to track budgets, manage expenses, and keep parents informed.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-meadow rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy mb-1">Budget by Category</h4>
                      <p className="text-navy/70 text-sm">Ice time, equipment, tournaments — track it all separately</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-meadow rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy mb-1">Receipt Management</h4>
                      <p className="text-navy/70 text-sm">Snap photos and attach them directly to transactions</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-meadow rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy mb-1">Parent Access</h4>
                      <p className="text-navy/70 text-sm">Give families view-only access to see where their fees go</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section id="trust" className="py-20 lg:py-28 bg-white scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4">
                Trust & Security
              </h2>
              <p className="text-lg md:text-xl text-navy/70 max-w-3xl mx-auto">
                Built on industry-standard security practices to protect your team&apos;s financial data
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-navy/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-navy mb-2">Bank-Grade Security</h3>
                <p className="text-navy/70 text-sm">Data encrypted in transit and at rest</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-navy/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-bold text-navy mb-2">Audit Trail</h3>
                <p className="text-navy/70 text-sm">Complete history of all changes</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-navy/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-navy mb-2">Role-Based Access</h3>
                <p className="text-navy/70 text-sm">Control who sees and does what</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-navy/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <h3 className="font-bold text-navy mb-2">Automatic Backups</h3>
                <p className="text-navy/70 text-sm">Your data is safe and recoverable</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28 bg-cream scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-6">
              <details className="group bg-white rounded-lg shadow-sm">
                <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-navy hover:text-golden transition-colors">
                  <span>When will HuddleBooks be available?</span>
                  <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-navy/70">
                  We&apos;re currently in pre-launch development. Sign up for updates to be notified when beta access opens and when we officially launch.
                </div>
              </details>

              <details className="group bg-white rounded-lg shadow-sm">
                <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-navy hover:text-golden transition-colors">
                  <span>How much will HuddleBooks cost?</span>
                  <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-navy/70">
                  Pricing will be announced closer to launch. We&apos;re designing affordable plans for both individual teams and associations with multiple teams.
                </div>
              </details>

              <details className="group bg-white rounded-lg shadow-sm">
                <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-navy hover:text-golden transition-colors">
                  <span>Can we use this for other sports besides hockey?</span>
                  <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-navy/70">
                  Absolutely! While we&apos;re focused on hockey teams initially, HuddleBooks works for any volunteer-run youth sports organization that needs financial transparency.
                </div>
              </details>

              <details className="group bg-white rounded-lg shadow-sm">
                <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-navy hover:text-golden transition-colors">
                  <span>Do you integrate with accounting software?</span>
                  <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-navy/70">
                  Export capabilities are planned for launch. You&apos;ll be able to export transaction data to CSV/Excel for use with QuickBooks or other accounting tools.
                </div>
              </details>

              <details className="group bg-white rounded-lg shadow-sm">
                <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-navy hover:text-golden transition-colors">
                  <span>What if our team isn&apos;t tech-savvy?</span>
                  <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-navy/70">
                  HuddleBooks is designed for volunteers, not accountants. The interface is intuitive, and we&apos;ll provide training materials, tutorials, and support to help you get started.
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* Updates Signup Section */}
      <section id="updates" className="py-20 lg:py-28 bg-gradient-to-br from-navy via-navy-medium to-navy scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Get Launch Updates
            </h2>
            <p className="text-lg text-white/80 mb-10">
              Be the first to know when we open beta access and launch. No spam, just important updates.
            </p>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
              <EmailSignupForm source="updates_section" className="max-w-lg mx-auto" />
            </div>

            <p className="text-white/60 text-sm mt-6">
              We respect your inbox. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Request Section */}
      <section id="demo" className="py-20 lg:py-28 bg-white scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Request a Demo
              </h2>
              <p className="text-lg text-navy/70">
                Prefer a quick walkthrough? Request a demo and we&apos;ll reach out to schedule a personalized tour.
              </p>
            </div>

            <div className="bg-cream rounded-2xl p-8 shadow-lg">
              <DemoRequestForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <Image
              src="/huddlebooks-logo.png"
              alt="HuddleBooks"
              width={150}
              height={50}
              className="h-12 w-auto mx-auto mb-6 opacity-80"
            />
            <p className="text-white/60 text-sm mb-4">
              Professional financial controls for volunteer-run hockey organizations
            </p>
            <p className="text-white/40 text-xs">
              © {new Date().getFullYear()} HuddleBooks. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
