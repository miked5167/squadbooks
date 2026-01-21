/**
 * Users & Roles Management Page
 * Manage team users, roles, and access (Treasurer only)
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, UserPlus, Shield, Ban, CheckCircle } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  TREASURER: 'Treasurer',
  ASSISTANT_TREASURER: 'Assistant Treasurer',
  PRESIDENT: 'President',
  BOARD_MEMBER: 'Board Member',
  PARENT: 'Parent',
  AUDITOR: 'Auditor',
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  TREASURER: 'Full access to all settings and financial operations',
  ASSISTANT_TREASURER: 'Can approve transactions and manage budget, limited settings access',
  PRESIDENT: 'Can view reports and approve transactions',
  BOARD_MEMBER: 'Can view reports and submit expenses',
  PARENT: 'Can view their own transactions and submit expenses',
  AUDITOR: 'Read-only access to audit logs and reports',
}

export default function UsersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('PARENT')

  // Role change state
  const [newRole, setNewRole] = useState('')

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await fetch('/api/settings/users')
      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await res.json()
      setUsers(data.users)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle invite user
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/settings/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to invite user')
      }

      toast({
        title: 'Success',
        description: 'User invited successfully',
      })

      setInviteDialogOpen(false)
      setInviteEmail('')
      setInviteName('')
      setInviteRole('PARENT')
      fetchUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite user',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle role change
  async function handleRoleChange() {
    if (!selectedUser) return

    setSubmitting(true)

    try {
      const res = await fetch(`/api/settings/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update role')
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      })

      setRoleDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle deactivate/reactivate
  async function handleToggleActive() {
    if (!selectedUser) return

    setSubmitting(true)

    try {
      const res = await fetch(`/api/settings/users/${selectedUser.id}/deactivate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !selectedUser.isActive }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update user status')
      }

      toast({
        title: 'Success',
        description: `User ${selectedUser.isActive ? 'deactivated' : 'activated'} successfully`,
      })

      setDeactivateDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-navy">Users & Roles</h2>
              <p className="text-sm text-navy/60 mt-1">
                Manage team members and their access levels
              </p>
            </div>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Users List */}
        <div className="divide-y divide-gray-200">
          {users.map((user) => (
            <div
              key={user.id}
              className={`p-6 ${!user.isActive ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-navy">{user.name}</h3>
                    {!user.isActive && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-navy/60 mb-2">{user.email}</p>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-navy/40" />
                    <span className="text-sm font-medium text-navy">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </div>
                  <p className="text-xs text-navy/50 mt-1">
                    {ROLE_DESCRIPTIONS[user.role]}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user)
                      setNewRole(user.role)
                      setRoleDialogOpen(true)
                    }}
                  >
                    Change Role
                  </Button>
                  <Button
                    variant={user.isActive ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user)
                      setDeactivateDialogOpen(true)
                    }}
                  >
                    {user.isActive ? (
                      <>
                        <Ban className="w-4 h-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-navy/60">No users found</p>
          </div>
        )}
      </div>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation to join your team. They'll receive an email with
              instructions to create their account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="inviteEmail">Email Address *</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="inviteName">Full Name *</Label>
                <Input
                  id="inviteName"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="inviteRole">Role *</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="inviteRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARENT">Parent</SelectItem>
                    <SelectItem value="BOARD_MEMBER">Board Member</SelectItem>
                    <SelectItem value="PRESIDENT">President</SelectItem>
                    <SelectItem value="ASSISTANT_TREASURER">
                      Assistant Treasurer
                    </SelectItem>
                    <SelectItem value="AUDITOR">Auditor</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-navy/60 mt-1">
                  {ROLE_DESCRIPTIONS[inviteRole]}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update {selectedUser?.name}'s access level
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newRole">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="newRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="BOARD_MEMBER">Board Member</SelectItem>
                  <SelectItem value="PRESIDENT">President</SelectItem>
                  <SelectItem value="ASSISTANT_TREASURER">
                    Assistant Treasurer
                  </SelectItem>
                  <SelectItem value="TREASURER">Treasurer</SelectItem>
                  <SelectItem value="AUDITOR">Auditor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-navy/60 mt-1">
                {ROLE_DESCRIPTIONS[newRole]}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Activate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.isActive ? 'Deactivate User' : 'Activate User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.isActive ? (
                <>
                  Are you sure you want to deactivate <strong>{selectedUser.name}</strong>?
                  They will no longer be able to access the system.
                </>
              ) : (
                <>
                  Are you sure you want to activate <strong>{selectedUser?.name}</strong>?
                  They will regain access to the system with their current role.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedUser?.isActive ? (
                'Deactivate'
              ) : (
                'Activate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
