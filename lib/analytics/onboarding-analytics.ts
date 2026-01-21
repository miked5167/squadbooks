// Client-side analytics for onboarding funnel tracking

export interface OnboardingEvent {
  step: number;
  stepName: string;
  action: 'start' | 'complete' | 'back' | 'skip' | 'abandon';
  metadata?: Record<string, any>;
}

export async function trackOnboardingEvent(event: OnboardingEvent): Promise<void> {
  try {
    // Send to analytics endpoint
    await fetch('/api/analytics/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      }),
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.error('Analytics error:', error);
  }
}

// Track when user navigates away (potential abandon)
export function setupAbandonTracking(currentStep: number, stepName: string): () => void {
  const handleBeforeUnload = () => {
    // Use sendBeacon for reliable tracking on page unload
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        step: currentStep,
        stepName,
        action: 'abandon',
        timestamp: new Date().toISOString(),
      });
      navigator.sendBeacon('/api/analytics/onboarding', data);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

// Get step name from step number
export function getStepName(step: number): string {
  const stepNames: Record<number, string> = {
    1: 'Team Basics',
    2: 'Team Roster',
    3: 'Budget Setup',
    4: 'Power-Up Features',
    5: 'Completion',
  };
  return stepNames[step] || `Step ${step}`;
}
