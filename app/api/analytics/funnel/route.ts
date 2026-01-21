import { NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin';
import { getOnboardingFunnelMetrics, getAverageStepDurations } from '@/lib/analytics/funnel-analytics';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const authResult = await authenticateAdmin();
    if (authResult.error) {
      return authResult.error;
    }

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
    logger.error('Funnel analytics error', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
