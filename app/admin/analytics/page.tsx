'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, TrendingDown, Users, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/analytics/funnel-analytics';

interface FunnelMetrics {
  step1Started: number;
  step1Completed: number;
  step2Started: number;
  step2Completed: number;
  step2Back: number;
  step3Started: number;
  step3Completed: number;
  step3Skipped: number;
  step3Back: number;
  step4Reached: number;
  totalAbandons: number;
  conversionRate: number;
  dropOffPoints: {
    step: number;
    stepName: string;
    dropOffCount: number;
    dropOffRate: number;
  }[];
}

interface StepDuration {
  step: number;
  stepName: string;
  averageDurationSeconds: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [durations, setDurations] = useState<StepDuration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/funnel?days=${days}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      setMetrics(data.metrics);
      setDurations(data.durations);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Onboarding Funnel Analytics</h1>
        <p className="text-muted-foreground">
          Track user progress through the onboarding wizard
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{metrics.step1Started}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{metrics.step4Reached}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Abandoned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-2xl font-bold">{metrics.totalAbandons}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Funnel Breakdown</CardTitle>
          <CardDescription>User progression through each step</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FunnelStep
              stepName="Step 1: Team Basics"
              started={metrics.step1Started}
              completed={metrics.step1Completed}
              back={0}
            />
            <FunnelStep
              stepName="Step 2: Budget Setup"
              started={metrics.step2Started}
              completed={metrics.step2Completed}
              back={metrics.step2Back}
            />
            <FunnelStep
              stepName="Step 3: Power-Up Features"
              started={metrics.step3Started}
              completed={metrics.step3Completed + metrics.step3Skipped}
              back={metrics.step3Back}
              skipped={metrics.step3Skipped}
            />
            <FunnelStep
              stepName="Step 4: Completion"
              started={metrics.step4Reached}
              completed={metrics.step4Reached}
              back={0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Drop-off Points */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Drop-off Points</CardTitle>
          <CardDescription>Where users are leaving the funnel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.dropOffPoints.map((point) => (
              <div key={point.step} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{point.stepName}</p>
                  <p className="text-sm text-muted-foreground">
                    {point.dropOffCount} users ({point.dropOffRate.toFixed(1)}% drop-off rate)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-destructive">
                    {point.dropOffRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Average Duration */}
      <Card>
        <CardHeader>
          <CardTitle>Average Time per Step</CardTitle>
          <CardDescription>How long users spend on each step</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {durations.map((duration) => (
              <div key={duration.step} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{duration.stepName}</span>
                </div>
                <div className="text-lg font-bold">
                  {formatDuration(duration.averageDurationSeconds)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FunnelStepProps {
  stepName: string;
  started: number;
  completed: number;
  back: number;
  skipped?: number;
}

function FunnelStep({ stepName, started, completed, back, skipped }: FunnelStepProps) {
  const completionRate = started > 0 ? (completed / started) * 100 : 0;
  const abandoned = started - completed - back;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">{stepName}</span>
        <span className="text-sm text-muted-foreground">
          {started} started
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
        <div
          className="bg-green-600 h-full flex items-center justify-center text-xs text-white font-medium"
          style={{ width: `${completionRate}%` }}
        >
          {completionRate > 10 && `${completionRate.toFixed(0)}%`}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>✓ {completed} completed</span>
        {back > 0 && <span>← {back} went back</span>}
        {skipped && skipped > 0 && <span>⏭ {skipped} skipped</span>}
        {abandoned > 0 && <span>✗ {abandoned} abandoned</span>}
      </div>
    </div>
  );
}
