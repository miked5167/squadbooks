'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Users, Building2 } from 'lucide-react';

interface StepPowerUpProps {
  teamId: string;
  teamName: string;
  onComplete: (data: { approverAdded: boolean; bankConnected: boolean }) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function StepPowerUp({ teamId, teamName, onComplete, onSkip, onBack }: StepPowerUpProps) {
  const { toast } = useToast();
  const [approverAdded, setApproverAdded] = useState(false);
  const [bankConnected, setBankConnected] = useState(false);

  const [approverData, setApproverData] = useState({
    email: '',
    name: '',
    role: 'PRESIDENT' as const,
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  const handleAddApprover = async () => {
    if (!approverData.email || !approverData.name) {
      toast({
        title: 'Missing information',
        description: 'Please enter both email and name',
        variant: 'destructive',
      });
      return;
    }

    setSendingInvite(true);

    try {
      const response = await fetch('/api/onboarding/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          teamName,
          ...approverData,
        }),
      });

      if (!response.ok) throw new Error('Failed to send invitation');

      setApproverAdded(true);
      toast({
        title: 'Invitation sent!',
        description: `We've sent an invitation to ${approverData.email}`,
      });
    } catch (error) {
      toast({
        title: 'Failed to send invitation',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleConnectBank = async () => {
    // TODO: Implement Plaid Link
    // For MVP, we can stub this and show a "Coming soon" message
    toast({
      title: 'Bank connection coming soon',
      description: "We're adding bank integration in the next update. You can add expenses manually for now.",
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Power up your team</h1>
        <p className="text-muted-foreground">
          These features are optional but highly recommended
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Add Approver */}
        <Card className="relative">
          {approverAdded && (
            <div className="absolute top-4 right-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          )}

          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Add an approver</CardTitle>
                <CardDescription className="mt-1">
                  Recommended for protection
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!approverAdded ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Two sets of eyes protect you and the team. Add your president or a board member.
                </p>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="approver-email">Email</Label>
                    <Input
                      id="approver-email"
                      type="email"
                      placeholder="president@example.com"
                      value={approverData.email}
                      onChange={(e) =>
                        setApproverData({ ...approverData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approver-name">Name</Label>
                    <Input
                      id="approver-name"
                      placeholder="John Smith"
                      value={approverData.name}
                      onChange={(e) =>
                        setApproverData({ ...approverData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approver-role">Role</Label>
                    <Select
                      value={approverData.role}
                      onValueChange={(value: 'PRESIDENT' | 'BOARD_MEMBER') =>
                        setApproverData({ ...approverData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESIDENT">
                          President (recommended)
                        </SelectItem>
                        <SelectItem value="BOARD_MEMBER">
                          Board Member
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleAddApprover}
                    disabled={sendingInvite}
                    className="w-full"
                  >
                    {sendingInvite ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="font-medium">{approverData.name} added</p>
                <p className="text-sm text-muted-foreground">
                  Invitation sent to {approverData.email}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connect Bank */}
        <Card className="relative">
          {bankConnected && (
            <div className="absolute top-4 right-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          )}

          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Connect your bank</CardTitle>
                <CardDescription className="mt-1">
                  Optional - save time later
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Automatically import transactions to save time and reduce manual entry.
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Read-only access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>We never move money</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Bank-level encryption</span>
                </div>
              </div>

              <Button
                onClick={handleConnectBank}
                variant="outline"
                className="w-full"
              >
                Connect Bank Account
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                You can always connect your bank later from Settings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
        >
          ← Back
        </Button>
        <Button
          variant="ghost"
          onClick={() => onComplete({ approverAdded, bankConnected })}
          size="lg"
        >
          I'll do this later
        </Button>
        <Button
          onClick={() => onComplete({ approverAdded, bankConnected })}
          size="lg"
        >
          Finish Setup →
        </Button>
      </div>
    </div>
  );
}
