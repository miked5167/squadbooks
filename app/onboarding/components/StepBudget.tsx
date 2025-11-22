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
  teamLevel: string;
  familyCount?: number;
  onComplete: (budgetTotal: number) => void;
  onBack: () => void;
}

export function StepBudget({ teamId, teamLevel, familyCount = 0, onComplete, onBack }: StepBudgetProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');

  // Quick estimate - use familyCount if available, otherwise default to 18
  const [playerCount, setPlayerCount] = useState(familyCount > 0 ? familyCount : 18);
  const [feePerPlayer, setFeePerPlayer] = useState(getDefaultFee(teamLevel));
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
        <h1 className="text-3xl font-bold mb-2">What's your season budget?</h1>
        <p className="text-muted-foreground">
          {hasRoster
            ? `Based on your ${familyCount} ${familyCount === 1 ? 'family' : 'families'}`
            : "We'll help you estimate based on your team size"}
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
                💡 Most {getLevelName(teamLevel)} teams budget between{' '}
                {formatCurrency(getBudgetRange(teamLevel).min)} and{' '}
                {formatCurrency(getBudgetRange(teamLevel).max)}
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
          We'll set up budget categories based on typical hockey expenses.
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
function getDefaultFee(level: string): number {
  const fees: Record<string, number> = {
    house: 800,
    u7: 900,
    u9: 1000,
    u11: 1100,
    u13: 1200,
    u15: 1300,
    u18: 1400,
    a: 1300,
    aa: 1500,
    aaa: 1800,
    adult: 700,
    other: 1200,
  };
  return fees[level] || 1200;
}

function getBudgetRange(level: string): { min: number; max: number } {
  const ranges: Record<string, { min: number; max: number }> = {
    house: { min: 10000, max: 18000 },
    u7: { min: 12000, max: 20000 },
    u9: { min: 15000, max: 22000 },
    u11: { min: 18000, max: 25000 },
    u13: { min: 20000, max: 30000 },
    u15: { min: 22000, max: 35000 },
    u18: { min: 24000, max: 40000 },
    a: { min: 22000, max: 35000 },
    aa: { min: 25000, max: 45000 },
    aaa: { min: 35000, max: 60000 },
    adult: { min: 8000, max: 15000 },
    other: { min: 15000, max: 30000 },
  };
  return ranges[level] || { min: 15000, max: 30000 };
}

function getLevelName(level: string): string {
  const names: Record<string, string> = {
    house: 'House League',
    u7: 'U7',
    u9: 'U9',
    u11: 'U11',
    u13: 'U13',
    u15: 'U15',
    u18: 'U18',
    a: 'Single A',
    aa: 'Double A',
    aaa: 'Triple A',
    adult: 'Adult Rec',
    other: 'similar',
  };
  return names[level] || 'similar';
}
