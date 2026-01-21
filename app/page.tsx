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
      <section className="from-navy via-navy-medium to-navy relative overflow-hidden bg-gradient-to-br">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        <div className="relative container mx-auto px-4 pt-20 pb-32 sm:px-6 lg:px-8 lg:pt-32 lg:pb-40">
          <div className="mx-auto max-w-5xl text-center">
            {/* Logo */}
            <div className="animate-slide-up-fade mb-4 flex justify-center">
              <Image
                src="/huddlebooks-logo.png"
                alt="HuddleBooks"
                width={300}
                height={300}
                priority
                className="h-auto w-48 mix-blend-lighten md:w-64"
              />
            </div>

            {/* Tagline */}
            <p className="animate-slide-up-fade mb-8 text-sm text-white/70 italic md:text-base">
              Where every dollar is validated — not just approved.
            </p>

            {/* Badge */}
            <div className="bg-meadow/20 text-meadow border-meadow/30 animate-slide-up-fade mb-8 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium backdrop-blur-sm">
              <span className="bg-meadow flex h-2 w-2 animate-pulse rounded-full"></span>
              Built for youth hockey teams & associations
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl leading-tight font-bold text-white md:text-5xl lg:text-6xl xl:text-7xl">
              Protect Team Funds.
              <br />
              Build Parent Trust.
              <br />
              <span className="text-golden">Support League-Level Integrity Standards.</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mb-6 max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl lg:text-2xl">
              Designed for hockey association presidents and treasurers who need transparency,
              accountability, and season-long oversight—aligned with the principles outlined in the
              GTHL Integrity Action Plan.
            </p>

            {/* Supporting microcopy */}
            <p className="mx-auto mb-10 max-w-2xl text-base text-white/70 md:text-lg">
              Proactive controls without micromanaging volunteers.
            </p>

            {/* CTAs */}
            <div className="mb-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#demo"
                onClick={e => {
                  e.preventDefault()
                  document
                    .getElementById('demo')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="group bg-golden text-navy hover:bg-golden/90 shadow-golden/20 w-full rounded-lg px-8 py-4 text-center text-lg font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:w-auto"
              >
                Request a 15-Minute Demo
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
              <a
                href="#how-it-works"
                onClick={e => {
                  e.preventDefault()
                  document
                    .getElementById('how-it-works')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="w-full rounded-lg border-2 border-white/30 px-8 py-4 text-center text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 sm:w-auto"
              >
                See How It Works
              </a>
            </div>

            {/* Micro-copy */}
            <p className="mx-auto max-w-2xl text-sm text-white/60">No obligation. No hard sell.</p>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute right-0 bottom-0 left-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#F8FAFC"
            />
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-cream scroll-mt-16 py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Section Header */}
            <div className="mb-16 text-center">
              <h2 className="text-navy mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
                How It Works
              </h2>
              <p className="text-navy/70 mx-auto max-w-3xl text-lg md:text-xl">
                Simple, transparent financial governance designed for volunteer-run hockey
                associations.
              </p>
            </div>

            {/* Steps */}
            <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
              {/* Step 1 */}
              <div className="text-center">
                <div className="bg-golden/10 border-golden mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2">
                  <span className="text-golden text-2xl font-bold">1</span>
                </div>
                <h3 className="text-navy mb-3 text-xl font-bold">Approve the Budget Up Front</h3>
                <p className="text-navy/70">
                  Set expectations early with a parent-approved budget and association-defined
                  guardrails before spending begins.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="bg-golden/10 border-golden mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2">
                  <span className="text-golden text-2xl font-bold">2</span>
                </div>
                <h3 className="text-navy mb-3 text-xl font-bold">
                  Validate Spending Against the Budget
                </h3>
                <p className="text-navy/70">
                  Transactions are tracked to budget categories with receipts and audit history—so
                  drift is visible before season-end.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="bg-golden/10 border-golden mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2">
                  <span className="text-golden text-2xl font-bold">3</span>
                </div>
                <h3 className="text-navy mb-3 text-xl font-bold">
                  Maintain Transparency All Season
                </h3>
                <p className="text-navy/70">
                  Association leaders and parents can see season-wide activity without chasing
                  spreadsheets or inbox receipts.
                </p>
              </div>
            </div>

            {/* Proactive oversight tagline */}
            <p className="text-navy/60 mx-auto mt-12 max-w-2xl text-center text-sm">
              Designed for proactive oversight—not reactive investigation.
            </p>
          </div>
        </div>
      </section>

      {/* Integrity & Accountability Section */}
      <section id="integrity" className="scroll-mt-16 bg-white py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Section Header */}
            <div className="mb-12 text-center">
              <h2 className="text-navy mb-6 text-3xl font-bold md:text-4xl lg:text-5xl">
                Built for Integrity & Accountability
              </h2>
              <p className="text-navy/70 text-lg leading-relaxed md:text-xl">
                Ontario hockey continues to raise the bar on transparency and accountability.
                HuddleBooks helps associations operationalize those principles with consistent
                budgeting, documented spending, and clear oversight—aligned with the GTHL Integrity
                Action Plan.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-4">
              <div className="bg-cream flex items-start gap-4 rounded-lg p-4">
                <div className="bg-meadow mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-navy font-medium">
                    Financial transparency across teams and seasons
                  </p>
                </div>
              </div>

              <div className="bg-cream flex items-start gap-4 rounded-lg p-4">
                <div className="bg-meadow mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-navy font-medium">
                    Clear audit trails for budgets, expenses, and receipts
                  </p>
                </div>
              </div>

              <div className="bg-cream flex items-start gap-4 rounded-lg p-4">
                <div className="bg-meadow mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-navy font-medium">
                    Association-defined approval workflows and thresholds
                  </p>
                </div>
              </div>

              <div className="bg-cream flex items-start gap-4 rounded-lg p-4">
                <div className="bg-meadow mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-navy font-medium">
                    Early visibility into exceptions, policy violations, and budget drift
                  </p>
                </div>
              </div>

              <div className="bg-cream flex items-start gap-4 rounded-lg p-4">
                <div className="bg-meadow mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-navy font-medium">
                    Consistent oversight standards applied across all association teams
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Associations Section */}
      <section id="associations" className="bg-lightblue scroll-mt-16 py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="bg-navy/5 text-navy mb-4 inline-block rounded-full px-4 py-2 text-sm font-medium">
                  For Associations
                </div>
                <h2 className="text-navy mb-6 text-3xl font-bold md:text-4xl">
                  Oversight Without the Overhead
                </h2>
                <p className="text-navy/70 mb-6 text-lg">
                  Monitor all your teams&apos; finances from one dashboard. Ensure compliance, catch
                  issues early, and maintain the integrity of your association.
                </p>
                <p className="text-navy/60 mb-8 text-base italic">
                  All oversight rules are configurable by the association—supporting volunteers
                  without adding administrative burden.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-meadow mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-navy mb-1 font-semibold">Season-Long Visibility</h4>
                      <p className="text-navy/70 text-sm">
                        Track budget health across all teams at a glance, from pre-season to
                        year-end
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-meadow mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-navy mb-1 font-semibold">Association-Defined Policies</h4>
                      <p className="text-navy/70 text-sm">
                        Set budget caps, approval workflows, and governance rules that apply
                        consistently
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-meadow mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-navy mb-1 font-semibold">
                        Quiet Intervention via Alerts
                      </h4>
                      <p className="text-navy/70 text-sm">
                        Catch issues early with private notifications—no public escalation needed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="from-navy to-navy-medium rounded-2xl bg-gradient-to-br p-8 shadow-xl">
                <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                  <div className="text-golden mb-2 text-sm font-medium">Association Dashboard</div>
                  <div className="mb-4 text-2xl font-bold text-white">12 Teams Monitored</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span>Teams on track</span>
                      <span className="text-meadow font-semibold">10/12</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span>Pending approvals</span>
                      <span className="text-golden font-semibold">4</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span>Total budget overseen</span>
                      <span className="font-semibold text-white">$340,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Teams Section */}
      <section id="teams" className="bg-cream scroll-mt-16 py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="order-2 rounded-2xl bg-white p-8 shadow-xl lg:order-1">
                <div className="space-y-4">
                  <div className="bg-cream flex items-center justify-between rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-meadow/20 flex h-10 w-10 items-center justify-center rounded-lg">
                        <svg
                          className="text-meadow h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-navy/60 text-sm">Ice Time</div>
                        <div className="text-navy font-semibold">$8,500 / $10,000</div>
                      </div>
                    </div>
                    <div className="text-meadow text-sm font-medium">85%</div>
                  </div>

                  <div className="bg-cream flex items-center justify-between rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-golden/20 flex h-10 w-10 items-center justify-center rounded-lg">
                        <svg
                          className="text-golden h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-navy/60 text-sm">Equipment</div>
                        <div className="text-navy font-semibold">$2,100 / $3,500</div>
                      </div>
                    </div>
                    <div className="text-meadow text-sm font-medium">60%</div>
                  </div>

                  <div className="bg-cream flex items-center justify-between rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-navy/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <svg
                          className="text-navy h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-navy/60 text-sm">Tournaments</div>
                        <div className="text-navy font-semibold">$4,200 / $6,000</div>
                      </div>
                    </div>
                    <div className="text-meadow text-sm font-medium">70%</div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="bg-navy/5 text-navy mb-4 inline-block rounded-full px-4 py-2 text-sm font-medium">
                  For Teams
                </div>
                <h2 className="text-navy mb-6 text-3xl font-bold md:text-4xl">
                  Simplify Team Finances
                </h2>
                <p className="text-navy/60 mb-4 text-base italic">
                  Teams get simple tools; associations get consistent standards.
                </p>
                <p className="text-navy/70 mb-8 text-lg">
                  Stop juggling spreadsheets and shoebox receipts. HuddleBooks makes it easy for
                  treasurers to track budgets, manage expenses, and keep parents informed.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-meadow mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-navy mb-1 font-semibold">Standardized Categories</h4>
                      <p className="text-navy/70 text-sm">
                        Use consistent budget categories across all teams—ice time, equipment,
                        tournaments, and more
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-meadow mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-navy mb-1 font-semibold">
                        Receipts Attached at Transaction Level
                      </h4>
                      <p className="text-navy/70 text-sm">
                        Snap photos and attach receipts directly to each transaction—no more shoebox
                        filing
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-meadow mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-navy mb-1 font-semibold">
                        Parent Visibility That Reduces Disputes
                      </h4>
                      <p className="text-navy/70 text-sm">
                        Give families view-only access to budgets and spending—transparency that
                        prevents conflicts
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section id="trust" className="scroll-mt-16 bg-white py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-navy mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
                Trust & Security
              </h2>
              <p className="text-navy/70 mx-auto mb-3 max-w-3xl text-lg md:text-xl">
                Security for your data—and accountability for your process.
              </p>
              <p className="text-navy/60 mx-auto max-w-3xl text-base">
                Built on industry-standard security practices to protect your team&apos;s financial
                data
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="bg-navy/5 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
                  <svg
                    className="text-navy h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-navy mb-2 font-bold">Bank-Grade Security</h3>
                <p className="text-navy/70 text-sm">Data encrypted in transit and at rest</p>
              </div>

              <div className="text-center">
                <div className="bg-navy/5 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
                  <svg
                    className="text-navy h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-navy mb-2 font-bold">Audit Trail</h3>
                <p className="text-navy/70 text-sm">Complete history of all changes</p>
              </div>

              <div className="text-center">
                <div className="bg-navy/5 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
                  <svg
                    className="text-navy h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-navy mb-2 font-bold">Role-Based Access</h3>
                <p className="text-navy/70 text-sm">Control who sees and does what</p>
              </div>

              <div className="text-center">
                <div className="bg-navy/5 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
                  <svg
                    className="text-navy h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                </div>
                <h3 className="text-navy mb-2 font-bold">Automatic Backups</h3>
                <p className="text-navy/70 text-sm">Your data is safe and recoverable</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Credibility Section */}
      <section id="credibility" className="bg-cream scroll-mt-16 py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <h2 className="text-navy mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">
                Designed for Volunteer-Run Hockey
              </h2>
              <p className="text-navy/70 text-base md:text-lg">
                Built in consultation with Ontario hockey executives and volunteer treasurers.
              </p>
            </div>

            {/* Testimonial Quote */}
            <div className="border-golden rounded-xl border-l-4 bg-white p-8 shadow-md">
              <div className="flex items-start gap-4">
                <svg
                  className="text-golden/30 h-8 w-8 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <div>
                  <p className="text-navy mb-4 text-lg italic">
                    This is the first time we&apos;ve had real visibility without chasing people for
                    receipts.
                  </p>
                  <p className="text-navy/60 text-sm font-medium">— Association Treasurer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="scroll-mt-16 bg-white py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="text-navy mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-6">
              <details className="group rounded-lg bg-white shadow-sm">
                <summary className="text-navy hover:text-golden flex cursor-pointer items-center justify-between p-6 font-semibold transition-colors">
                  <span>Is HuddleBooks required by the GTHL or OMHA?</span>
                  <svg
                    className="h-5 w-5 transform transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="text-navy/70 px-6 pb-6">
                  No. HuddleBooks is an independent platform designed to help associations implement
                  best practices for transparency and accountability. Many associations choose tools
                  like HuddleBooks to support governance principles outlined in initiatives such as
                  the GTHL Integrity Action Plan.
                </div>
              </details>

              <details className="group rounded-lg bg-white shadow-sm">
                <summary className="text-navy hover:text-golden flex cursor-pointer items-center justify-between p-6 font-semibold transition-colors">
                  <span>Do teams need to change banks or accounting software?</span>
                  <svg
                    className="h-5 w-5 transform transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="text-navy/70 px-6 pb-6">
                  No. HuddleBooks is designed to fit alongside existing banking and accounting
                  processes. Teams can continue using their current bank accounts and workflows
                  while HuddleBooks provides standardized budgeting, receipt capture, audit history,
                  and oversight reporting.
                </div>
              </details>

              <details className="group rounded-lg bg-white shadow-sm">
                <summary className="text-navy hover:text-golden flex cursor-pointer items-center justify-between p-6 font-semibold transition-colors">
                  <span>Does this mean the association is policing teams?</span>
                  <svg
                    className="h-5 w-5 transform transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="text-navy/70 px-6 pb-6">
                  Not at all. HuddleBooks focuses on clarity and consistency, so expectations are
                  set early and visibility is available when needed. Most associations use it to
                  reduce escalations—by catching missing receipts or budget drift early—without
                  micromanaging volunteers.
                </div>
              </details>

              <details className="group rounded-lg bg-white shadow-sm">
                <summary className="text-navy hover:text-golden flex cursor-pointer items-center justify-between p-6 font-semibold transition-colors">
                  <span>When do receipts need to be attached?</span>
                  <svg
                    className="h-5 w-5 transform transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="text-navy/70 px-6 pb-6">
                  Associations can set a policy requiring receipts at the time of transaction entry
                  or within a defined timeframe. HuddleBooks flags missing receipts automatically
                  and surfaces them in dashboards and reports, so teams can resolve gaps before
                  month-end or season-end.
                </div>
              </details>

              <details className="group rounded-lg bg-white shadow-sm">
                <summary className="text-navy hover:text-golden flex cursor-pointer items-center justify-between p-6 font-semibold transition-colors">
                  <span>When will HuddleBooks be available?</span>
                  <svg
                    className="h-5 w-5 transform transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="text-navy/70 px-6 pb-6">
                  We&apos;re currently in pre-launch development. Sign up for updates to be notified
                  when beta access opens and when we officially launch.
                </div>
              </details>

              <details className="group rounded-lg bg-white shadow-sm">
                <summary className="text-navy hover:text-golden flex cursor-pointer items-center justify-between p-6 font-semibold transition-colors">
                  <span>How much will HuddleBooks cost?</span>
                  <svg
                    className="h-5 w-5 transform transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="text-navy/70 px-6 pb-6">
                  Pricing will be announced closer to launch. We&apos;re designing affordable plans
                  for both individual teams and associations with multiple teams.
                </div>
              </details>

              <details className="group rounded-lg bg-white shadow-sm">
                <summary className="text-navy hover:text-golden flex cursor-pointer items-center justify-between p-6 font-semibold transition-colors">
                  <span>What if our team isn&apos;t tech-savvy?</span>
                  <svg
                    className="h-5 w-5 transform transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="text-navy/70 px-6 pb-6">
                  HuddleBooks is designed for volunteers, not accountants. The interface is
                  intuitive, and we&apos;ll provide training materials, tutorials, and support to
                  help you get started.
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* Updates Signup Section */}
      <section
        id="updates"
        className="from-navy via-navy-medium to-navy scroll-mt-16 bg-gradient-to-br py-16 lg:py-20"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">Get Launch Updates</h2>
            <p className="mb-8 text-base text-white/70">
              Be the first to know when we open beta access and launch. No spam, just important
              updates.
            </p>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md">
              <EmailSignupForm source="updates_section" className="mx-auto max-w-lg" />
            </div>

            <p className="mt-6 text-sm text-white/60">
              We respect your inbox. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Request Section */}
      <section id="demo" className="scroll-mt-16 bg-white py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <h2 className="text-navy mb-4 text-3xl font-bold md:text-4xl">Request a Demo</h2>
              <p className="text-navy/70 mb-3 text-lg">
                Prefer a quick walkthrough? Request a demo and we&apos;ll reach out to schedule a
                personalized tour.
              </p>
              <p className="text-navy/60 text-base italic">
                Ideal for association presidents, treasurers, and board members. We&apos;ll tailor
                the walkthrough to your governance model.
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
          <div className="mx-auto max-w-6xl text-center">
            <Image
              src="/huddlebooks-logo.png"
              alt="HuddleBooks"
              width={150}
              height={50}
              className="mx-auto mb-6 h-12 w-auto opacity-80"
            />
            <p className="mb-4 text-sm text-white/60">
              Professional financial controls for volunteer-run hockey organizations
            </p>
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} HuddleBooks. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
