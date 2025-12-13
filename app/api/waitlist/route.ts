import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendWaitlistWelcomeEmail } from '@/lib/email'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const WaitlistSignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  source: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = WaitlistSignupSchema.parse(body)

    // Get IP address for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Check if email already exists
    const existingSignup = await prisma.waitlistSignup.findUnique({
      where: { email: validatedData.email }
    })

    if (existingSignup) {
      // Return success even if duplicate to avoid revealing existing emails
      return NextResponse.json(
        { success: true, message: 'Thanks for your interest!' },
        { status: 200 }
      )
    }

    // Create waitlist signup
    const signup = await prisma.waitlistSignup.create({
      data: {
        email: validatedData.email,
        source: validatedData.source || 'landing_hero',
        ipAddress,
      }
    })

    // Send welcome email
    try {
      await sendWaitlistWelcomeEmail(validatedData.email)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Continue even if email fails - we have their signup
    }

    // Add to Resend audience (if configured)
    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (audienceId) {
      try {
        await resend.contacts.create({
          email: validatedData.email,
          audienceId,
        })
      } catch (resendError) {
        console.error('Failed to add to Resend audience:', resendError)
        // Continue even if audience addition fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thanks for signing up! Check your email for confirmation.',
        id: signup.id
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Waitlist signup error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address',
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process signup. Please try again.'
      },
      { status: 500 }
    )
  }
}
