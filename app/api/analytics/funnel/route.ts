import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOnboardingFunnelMetrics, getAverageStepDurations } from '@/lib/analytics/funnel-analytics';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin permission check
    // For now, allow any authenticated user to view analytics

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 30;

    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [metrics, durations] = await Promise.all([
      getOnboardingFunnelMetrics(startDate, endDate),
      getAverageStepDurations(startDate, endDate),
    ]);

    return NextResponse.json({
      success: true,
      metrics,
      durations,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error('Funnel analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
