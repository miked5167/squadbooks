import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    // Allow tracking even for unauthenticated users (store anonymously)
    const body = await request.json();
    const {
      step,
      stepName,
      action,
      metadata,
      timestamp,
      userAgent,
      screenWidth,
      screenHeight,
    } = body;

    // If user is authenticated, save to audit log
    if (userId) {
      // Try to get user's team and database ID
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, teamId: true },
      });

      // Only create audit log if we can associate with a team
      if (user?.teamId) {
        await prisma.auditLog.create({
          data: {
            teamId: user.teamId,
            userId: user.id,
            action: `ONBOARDING_${action.toUpperCase()}`,
            entityType: 'Onboarding',
            entityId: `step-${step}`,
            newValues: {
              step,
              stepName,
              action,
              metadata,
              screenWidth,
              screenHeight,
              userAgent,
            },
          },
        });
      }
    }

    // Also log to console in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Onboarding Analytics]', {
        userId: userId || 'anonymous',
        step,
        stepName,
        action,
        timestamp,
      });
    }

    // In production, you might want to send to a third-party analytics service
    // like PostHog, Mixpanel, Amplitude, etc.
    // Example:
    // await posthog.capture({
    //   distinctId: userId || 'anonymous',
    //   event: `onboarding_${action}`,
    //   properties: { step, stepName, ...metadata },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    // Return success anyway - don't fail the request due to analytics
    return NextResponse.json({ success: true });
  }
}
