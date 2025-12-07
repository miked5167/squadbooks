'use client'

import { useState } from 'react'
import { updateAssociationUserRole } from '../actions'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  lastLoginAt: Date | null
  createdAt: Date
}

interface UsersManagementTableProps {
  users: User[]
}

// Available roles
const ROLES = [
  { value: 'association_admin', label: 'Admin' },
  { value: 'board_member', label: 'Board Member' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'viewer', label: 'Viewer' },
]

export default function UsersManagementTable({ users }: UsersManagementTableProps) {
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId)
    setMessage(null)

    try {
      await updateAssociationUserRole(userId, newRole)
      setMessage({ type: 'success', text: 'Role updated successfully!' })

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error updating role:', error)
      setMessage({ type: 'error', text: 'Failed to update role. Please try again.' })
    } finally {
      setUpdatingUserId(null)
    }
  }

  const getRoleLabel = (roleValue: string) => {
    const role = ROLES.find(r => r.value === roleValue.toLowerCase())
    return role ? role.label : roleValue
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Association Users</h2>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 rounded-md p-3 ${
            message.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <svg
            className="mx-auto mb-4 h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <p className="mb-1 text-lg font-medium text-gray-900">No association users yet</p>
          <p className="text-sm text-gray-500">
            Users will be added when they are invited to the association
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Last Login
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Member Since
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || <span className="text-gray-400 italic">No name</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <select
                      value={user.role.toLowerCase()}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      disabled={updatingUserId === user.id}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      {ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {user.lastLoginAt ? (
                        new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })
                      ) : (
                        <span className="text-gray-400 italic">Never</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Note */}
      {users.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">
            Note: User invitations and role management will be expanded in future releases.
          </p>
        </div>
      )}
    </div>
  )
}
