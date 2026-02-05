import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source } = body

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Get IP address
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Check if already signed up
    const existing = await prisma.waitlistSignup.findUnique({
      where: { email },
    })

    if (!existing) {
      // Save to database
      await prisma.waitlistSignup.create({
        data: {
          email,
          source: source || 'landing_page',
          ipAddress,
        },
      })
    }

    // Send email notification to you
    await resend.emails.send({
      from: 'HuddleBooks <noreply@huddlebooks.ca>',
      to: 'mike@huddlebooks.ca',
      subject: `New Email Signup: ${email}`,
      html: `
        <h2>New Email Signup</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Source:</strong> ${source || 'landing page'}</p>
        <hr>
        <p><small>Submitted from HuddleBooks landing page</small></p>
      `,
    })

    // Optionally send confirmation to subscriber
    await resend.emails.send({
      from: 'HuddleBooks <noreply@huddlebooks.ca>',
      to: email,
      subject: 'Thanks for signing up for HuddleBooks updates!',
      html: `
        <h2>Welcome to HuddleBooks!</h2>
        <p>Thanks for your interest in HuddleBooks. We'll keep you updated on our progress and let you know when we're ready to launch.</p>
        <p>In the meantime, if you have any questions, feel free to reply to this email.</p>
        <br>
        <p>Best,<br>The HuddleBooks Team</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email signup error:', error)
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 })
  }
}
