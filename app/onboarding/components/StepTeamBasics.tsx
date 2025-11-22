'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  level: string;
  season: string;
}

export function StepTeamBasics({ onComplete, initialData }: StepTeamBasicsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    level: initialData?.level || '',
    season: initialData?.season || getCurrentSeason(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.level || !formData.season) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
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
        body: JSON.stringify(formData),
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
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Let's set up your team</h1>
        <p className="text-muted-foreground">
          This takes about 2 minutes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Team name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Newmarket Storm U13 AA"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoFocus
            required
            minLength={3}
            maxLength={100}
          />
          <p className="text-sm text-muted-foreground">
            This is how your team will appear on reports
          </p>
        </div>

        {/* Team Level */}
        <div className="space-y-2">
          <Label htmlFor="level">
            Team level <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.level}
            onValueChange={(value) => setFormData({ ...formData, level: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select team level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House League / Recreational</SelectItem>
              <SelectItem value="u7">U7 (Novice)</SelectItem>
              <SelectItem value="u9">U9 (Atom)</SelectItem>
              <SelectItem value="u11">U11 (Peewee)</SelectItem>
              <SelectItem value="u13">U13 (Bantam)</SelectItem>
              <SelectItem value="u15">U15 (Midget)</SelectItem>
              <SelectItem value="u18">U18 (Juvenile)</SelectItem>
              <SelectItem value="a">Single A</SelectItem>
              <SelectItem value="aa">Double A (AA)</SelectItem>
              <SelectItem value="aaa">Triple A (AAA)</SelectItem>
              <SelectItem value="adult">Adult Rec</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            This helps us provide relevant guidance
          </p>
        </div>

        {/* Season */}
        <div className="space-y-2">
          <Label htmlFor="season">
            Season <span className="text-destructive">*</span>
          </Label>
          <Input
            id="season"
            value={formData.season}
            onChange={(e) => setFormData({ ...formData, season: e.target.value })}
            required
            placeholder="2024-2025"
          />
          <p className="text-sm text-muted-foreground">
            Most teams run September to March
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating your team...' : 'Continue →'}
        </Button>
      </form>
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
