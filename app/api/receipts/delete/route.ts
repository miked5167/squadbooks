import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { deleteReceipt } from '@/lib/storage'

/**
 * DELETE /api/receipts/delete
 * Delete a receipt file from storage
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team and role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check role - only TREASURER can delete receipts
    if (user.role !== 'TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can delete receipts' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { transactionId, path } = body

    if (!path && !transactionId) {
      return NextResponse.json(
        { error: 'Either path or transactionId is required' },
        { status: 400 }
      )
    }

    let receiptPath = path

    // If transactionId provided, get the receipt path from the transaction
    if (transactionId) {
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          teamId: user.teamId,
          deletedAt: null,
        },
      })

      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        )
      }

      if (!transaction.receiptPath) {
        return NextResponse.json(
          { error: 'Transaction has no receipt attached' },
          { status: 404 }
        )
      }

      receiptPath = transaction.receiptPath

      // Remove receipt from transaction
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          receiptUrl: null,
          receiptPath: null,
          updatedAt: new Date(),
        },
      })
    }

    // Delete file from storage
    await deleteReceipt(receiptPath)

    return NextResponse.json(
      {
        message: 'Receipt deleted successfully',
        path: receiptPath,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/receipts/delete error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 })
  }
}
