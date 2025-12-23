import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, message } = body

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Send email notification to you
    await resend.emails.send({
      from: 'HuddleBooks <noreply@huddlebooks.ca>',
      to: 'mike@huddlebooks.ca',
      replyTo: email,
      subject: `New Demo Request from ${name}`,
      html: `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${role.replace('_', ' ')}</p>
        ${message ? `<p><strong>Message:</strong><br>${message}</p>` : ''}
        <hr>
        <p><small>Submitted from HuddleBooks landing page</small></p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Demo request error:', error)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}
