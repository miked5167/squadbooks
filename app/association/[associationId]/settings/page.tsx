import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAssociationSettings } from './actions'
import AssociationSettingsForm from './components/AssociationSettingsForm'
import UsersManagementTable from './components/UsersManagementTable'
import ReceiptPolicyForm from './components/ReceiptPolicyForm'
import { isDemoMode } from '@/app/lib/demoMode'

interface PageProps {
  params: Promise<{
    associationId: string
  }>
}

export default async function AssociationSettingsPage({ params }: PageProps) {
  const { associationId } = await params

  let data
  try {
    data = await getAssociationSettings(associationId)
  } catch (error) {
    console.error('Error loading association settings:', error)
    notFound()
  }

  const { association, users } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Breadcrumbs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link
                  href={`/association/${associationId}/overview`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Overview
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link
                  href={`/association/${associationId}/alerts`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Alerts
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link
                  href={`/association/${associationId}/financials`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Financials
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="font-medium text-gray-900">Settings</li>
            </ol>
          </nav>

          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your association details and user permissions
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="mx-auto max-w-7xl px-8 py-8">
        {/* Demo Mode Banner */}
        {isDemoMode() && (
          <div className="mb-4 rounded-md border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-700">
            Demo mode is enabled. Changes to settings are not persisted.
          </div>
        )}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column - Association Details */}
          <div>
            <AssociationSettingsForm association={association} associationId={associationId} />
          </div>

          {/* Right Column - Users & Roles */}
          <div>
            <UsersManagementTable users={users} associationId={associationId} />
          </div>
        </div>

        {/* Receipt Policy Section - Full Width */}
        <div className="mt-8">
          <ReceiptPolicyForm associationId={associationId} />
        </div>
      </div>
    </div>
  )
}
