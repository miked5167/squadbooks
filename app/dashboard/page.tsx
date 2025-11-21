import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Squadbooks</h1>
            <nav className="flex gap-6">
              <Link href="/dashboard" className="text-blue-600 font-medium">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-gray-600 hover:text-gray-900">
                Transactions
              </Link>
              <Link href="/budget" className="text-gray-600 hover:text-gray-900">
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Welcome to your team financial dashboard</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/expenses/new"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-xl">💸</span>
              </div>
              <h3 className="text-lg font-semibold">Add Expense</h3>
            </div>
            <p className="text-gray-600 text-sm">Record a new team expense with receipt</p>
          </Link>

          <Link
            href="/payments/new"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold">Add Payment</h3>
            </div>
            <p className="text-gray-600 text-sm">Record income or fundraiser revenue</p>
          </Link>

          <Link
            href="/transactions"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold">View Transactions</h3>
            </div>
            <p className="text-gray-600 text-sm">See all team financial activity</p>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-gray-900">$10,000</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Spent</p>
            <p className="text-2xl font-bold text-red-600">$0</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Remaining</p>
            <p className="text-2xl font-bold text-green-600">$10,000</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">0</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="text-center py-12 text-gray-500">
            <p>No transactions yet</p>
            <p className="text-sm mt-2">Create your first expense or payment to get started</p>
          </div>
        </div>
      </main>
    </div>
  )
}
