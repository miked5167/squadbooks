'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StepRosterProps {
  teamId: string;
  onComplete: (familyCount: number) => void;
  onBack: () => void;
  onSkip: () => void;
}

interface FamilyData {
  id: string;
  familyName: string;
  primaryEmail: string;
  secondaryEmail: string;
}

export function StepRoster({ teamId, onComplete, onBack, onSkip }: StepRosterProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [families, setFamilies] = useState<FamilyData[]>([
    { id: '1', familyName: '', primaryEmail: '', secondaryEmail: '' },
  ]);

  const addFamily = () => {
    setFamilies([
      ...families,
      {
        id: Date.now().toString(),
        familyName: '',
        primaryEmail: '',
        secondaryEmail: '',
      },
    ]);
  };

  const removeFamily = (id: string) => {
    if (families.length === 1) {
      toast({
        title: 'Cannot remove',
        description: 'You need at least one family. Use "Skip for now" if you want to add families later.',
        variant: 'destructive',
      });
      return;
    }
    setFamilies(families.filter((f) => f.id !== id));
  };

  const updateFamily = (id: string, field: keyof FamilyData, value: string) => {
    setFamilies(
      families.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: at least one family with name and primary email
    const validFamilies = families.filter(
      (f) => f.familyName.trim() && f.primaryEmail.trim()
    );

    if (validFamilies.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please add at least one family with a name and email, or skip this step.',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const family of validFamilies) {
      if (!emailRegex.test(family.primaryEmail)) {
        toast({
          title: 'Invalid email',
          description: `Please enter a valid email for ${family.familyName}`,
          variant: 'destructive',
        });
        return;
      }
      if (family.secondaryEmail && !emailRegex.test(family.secondaryEmail)) {
        toast({
          title: 'Invalid secondary email',
          description: `Please enter a valid secondary email for ${family.familyName}`,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/onboarding/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, families: validFamilies }),
      });

      if (!response.ok) throw new Error('Failed to save families');

      onComplete(validFamilies.length);
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Please try again or contact support if the problem persists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validFamilyCount = families.filter(
    (f) => f.familyName.trim() && f.primaryEmail.trim()
  ).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Add your team roster</h1>
        <p className="text-muted-foreground">
          Enter family contact information. You can always add more families later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Families List */}
        <div className="space-y-4">
          {families.map((family, index) => (
            <div
              key={family.id}
              className="p-4 border rounded-lg bg-card space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Family {index + 1}
                </h3>
                {families.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFamily(family.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Family Name */}
                <div className="space-y-2">
                  <Label htmlFor={`family-name-${family.id}`}>
                    Family name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`family-name-${family.id}`}
                    placeholder="Smith Family"
                    value={family.familyName}
                    onChange={(e) =>
                      updateFamily(family.id, 'familyName', e.target.value)
                    }
                    required
                  />
                </div>

                {/* Primary Email */}
                <div className="space-y-2">
                  <Label htmlFor={`primary-email-${family.id}`}>
                    Primary email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`primary-email-${family.id}`}
                    type="email"
                    placeholder="parent@example.com"
                    value={family.primaryEmail}
                    onChange={(e) =>
                      updateFamily(family.id, 'primaryEmail', e.target.value)
                    }
                    required
                  />
                </div>

                {/* Secondary Email (Optional) */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`secondary-email-${family.id}`}>
                    Secondary email (optional)
                  </Label>
                  <Input
                    id={`secondary-email-${family.id}`}
                    type="email"
                    placeholder="parent2@example.com"
                    value={family.secondaryEmail}
                    onChange={(e) =>
                      updateFamily(family.id, 'secondaryEmail', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Another Family Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addFamily}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add another family
        </Button>

        {/* Summary */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-center">
            <span className="font-semibold">{validFamilyCount}</span>{' '}
            {validFamilyCount === 1 ? 'family' : 'families'} ready to add
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            ← Back
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="flex-1"
          >
            Skip for now
          </Button>
          <Button type="submit" className="flex-1" disabled={loading || validFamilyCount === 0}>
            {loading ? 'Saving...' : 'Continue →'}
          </Button>
        </div>
      </form>

      <p className="text-xs text-center text-muted-foreground mt-4">
        We'll use these emails to notify families about payment statuses and team updates.
      </p>
    </div>
  );
}
