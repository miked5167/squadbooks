import Link from 'next/link'

export default function BudgetPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Squadbooks</h1>
            <nav className="flex gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-gray-600 hover:text-gray-900">
                Transactions
              </Link>
              <Link href="/budget" className="text-blue-600 font-medium">
                Budget
              </Link>
              <Link href="/approvals" className="text-gray-600 hover:text-gray-900">
                Approvals
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Budget</h2>
          <p className="text-gray-600">Track budget allocations and spending</p>
        </div>

        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Budget tracking coming soon</h3>
          <p className="text-gray-600">This feature will be available in Phase 2</p>
        </div>
      </main>
    </div>
  )
}
