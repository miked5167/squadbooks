import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { uploadReceipt } from '@/lib/storage'

/**
 * POST /api/receipts/upload
 * Upload a receipt file and optionally attach to a transaction
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team and role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check role - only TREASURER can upload receipts
    if (user.role !== 'TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can upload receipts' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const transactionId = formData.get('transactionId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // If transactionId provided, verify it exists and belongs to user's team
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

      // Upload file
      const { url, path } = await uploadReceipt(file, user.teamId, transactionId)

      // Update transaction with receipt URL
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          receiptUrl: url,
          receiptPath: path,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json(
        {
          message: 'Receipt uploaded and attached to transaction',
          url,
          path,
          transactionId,
        },
        { status: 200 }
      )
    }

    // Upload without transaction (standalone receipt)
    // Use a temporary ID that can be updated later
    const tempId = `temp_${Date.now()}`
    const { url, path } = await uploadReceipt(file, user.teamId, tempId)

    return NextResponse.json(
      {
        message: 'Receipt uploaded successfully',
        url,
        path,
        note: 'Attach this receipt to a transaction by including the URL when creating/updating the transaction',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('POST /api/receipts/upload error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 })
  }
}

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb', // Slightly larger than 5MB file limit to account for form data overhead
    },
  },
}
