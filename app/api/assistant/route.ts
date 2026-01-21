// AI Assistant API Endpoint
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'

import type { AssistantContext, AssistantRequest } from '@/lib/types/assistant'
import { getUserPermissions } from '@/lib/assistant/permissions'
import { executeTool } from '@/lib/assistant/tools'
import { getSystemPrompt, searchKnowledge } from '@/lib/assistant/knowledge-base'

const prisma = new PrismaClient()
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
    let clerkUserId: string | null = null

    if (DEV_MODE) {
      // In dev mode, get user ID from cookie
      const cookies = req.cookies
      const devUserId = cookies.get('dev_user_id')?.value || process.env.DEV_USER_ID
      clerkUserId = devUserId || null
    } else {
      // Production: Use Clerk authentication
      const authResult = await auth()
      clerkUserId = authResult.userId
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      include: {
        team: {
          include: {
            associationTeam: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build context
    const context: AssistantContext = {
      userId: user.id,
      teamId: user.teamId,
      role: user.role,
      associationId: user.team.associationTeam?.associationId,
      permissions: getUserPermissions(user.role),
    }

    // Parse request
    const body: AssistantRequest = await req.json()
    const { message, conversationHistory } = body

    // Build conversation context for LLM
    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ]

    // Search knowledge base for relevant context
    const relevantKnowledge = searchKnowledge(message, undefined, user.role)
    const knowledgeContext = relevantKnowledge.length > 0
      ? `\n\nRELEVANT KNOWLEDGE:\n${relevantKnowledge.map((k) => `${k.title}: ${k.content}`).join('\n\n')}`
      : ''

    // Check if API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set!')
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    console.log('Calling Anthropic API for user:', user.role, 'message:', message.substring(0, 50))

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      system: getSystemPrompt({ role: user.role, teamId: user.teamId }) + knowledgeContext,
      messages: messages as Anthropic.MessageParam[],
    })

    const finalText = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')

    // Format response
    return NextResponse.json({
      message: finalText,
      toolResults: [],
      usage: response.usage,
    })
  } catch (error) {
    console.error('Assistant API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        error: 'An error occurred while processing your request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
