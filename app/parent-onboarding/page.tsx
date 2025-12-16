'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ValidationData {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber?: string;
    position?: string;
    dateOfBirth?: string;
  };
  family: {
    id: string;
    familyName: string;
    primaryEmail: string;
    primaryName?: string;
    primaryPhone?: string;
    secondaryName?: string;
    secondaryEmail?: string;
    secondaryPhone?: string;
    emergencyContactName?: string;
    emergencyContactRelation?: string;
    emergencyContactPhone?: string;
    medicalNotes?: string;
    allergies?: string;
    address?: string;
  } | null;
  team: {
    id: string;
    name: string;
    season: string;
    logoUrl?: string;
    associationName?: string;
  };
  invite: {
    id: string;
    expiresAt: string;
  };
}

export default function ParentOnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [validating, setValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<ValidationData | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    primaryName: '',
    primaryEmail: '',
    primaryPhone: '',
    secondaryName: '',
    secondaryEmail: '',
    secondaryPhone: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    medicalNotes: '',
    allergies: '',
    address: '',
  });

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setValidationError('No invitation token provided. Please check your email for the correct link.');
        setValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/parent-invites/validate?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (!response.ok || !data.valid) {
          setValidationError(data.message || 'This invitation is not valid.');
          setValidating(false);
          return;
        }

        setValidationData(data.data);

        // Pre-fill form with existing family data
        if (data.data.family) {
          setFormData({
            primaryName: data.data.family.primaryName || '',
            primaryEmail: data.data.family.primaryEmail || '',
            primaryPhone: data.data.family.primaryPhone || '',
            secondaryName: data.data.family.secondaryName || '',
            secondaryEmail: data.data.family.secondaryEmail || '',
            secondaryPhone: data.data.family.secondaryPhone || '',
            emergencyContactName: data.data.family.emergencyContactName || '',
            emergencyContactRelation: data.data.family.emergencyContactRelation || '',
            emergencyContactPhone: data.data.family.emergencyContactPhone || '',
            medicalNotes: data.data.family.medicalNotes || '',
            allergies: data.data.family.allergies || '',
            address: data.data.family.address || '',
          });
        }

        setValidating(false);
      } catch (error) {
        console.error('Error validating token:', error);
        setValidationError('Unable to validate invitation. Please try again or contact your team administrator.');
        setValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/parent-invites/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          familyData: formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (validationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
            <p className="mt-4 text-sm text-gray-600">
              If you believe this is an error, please contact your team administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Registration Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Thank you for completing your family information for{' '}
                <strong>
                  {validationData?.player.firstName} {validationData?.player.lastName}
                </strong>
                .
              </p>
              <p className="text-sm text-gray-600">
                Your information has been securely saved and will be used for team management and emergency purposes only.
              </p>
              <p className="text-sm text-gray-600">
                You&apos;ll receive communication from <strong>{validationData?.team.name}</strong> at the email address you provided.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {validationData?.team.logoUrl && (
            <img
              src={validationData.team.logoUrl}
              alt={validationData.team.name}
              className="h-20 w-20 mx-auto mb-4 rounded-lg object-contain"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to {validationData?.team.name}
          </h1>
          <p className="text-gray-600">
            {validationData?.team.season} Season
            {validationData?.team.associationName && ` • ${validationData.team.associationName}`}
          </p>
        </div>

        {/* Player Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Player Information</CardTitle>
            <CardDescription>
              Complete the registration for your player
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-semibold">
                  {validationData?.player.firstName} {validationData?.player.lastName}
                </p>
              </div>
              {validationData?.player.jerseyNumber && (
                <div>
                  <span className="text-gray-600">Jersey:</span>
                  <p className="font-semibold">#{validationData.player.jerseyNumber}</p>
                </div>
              )}
              {validationData?.player.position && (
                <div>
                  <span className="text-gray-600">Position:</span>
                  <p className="font-semibold">{validationData.player.position}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Primary Guardian Information</CardTitle>
              <CardDescription>
                Main contact for team communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryName">Full Name</Label>
                  <Input
                    id="primaryName"
                    value={formData.primaryName}
                    onChange={(e) => handleInputChange('primaryName', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="primaryEmail">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="primaryEmail"
                    type="email"
                    required
                    value={formData.primaryEmail}
                    onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
                    placeholder="john.doe@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="primaryPhone">Phone Number</Label>
                <Input
                  id="primaryPhone"
                  type="tel"
                  value={formData.primaryPhone}
                  onChange={(e) => handleInputChange('primaryPhone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Secondary Guardian (Optional)</CardTitle>
              <CardDescription>
                Additional family contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="secondaryName">Full Name</Label>
                  <Input
                    id="secondaryName"
                    value={formData.secondaryName}
                    onChange={(e) => handleInputChange('secondaryName', e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="secondaryEmail">Email</Label>
                  <Input
                    id="secondaryEmail"
                    type="email"
                    value={formData.secondaryEmail}
                    onChange={(e) => handleInputChange('secondaryEmail', e.target.value)}
                    placeholder="jane.doe@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryPhone">Phone Number</Label>
                <Input
                  id="secondaryPhone"
                  type="tel"
                  value={formData.secondaryPhone}
                  onChange={(e) => handleInputChange('secondaryPhone', e.target.value)}
                  placeholder="(555) 987-6543"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>
                Contact in case of emergency when guardians are unavailable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContactName">Full Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    placeholder="Emergency Contact Name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactRelation">Relationship</Label>
                  <Input
                    id="emergencyContactRelation"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                    placeholder="Grandmother, Uncle, etc."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone">Phone Number</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>
                Important health information for player safety
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  placeholder="List any known allergies (food, medication, environmental, etc.)"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="medicalNotes">Medical Notes</Label>
                <Textarea
                  id="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={(e) => handleInputChange('medicalNotes', e.target.value)}
                  placeholder="Any other medical conditions, medications, or health concerns coaches should be aware of"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Address (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="address">Home Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Street address, city, province/state, postal/zip code"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {submitError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={submitting} className="w-full" size="lg">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Complete Registration'
            )}
          </Button>

          <p className="text-xs text-center text-gray-500 mt-4">
            Your information is kept secure and will only be used for team management purposes.
          </p>
        </form>
      </div>
    </div>
  );
}
