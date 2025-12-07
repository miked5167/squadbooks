'use client'

import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
import { ChatButton } from './ChatButton'
import { ChatDrawer } from './ChatDrawer'
import type { ChatMessage } from '@/lib/types/assistant'

export function Assistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      // Add user message
      const userMessage: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        // Call assistant API
        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            conversationHistory: messages,
            context: {
              currentRoute: pathname,
            },
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('API Error:', errorData)
          throw new Error(errorData.error || errorData.details || 'Failed to get response from assistant')
        }

        const data = await response.json()

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: data.message,
          toolResults: data.toolResults,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Handle navigation if requested
        if (data.toolResults) {
          const navigationResult = data.toolResults.find(
            (result: any) => result.data?.url
          )
          if (navigationResult?.data?.url) {
            // Navigate to the requested page
            window.location.href = navigationResult.data.url
          }
        }
      } catch (error) {
        console.error('Assistant error:', error)
        toast.error('Failed to get response from assistant. Please try again.')

        // Add error message
        const errorMessage: ChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content:
            'Sorry, I encountered an error. Please try again or contact support if the problem persists.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, pathname]
  )

  return (
    <>
      <ChatButton onClick={() => setIsOpen(true)} />
      <ChatDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        onSendMessage={sendMessage}
        isLoading={isLoading}
      />
    </>
  )
}
