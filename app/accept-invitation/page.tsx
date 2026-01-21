'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Users } from 'lucide-react';

interface InvitationData {
  email: string;
  name: string;
  role: string;
  team: {
    id: string;
    name: string;
    level: string;
    season: string;
  };
}

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch invitation details
  useEffect(() => {
    if (!token) {
      setError('Missing invitation token');
      setLoading(false);
      return;
    }

    async function fetchInvitation() {
      try {
        const response = await fetch(`/api/accept-invitation?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Invalid invitation');
          return;
        }

        setInvitation(data.invitation);
      } catch (err) {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [token]);

  // Auto-accept if user is signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && invitation && !success && !accepting) {
      handleAccept();
    }
  }, [isLoaded, isSignedIn, invitation, success, accepting]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);

    try {
      const response = await fetch('/api/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to accept invitation');
        return;
      }

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle>Invalid Invitation</CardTitle>
                <CardDescription className="mt-1">
                  This invitation cannot be used
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="mt-6 text-center">
              <Button onClick={() => router.push('/')} variant="outline">
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Welcome to the team!</CardTitle>
                <CardDescription className="mt-1">
                  You&apos;ve successfully joined {invitation?.team.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Redirecting you to the dashboard...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  // Show invitation details and sign in/sign up options
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>You&apos;re invited!</CardTitle>
                <CardDescription className="mt-1">
                  Join {invitation.team.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Team</span>
                <span className="text-sm font-medium">{invitation.team.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Season</span>
                <span className="text-sm font-medium">{invitation.team.season}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Your role</span>
                <span className="text-sm font-medium">{getRoleLabel(invitation.role)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Invited as</span>
                <span className="text-sm font-medium">{invitation.email}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Sign in or create an account to accept this invitation
              </p>

              <div className="space-y-3">
                <SignInButton mode="modal" redirectUrl={`/accept-invitation?token=${token}`}>
                  <Button className="w-full" variant="outline">
                    Sign In
                  </Button>
                </SignInButton>

                <SignUpButton mode="modal" redirectUrl={`/accept-invitation?token=${token}`}>
                  <Button className="w-full">
                    Create Account
                  </Button>
                </SignUpButton>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is signed in, show accepting state
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Accepting invitation...</CardTitle>
              <CardDescription className="mt-1">
                Please wait while we add you to the team
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Joining {invitation.team.name}...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    PRESIDENT: 'President',
    BOARD_MEMBER: 'Board Member',
    TREASURER: 'Treasurer',
    ASSISTANT_TREASURER: 'Assistant Treasurer',
    PARENT: 'Parent',
    AUDITOR: 'Auditor',
  };
  return labels[role] || role;
}
