'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ChatButtonProps {
  onClick: () => void
  hasUnreadMessages?: boolean
  unreadCount?: number
}

export function ChatButton({ onClick, hasUnreadMessages, unreadCount }: ChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
    >
      <MessageCircle className="h-6 w-6" />
      {hasUnreadMessages && unreadCount && unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  )
}
