import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/prisma';
import type { BankAccount } from '@/lib/types/banking';

export const dynamic = 'force-dynamic';

/**
 * GET /api/plaid/bank-connections
 * Fetch all active bank connections for the authenticated user's team
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all active bank connections for this team
    const bankConnections = await prisma.bankConnection.findMany({
      where: {
        teamId: user.teamId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to BankAccount type for frontend
    const accounts: BankAccount[] = bankConnections.map((conn) => ({
      id: conn.id,
      plaidAccountId: conn.plaidAccountId,
      institutionId: conn.itemId, // Using itemId as institutionId
      institutionName: conn.institutionName,
      accountName: conn.accountName,
      accountType: conn.accountType || 'checking',
      accountSubtype: '',
      mask: conn.accountMask || '****',
      currentBalance: 0, // Balance is dynamic, would need separate Plaid call
      currency: 'USD',
      connectedAt: conn.createdAt,
      lastSyncedAt: conn.lastSyncedAt || conn.createdAt,
      isActive: conn.isActive,
    }));

    return NextResponse.json({
      success: true,
      accounts,
      accessToken: bankConnections[0]?.accessToken || null,
    });
  } catch (error) {
    console.error('Failed to fetch bank connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/plaid/bank-connections?connectionId=xxx
 * Disconnect a bank connection
 */
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Missing connectionId parameter' },
        { status: 400 }
      );
    }

    // Verify the connection belongs to this team before deleting
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
      select: { teamId: true },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    if (connection.teamId !== user.teamId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete by marking as inactive
    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Bank connection disconnected',
    });
  } catch (error) {
    console.error('Failed to disconnect bank connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
