'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, ChevronLeft, Plus, Trash2 } from 'lucide-react';

interface StepBoardMembersProps {
  onComplete: (data: BoardMembersData) => void;
  onBack: () => void;
  initialData?: Partial<BoardMembersData>;
}

export interface BoardMember {
  name: string;
  email: string;
  role: string;
}

interface BoardMembersData {
  boardMembers: BoardMember[];
}

const ROLES = [
  { value: 'board_member', label: 'Board Member' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'viewer', label: 'Viewer' },
];

export function StepBoardMembers({
  onComplete,
  onBack,
  initialData,
}: StepBoardMembersProps) {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>(
    initialData?.boardMembers || []
  );

  const addBoardMember = () => {
    setBoardMembers([
      ...boardMembers,
      { name: '', email: '', role: 'board_member' },
    ]);
  };

  const removeBoardMember = (index: number) => {
    setBoardMembers(boardMembers.filter((_, i) => i !== index));
  };

  const updateBoardMember = (index: number, field: keyof BoardMember, value: string) => {
    const updated = [...boardMembers];
    updated[index] = { ...updated[index], [field]: value };
    setBoardMembers(updated);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty members and validate
    const validMembers = boardMembers.filter(
      (member) => member.name.trim() && member.email.trim()
    );

    // Validate emails
    for (const member of validMembers) {
      if (!validateEmail(member.email)) {
        alert(`Invalid email address: ${member.email}`);
        return;
      }
    }

    onComplete({ boardMembers: validMembers });
  };

  const handleSkip = () => {
    onComplete({ boardMembers: [] });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-display-3 font-bold text-navy mb-2">
          Invite Board Members
        </h1>
        <p className="text-navy/70">
          Optional: Add other administrators, auditors, or board members to your association
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Board Members List */}
            {boardMembers.length > 0 && (
              <div className="space-y-4">
                {boardMembers.map((member, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeBoardMember(index)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-3 pr-8">
                      <div>
                        <Label htmlFor={`name-${index}`}>Name</Label>
                        <Input
                          id={`name-${index}`}
                          type="text"
                          value={member.name}
                          onChange={(e) =>
                            updateBoardMember(index, 'name', e.target.value)
                          }
                          placeholder="e.g., Jane Smith"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`email-${index}`}>Email</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          value={member.email}
                          onChange={(e) =>
                            updateBoardMember(index, 'email', e.target.value)
                          }
                          placeholder="e.g., jane@example.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`role-${index}`}>Role</Label>
                        <Select
                          value={member.role}
                          onValueChange={(value) =>
                            updateBoardMember(index, 'role', value)
                          }
                        >
                          <SelectTrigger id={`role-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Member Button */}
            <Button
              type="button"
              variant="outline"
              onClick={addBoardMember}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Board Member
            </Button>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-navy/80">
                <span className="font-semibold">Note:</span> You can add board members, auditors, or other administrators here.
                They will receive access to the association command center based on their assigned role.
                You can also add or remove users later from the Settings page.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-32"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button type="submit" size="lg" className="flex-1">
                Continue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
