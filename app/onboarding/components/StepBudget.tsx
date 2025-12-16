'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface StepBudgetProps {
  teamId: string;
  teamType: string;
  ageDivision: string;
  competitiveLevel: string;
  familyCount?: number;
  onComplete: (budgetTotal: number) => void;
  onBack: () => void;
}

export function StepBudget({
  teamId,
  teamType,
  ageDivision,
  competitiveLevel,
  familyCount = 0,
  onComplete,
  onBack
}: StepBudgetProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');

  // Quick estimate - use familyCount if available, otherwise default to 18
  const [playerCount, setPlayerCount] = useState(familyCount > 0 ? familyCount : 18);
  const [feePerPlayer, setFeePerPlayer] = useState(getDefaultFee(teamType, ageDivision, competitiveLevel));
  const suggestedBudget = playerCount * feePerPlayer;
  const hasRoster = familyCount > 0;

  // Manual entry
  const [manualBudget, setManualBudget] = useState('');

  const finalBudget = mode === 'quick' ? suggestedBudget : parseInt(manualBudget) || 0;

  const handleSubmit = async () => {
    if (finalBudget < 1000) {
      toast({
        title: 'Budget too low',
        description: 'Please enter a budget of at least $1,000',
        variant: 'destructive',
      });
      return;
    }

    if (finalBudget > 1000000) {
      toast({
        title: 'Budget too high',
        description: 'Please enter a budget under $1,000,000',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/onboarding/budget', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          budgetTotal: finalBudget,
        }),
      });

      if (!response.ok) throw new Error('Failed to update budget');

      onComplete(finalBudget);
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">What&apos;s your season budget?</h1>
        <p className="text-muted-foreground">
          {hasRoster
            ? `Based on your ${familyCount} ${familyCount === 1 ? 'family' : 'families'}`
            : "We&apos;ll help you estimate based on your team size"}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Estimate */}
        <Card className={mode === 'quick' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle>Quick Estimate</CardTitle>
            <CardDescription>
              Based on typical team costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="players">
                {hasRoster ? 'Families on roster' : 'Number of players'}
              </Label>
              <Input
                id="players"
                type="number"
                min={8}
                max={30}
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value) || 0)}
                onFocus={() => setMode('quick')}
                disabled={hasRoster}
              />
              {hasRoster && (
                <p className="text-xs text-muted-foreground">
                  From the roster you added in the previous step
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee">Registration fee per player</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="fee"
                  type="number"
                  className="pl-7"
                  min={100}
                  max={5000}
                  value={feePerPlayer}
                  onChange={(e) => setFeePerPlayer(parseInt(e.target.value) || 0)}
                  onFocus={() => setMode('quick')}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Suggested budget</span>
                <span className="text-2xl font-bold">{formatCurrency(suggestedBudget)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {playerCount} {hasRoster ? 'families' : 'players'} × {formatCurrency(feePerPlayer)}
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              variant={mode === 'quick' ? 'default' : 'outline'}
              className="w-full"
              disabled={loading}
            >
              {mode === 'quick' && loading ? 'Setting up budget...' : `Use ${formatCurrency(suggestedBudget)}`}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card className={mode === 'manual' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle>Custom Budget</CardTitle>
            <CardDescription>
              Enter your exact budget amount
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual">Total season budget</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="manual"
                  type="number"
                  className="pl-7 text-lg"
                  placeholder="25000"
                  value={manualBudget}
                  onChange={(e) => {
                    setManualBudget(e.target.value);
                    setMode('manual');
                  }}
                  onFocus={() => setMode('manual')}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This is the total you expect to collect and spend during the season
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                💡 Most {getLevelName(teamType, ageDivision, competitiveLevel)} teams budget between{' '}
                {formatCurrency(getBudgetRange(teamType, ageDivision, competitiveLevel).min)} and{' '}
                {formatCurrency(getBudgetRange(teamType, ageDivision, competitiveLevel).max)}
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              variant={mode === 'manual' ? 'default' : 'outline'}
              className="w-full"
              disabled={!manualBudget || loading}
            >
              {mode === 'manual' && loading ? 'Setting up budget...' : `Use ${formatCurrency(parseInt(manualBudget) || 0)}`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Category Note */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          We&apos;ll set up budget categories based on typical hockey expenses.
          You can adjust these anytime from your dashboard.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={loading}
        >
          ← Back
        </Button>
      </div>
    </div>
  );
}

// Helper functions
function getDefaultFee(teamType: string, ageDivision: string, competitiveLevel: string): number {
  // Base fee by team type
  if (teamType === 'HOUSE_LEAGUE') return 800;
  if (teamType === 'ADULT_RECREATIONAL') return 700;

  // For representative teams, use competitive level and age division
  let baseFee = 1200;

  // Adjust by age division
  const ageFees: Record<string, number> = {
    U7: 900,
    U9: 1000,
    U11: 1100,
    U13: 1200,
    U15: 1300,
    U18: 1400,
  };
  baseFee = ageFees[ageDivision] || 1200;

  // Adjust by competitive level
  const levelMultipliers: Record<string, number> = {
    AAA: 1.5,
    AA: 1.25,
    A: 1.08,
    BB: 1.0,
    B: 1.0,
    MD: 1.0,
  };
  const multiplier = levelMultipliers[competitiveLevel] || 1.0;

  return Math.round(baseFee * multiplier);
}

function getBudgetRange(teamType: string, ageDivision: string, competitiveLevel: string): { min: number; max: number } {
  // House League budgets
  if (teamType === 'HOUSE_LEAGUE') {
    return { min: 10000, max: 18000 };
  }

  // Adult Rec budgets
  if (teamType === 'ADULT_RECREATIONAL') {
    return { min: 8000, max: 15000 };
  }

  // Representative teams - base on age + competitive level
  const ageRanges: Record<string, { min: number; max: number }> = {
    U7: { min: 12000, max: 20000 },
    U9: { min: 15000, max: 22000 },
    U11: { min: 18000, max: 25000 },
    U13: { min: 20000, max: 30000 },
    U15: { min: 22000, max: 35000 },
    U18: { min: 24000, max: 40000 },
  };

  let range = ageRanges[ageDivision] || { min: 15000, max: 30000 };

  // Adjust for competitive level
  if (competitiveLevel === 'AAA') {
    range = { min: range.min * 1.4, max: range.max * 1.5 };
  } else if (competitiveLevel === 'AA') {
    range = { min: range.min * 1.2, max: range.max * 1.3 };
  } else if (competitiveLevel === 'A') {
    range = { min: range.min * 1.0, max: range.max * 1.1 };
  }

  return {
    min: Math.round(range.min),
    max: Math.round(range.max),
  };
}

function getLevelName(teamType: string, ageDivision: string, competitiveLevel: string): string {
  if (teamType === 'HOUSE_LEAGUE') return 'House League';
  if (teamType === 'ADULT_RECREATIONAL') return 'Adult Recreational';

  // Representative teams
  const age = ageDivision !== 'OTHER' ? ageDivision : '';
  const level = competitiveLevel !== 'OTHER' ? competitiveLevel : '';

  if (age && level) {
    return `${age} ${level}`;
  } else if (age) {
    return age;
  } else if (level) {
    return level;
  }

  return 'similar';
}
