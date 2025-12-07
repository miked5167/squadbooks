'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Send, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ChatMessage } from '@/lib/types/assistant'
import { cn } from '@/lib/utils'

interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  isLoading: boolean
}

export function ChatDrawer({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
}: ChatDrawerProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus textarea when drawer opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const messageText = input.trim()
    setInput('')

    await onSendMessage(messageText)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickActions = [
    "What's our budget status?",
    'Show pending approvals',
    'How do I create a transaction?',
    'Check for compliance issues',
  ]

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-gray-900 border-l shadow-2xl transform transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">HuddleBooks Assistant</h2>
              <p className="text-xs text-muted-foreground">
                AI-powered help
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-4">
                <div className="text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <p className="font-medium">How can I help you today?</p>
                  <p className="text-sm mt-2">
                    Ask me about your budget, transactions, or how to use HuddleBooks.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2 mt-6">
                  <p className="text-xs font-medium text-muted-foreground">
                    Quick actions:
                  </p>
                  {quickActions.map((action, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => setInput(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <Card
                  className={cn(
                    'max-w-[85%] p-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.toolResults && message.toolResults.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.toolResults.map((result, i) => (
                        <Badge
                          key={i}
                          variant={result.success ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {result.message || (result.success ? 'Action completed' : 'Action failed')}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
