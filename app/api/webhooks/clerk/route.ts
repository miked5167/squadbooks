import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    logger.error('Error verifying webhook', err as Error)
    return new Response('Error occurred', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data

    try {
      // Create user in our database
      // Note: For MVP, we'll need a way to associate with a team
      // This could be done through an onboarding flow after signup
      const email = email_addresses[0]?.email_address
      const name = `${first_name || ''} ${last_name || ''}`.trim() || email?.split('@')[0] || 'User'

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id },
      })

      if (!existingUser) {
        // For MVP, we'll need to handle team creation/assignment separately
        // This is a placeholder that will need to be updated
        logger.info('New user signed up', { clerkId: id, email, name })
        logger.info('User needs team assignment through onboarding', { clerkId: id })
      }

      return new Response('Webhook received', { status: 200 })
    } catch (error) {
      logger.error('Error creating user from webhook', error as Error, { clerkId: id })
      return new Response('Error creating user', { status: 500 })
    }
  }

  return new Response('Webhook received', { status: 200 })
}
