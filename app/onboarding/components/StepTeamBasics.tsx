'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface StepTeamBasicsProps {
  onComplete: (data: TeamBasicsData) => void;
  initialData?: Partial<TeamBasicsData>;
}

interface TeamBasicsData {
  teamId: string;
  name: string;
  teamType: string;
  ageDivision: string;
  competitiveLevel: string;
  season: string;
}

interface FieldErrors {
  name?: string;
  teamType?: string;
  ageDivision?: string;
  competitiveLevel?: string;
  season?: string;
}

export function StepTeamBasics({ onComplete, initialData }: StepTeamBasicsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    teamType: initialData?.teamType || '',
    ageDivision: initialData?.ageDivision || '',
    competitiveLevel: initialData?.competitiveLevel || '',
    season: initialData?.season || getCurrentSeason(),
  });

  // Only render selects after client mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Please enter your team name';
        if (value.trim().length < 3) return 'Team name must be at least 3 characters';
        if (value.trim().length > 100) return 'Team name must be less than 100 characters';
        break;
      case 'teamType':
        if (!value) return 'Please select your team type';
        break;
      case 'ageDivision':
        if (!value) return 'Please select your age division';
        break;
      case 'competitiveLevel':
        if (!value) return 'Please select your competitive level';
        break;
      case 'season':
        if (!value.trim()) return 'Please enter the season';
        if (!/^\d{4}-\d{4}$/.test(value.trim())) return 'Season should be in format: 2024-2025';
        break;
    }
    return undefined;
  };

  // Auto-select competitive level based on team type
  useEffect(() => {
    if (formData.teamType === 'HOUSE_LEAGUE') {
      setFormData(prev => ({ ...prev, competitiveLevel: 'HOUSE_RECREATIONAL' }));
    } else if (formData.teamType === 'ADULT_RECREATIONAL') {
      setFormData(prev => ({ ...prev, competitiveLevel: 'NOT_APPLICABLE' }));
    }
  }, [formData.teamType]);

  const handleFieldChange = (field: keyof FieldErrors, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleFieldBlur = (field: keyof FieldErrors, value: string) => {
    const error = validateField(field, value);
    if (error) {
      setErrors({ ...errors, [field]: error });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FieldErrors = {
      name: validateField('name', formData.name),
      teamType: validateField('teamType', formData.teamType),
      ageDivision: validateField('ageDivision', formData.ageDivision),
      competitiveLevel: validateField('competitiveLevel', formData.competitiveLevel),
      season: validateField('season', formData.season),
    };

    // Filter out undefined errors
    const hasErrors = Object.values(newErrors).some(error => error !== undefined);

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // If we already have a teamId, we're editing (came back from step 2)
    // Just proceed without creating a new team
    if (initialData?.teamId) {
      onComplete({
        teamId: initialData.teamId,
        ...formData,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/onboarding/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: user?.primaryEmailAddress?.emailAddress || 'user@example.com',
          userName: user?.fullName || user?.firstName || 'User',
        }),
      });

      if (!response.ok) throw new Error('Failed to create team');

      const data = await response.json();

      onComplete({
        teamId: data.team.id,
        ...formData,
      });

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-golden mb-2">Step 1 · Team basics</p>
          <h1 className="text-3xl font-bold tracking-tight mb-3 text-navy">Let's set up your team</h1>
          <p className="text-base text-navy/70 leading-relaxed">
            We'll use this information to customize your budget categories and reports
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-navy">Progress</span>
            <span className="text-golden font-medium">25% complete</span>
          </div>
          <Progress value={25} className="h-2" />
        </div>
      </div>

      {/* Form Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Team name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Newmarket Storm U13 AA"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                onBlur={(e) => handleFieldBlur('name', e.target.value)}
                className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                autoFocus
              />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  This is how your team appears on reports and invoices
                </p>
              )}
            </div>

            {/* Team Type */}
            <div className="space-y-1.5">
              <Label htmlFor="teamType" className="text-sm font-medium">
                Team type <span className="text-destructive">*</span>
              </Label>
              {mounted ? (
                <Select
                  value={formData.teamType}
                  onValueChange={(value) => handleFieldChange('teamType', value)}
                >
                  <SelectTrigger className={errors.teamType ? 'border-destructive focus-visible:ring-destructive' : ''}>
                    <SelectValue placeholder="Select team type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOUSE_LEAGUE">House League / Recreational</SelectItem>
                    <SelectItem value="REPRESENTATIVE">Representative (Rep / Travel)</SelectItem>
                    <SelectItem value="ADULT_RECREATIONAL">Adult Recreational</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground">
                  Loading...
                </div>
              )}
              {errors.teamType ? (
                <p className="text-sm text-destructive">{errors.teamType}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  This helps us tailor budget templates and categories
                </p>
              )}
            </div>

            {/* Age Division */}
            <div className="space-y-1.5">
              <Label htmlFor="ageDivision" className="text-sm font-medium">
                Age division <span className="text-destructive">*</span>
              </Label>
              {mounted ? (
                <Select
                  value={formData.ageDivision}
                  onValueChange={(value) => handleFieldChange('ageDivision', value)}
                >
                  <SelectTrigger className={errors.ageDivision ? 'border-destructive focus-visible:ring-destructive' : ''}>
                    <SelectValue placeholder="Select age division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="U7">U7</SelectItem>
                    <SelectItem value="U9">U9</SelectItem>
                    <SelectItem value="U11">U11</SelectItem>
                    <SelectItem value="U13">U13</SelectItem>
                    <SelectItem value="U15">U15</SelectItem>
                    <SelectItem value="U18">U18</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground">
                  Loading...
                </div>
              )}
              {errors.ageDivision ? (
                <p className="text-sm text-destructive">{errors.ageDivision}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Choose the age division your team plays in
                </p>
              )}
            </div>

            {/* Competitive Level */}
            <div className="space-y-1.5">
              <Label htmlFor="competitiveLevel" className="text-sm font-medium">
                Competitive level <span className="text-destructive">*</span>
              </Label>
              {mounted ? (
                <Select
                  value={formData.competitiveLevel}
                  onValueChange={(value) => handleFieldChange('competitiveLevel', value)}
                >
                  <SelectTrigger className={errors.competitiveLevel ? 'border-destructive focus-visible:ring-destructive' : ''}>
                    <SelectValue placeholder="Select competitive level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AAA">AAA</SelectItem>
                    <SelectItem value="AA">AA</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="BB">BB</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="MD">MD</SelectItem>
                    <SelectItem value="HOUSE_RECREATIONAL">House / Recreational</SelectItem>
                    <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground">
                  Loading...
                </div>
              )}
              {errors.competitiveLevel ? (
                <p className="text-sm text-destructive">{errors.competitiveLevel}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Select your competitive level (used to suggest appropriate budget ranges)
                </p>
              )}
            </div>

            {/* Season */}
            <div className="space-y-1.5">
              <Label htmlFor="season" className="text-sm font-medium">
                Season <span className="text-destructive">*</span>
              </Label>
              <Input
                id="season"
                value={formData.season}
                onChange={(e) => handleFieldChange('season', e.target.value)}
                onBlur={(e) => handleFieldBlur('season', e.target.value)}
                className={errors.season ? 'border-destructive focus-visible:ring-destructive' : ''}
                placeholder="2024-2025"
              />
              {errors.season ? (
                <p className="text-sm text-destructive">{errors.season}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Most teams run September to March
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base font-semibold bg-navy hover:bg-navy-medium text-white transition-all"
                disabled={loading}
              >
                {loading ? 'Creating your team...' : 'Continue →'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // If before July, season is (year-1)-(year)
  // If after July, season is (year)-(year+1)
  return month < 7 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
}
