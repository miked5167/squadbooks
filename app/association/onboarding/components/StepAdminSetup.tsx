'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { UserCog, ChevronLeft } from 'lucide-react';

interface StepAdminSetupProps {
  onComplete: (data: AdminSetupData) => void;
  onBack: () => void;
  initialData?: Partial<AdminSetupData>;
}

interface AdminSetupData {
  adminName: string;
  adminEmail: string;
}

interface FieldErrors {
  adminName?: string;
  adminEmail?: string;
}

export function StepAdminSetup({ onComplete, onBack, initialData }: StepAdminSetupProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState({
    adminName: initialData?.adminName || '',
    adminEmail: initialData?.adminEmail || '',
  });

  const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
    switch (field) {
      case 'adminName':
        if (!value.trim()) return 'Please enter your name';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        break;
      case 'adminEmail':
        if (!value.trim()) return 'Please enter your email';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
        break;
    }
    return undefined;
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FieldErrors = {};
    newErrors.adminName = validateField('adminName', formData.adminName);
    newErrors.adminEmail = validateField('adminEmail', formData.adminEmail);

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    onComplete(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-4">
          <UserCog className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-display-3 font-bold text-navy mb-2">
          Admin Setup
        </h1>
        <p className="text-navy/70">
          Set up the primary administrator account for your association
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Admin Name */}
            <div>
              <Label htmlFor="adminName" className="required">
                Your Name
              </Label>
              <Input
                id="adminName"
                type="text"
                value={formData.adminName}
                onChange={(e) => handleFieldChange('adminName', e.target.value)}
                placeholder="e.g., John Smith"
                className={errors.adminName ? 'border-red-500' : ''}
              />
              {errors.adminName && (
                <p className="text-sm text-red-500 mt-1">{errors.adminName}</p>
              )}
            </div>

            {/* Admin Email */}
            <div>
              <Label htmlFor="adminEmail" className="required">
                Your Email
              </Label>
              <Input
                id="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => handleFieldChange('adminEmail', e.target.value)}
                placeholder="e.g., admin@association.com"
                className={errors.adminEmail ? 'border-red-500' : ''}
              />
              {errors.adminEmail && (
                <p className="text-sm text-red-500 mt-1">{errors.adminEmail}</p>
              )}
              <p className="text-xs text-navy/60 mt-1">
                This will be your login email for the association command center
              </p>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-navy/80">
                <span className="font-semibold">Note:</span> You'll be set up as the primary
                association administrator with full access to all features. You can invite
                additional board members and auditors later from the settings page.
              </p>
            </div>

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
