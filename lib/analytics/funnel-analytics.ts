// Server-side funnel analytics queries
import { prisma } from '@/lib/prisma';

export interface FunnelMetrics {
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

export async function getOnboardingFunnelMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<FunnelMetrics> {
  // Default to last 30 days
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  // Get all onboarding events
  const events = await prisma.auditLog.findMany({
    where: {
      action: {
        startsWith: 'ONBOARDING_',
      },
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Count events by type
  const metrics: Record<string, number> = {};
  events.forEach((event) => {
    const action = event.action.replace('ONBOARDING_', '').toLowerCase();
    const step = (event.newValues as any)?.step || 0;
    const key = `step${step}_${action}`;
    metrics[key] = (metrics[key] || 0) + 1;
  });

  const step1Started = metrics.step1_start || 0;
  const step1Completed = metrics.step1_complete || 0;
  const step2Started = metrics.step2_start || 0;
  const step2Completed = metrics.step2_complete || 0;
  const step2Back = metrics.step2_back || 0;
  const step3Started = metrics.step3_start || 0;
  const step3Completed = metrics.step3_complete || 0;
  const step3Skipped = metrics.step3_skip || 0;
  const step3Back = metrics.step3_back || 0;
  const step4Reached = metrics.step4_start || 0;

  // Count abandons
  const totalAbandons = Object.keys(metrics)
    .filter((key) => key.includes('_abandon'))
    .reduce((sum, key) => sum + metrics[key], 0);

  // Calculate conversion rate (people who reached step 4 / people who started)
  const conversionRate = step1Started > 0 ? (step4Reached / step1Started) * 100 : 0;

  // Calculate drop-off points
  const dropOffPoints = [
    {
      step: 1,
      stepName: 'Team Basics',
      dropOffCount: step1Started - step1Completed,
      dropOffRate: step1Started > 0 ? ((step1Started - step1Completed) / step1Started) * 100 : 0,
    },
    {
      step: 2,
      stepName: 'Budget Setup',
      dropOffCount: step2Started - step2Completed,
      dropOffRate: step2Started > 0 ? ((step2Started - step2Completed) / step2Started) * 100 : 0,
    },
    {
      step: 3,
      stepName: 'Power-Up Features',
      dropOffCount: step3Started - (step3Completed + step3Skipped),
      dropOffRate:
        step3Started > 0
          ? ((step3Started - (step3Completed + step3Skipped)) / step3Started) * 100
          : 0,
    },
  ].sort((a, b) => b.dropOffRate - a.dropOffRate); // Sort by highest drop-off rate

  return {
    step1Started,
    step1Completed,
    step2Started,
    step2Completed,
    step2Back,
    step3Started,
    step3Completed,
    step3Skipped,
    step3Back,
    step4Reached,
    totalAbandons,
    conversionRate,
    dropOffPoints,
  };
}

// Get average time spent on each step
export async function getAverageStepDurations(
  startDate?: Date,
  endDate?: Date
): Promise<
  {
    step: number;
    stepName: string;
    averageDurationSeconds: number;
  }[]
> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const events = await prisma.auditLog.findMany({
    where: {
      action: {
        startsWith: 'ONBOARDING_',
      },
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group events by user and calculate time spent on each step
  const userSessions: Record<string, any[]> = {};
  events.forEach((event) => {
    if (!userSessions[event.userId]) {
      userSessions[event.userId] = [];
    }
    userSessions[event.userId].push(event);
  });

  const stepDurations: Record<number, number[]> = { 1: [], 2: [], 3: [] };

  Object.values(userSessions).forEach((userEvents) => {
    let currentStepStart: Date | null = null;
    let currentStep: number | null = null;

    userEvents.forEach((event) => {
      const action = event.action.replace('ONBOARDING_', '').toLowerCase();
      const step = (event.newValues as any)?.step || 0;

      if (action === 'start') {
        currentStepStart = event.createdAt;
        currentStep = step;
      } else if (action === 'complete' && currentStepStart && currentStep === step) {
        const duration = (event.createdAt.getTime() - currentStepStart.getTime()) / 1000;
        if (duration < 600) {
          // Only count if less than 10 minutes (filter outliers)
          stepDurations[step] = stepDurations[step] || [];
          stepDurations[step].push(duration);
        }
        currentStepStart = null;
        currentStep = null;
      }
    });
  });

  const stepNames = ['Team Basics', 'Budget Setup', 'Power-Up Features'];

  return Object.entries(stepDurations).map(([step, durations]) => ({
    step: parseInt(step),
    stepName: stepNames[parseInt(step) - 1],
    averageDurationSeconds:
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
  }));
}

// Format duration for display
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}
