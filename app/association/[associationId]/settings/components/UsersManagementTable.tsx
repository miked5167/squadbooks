'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAssociationUserRole, removeAssociationUser } from '../actions'
import InviteUserDialog from './InviteUserDialog'

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
  associationId: string
}

// Available roles
const ROLES = [
  { value: 'association_admin', label: 'Admin' },
  { value: 'board_member', label: 'Board Member' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'viewer', label: 'Viewer' },
]

export default function UsersManagementTable({ users, associationId }: UsersManagementTableProps) {
  const router = useRouter()
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId)
    setMessage(null)

    try {
      await updateAssociationUserRole(userId, newRole)
      setMessage({ type: 'success', text: 'Role updated successfully!' })
      router.refresh()

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error updating role:', error)
      setMessage({ type: 'error', text: 'Failed to update role. Please try again.' })
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    setRemovingUserId(userId)
    setMessage(null)

    try {
      const result = await removeAssociationUser(userId)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        router.refresh()

        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      console.error('Error removing user:', error)
      setMessage({ type: 'error', text: 'Failed to remove user. Please try again.' })
    } finally {
      setRemovingUserId(null)
      setConfirmRemove(null)
    }
  }

  const getRoleLabel = (roleValue: string) => {
    const role = ROLES.find(r => r.value === roleValue.toLowerCase())
    return role ? role.label : roleValue
  }

  const handleInviteSuccess = () => {
    setMessage({ type: 'success', text: 'User invited successfully!' })
    router.refresh()

    // Clear success message after 3 seconds
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <>
      <InviteUserDialog
        associationId={associationId}
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        onSuccess={handleInviteSuccess}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Association Users</h2>
          <button
            onClick={() => setIsInviteDialogOpen(true)}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Invite User</span>
          </button>
        </div>

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
                <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Actions
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
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    {confirmRemove === user.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-xs text-gray-600">Remove this user?</span>
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={removingUserId === user.id}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {removingUserId === user.id ? 'Removing...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          disabled={removingUserId === user.id}
                          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(user.id)}
                        disabled={updatingUserId === user.id || removingUserId !== null}
                        className="rounded-md px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
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
            Tip: Click on a role dropdown to change a user's permissions, or use the "Remove" button to remove them from the association.
          </p>
        </div>
      )}
      </div>
    </>
  )
}
