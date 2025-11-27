'use client'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export default function Home() {
  // Helper to get the right link based on dev mode
  const getSignInLink = () => DEV_MODE ? '/dashboard' : '/sign-in'
  const getSignUpLink = () => DEV_MODE ? '/dashboard' : '/sign-up'

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-medium to-navy">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm mb-8 animate-slide-up-fade">
              <span className="flex h-2 w-2 rounded-full bg-meadow animate-pulse"></span>
              Trusted by hockey teams across North America
            </div>

            {/* Headline */}
            <h1 className="text-display-1 md:text-6xl lg:text-7xl font-bold text-white mb-6 text-balance">
              Master Your Team's Finances Together
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto text-balance">
              Simple expense tracking and budget management for sports teams and clubs. No accounting degree required.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <a
                href={getSignUpLink()}
                className="group px-8 py-4 bg-golden text-navy font-semibold rounded-lg hover:bg-golden/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-golden/20 w-full sm:w-auto text-center"
              >
                {DEV_MODE ? 'Go to Dashboard' : 'Start Free Trial'}
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a
                href={getSignInLink()}
                className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300 w-full sm:w-auto text-center backdrop-blur-sm"
              >
                {DEV_MODE ? 'Dashboard' : 'Sign In'}
              </a>
            </div>

            {/* Trust Signals */}
            <p className="text-white/60 text-sm">
              No credit card required • 30-day free trial • Cancel anytime
            </p>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#FFF9E8"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-display-2 md:text-5xl font-bold text-navy mb-4">
                Everything Your Team Needs
              </h2>
              <p className="text-lg text-navy/70 max-w-2xl mx-auto">
                Built specifically for volunteer-run teams who need simple, transparent financial management
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-lg p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-meadow/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-meadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-display-4 text-navy mb-3">Track Expenses</h3>
                <p className="text-navy/70">
                  Log every transaction with photos of receipts. Know exactly where every dollar goes.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-lg p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-golden/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-golden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-display-4 text-navy mb-3">Share Receipts</h3>
                <p className="text-navy/70">
                  Upload and share receipts instantly. Build trust through complete transparency.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-lg p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-display-4 text-navy mb-3">Budget Together</h3>
                <p className="text-navy/70">
                  Set budgets, track spending, and make financial decisions as a team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-lightblue">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-navy/60 font-semibold mb-8">Built for hockey teams and clubs</p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-navy/40">
              <span className="text-2xl font-bold">🏒</span>
              <span className="text-sm">Financial Protection</span>
              <span className="text-2xl">•</span>
              <span className="text-sm">Budget Transparency</span>
              <span className="text-2xl">•</span>
              <span className="text-sm">Team Collaboration</span>
              <span className="text-2xl">•</span>
              <span className="text-sm">Receipt Management</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-display-2 md:text-5xl font-bold text-navy mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-navy/70 mb-8">
              Join teams across North America who are building trust through transparent financial management.
            </p>
            <a
              href={getSignUpLink()}
              className="inline-block px-8 py-4 bg-golden text-navy font-semibold rounded-lg hover:bg-golden/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-golden/20"
            >
              {DEV_MODE ? 'Go to Dashboard →' : 'Start Your Free Trial →'}
            </a>
            <p className="text-navy/50 text-sm mt-4">
              30-day free trial • No credit card required
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
