import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'icon' | 'full'
  className?: string
  iconClassName?: string
}

export function Logo({ variant = 'icon', className, iconClassName }: LogoProps) {
  if (variant === 'icon') {
    return (
      <div className={cn('relative', className)}>
        <svg
          viewBox="0 0 100 100"
          className={cn('w-8 h-8', iconClassName)}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Circle of people */}
          <circle cx="50" cy="20" r="8" fill="#003A5D" />
          <circle cx="80" cy="35" r="8" fill="#003A5D" />
          <circle cx="85" cy="65" r="8" fill="#003A5D" />
          <circle cx="65" cy="85" r="8" fill="#003A5D" />
          <circle cx="35" cy="85" r="8" fill="#003A5D" />
          <circle cx="15" cy="65" r="8" fill="#003A5D" />
          <circle cx="20" cy="35" r="8" fill="#003A5D" />

          {/* Shield */}
          <path
            d="M50 30 L70 42 L70 60 L50 75 L30 60 L30 42 Z"
            fill="#003A5D"
            stroke="white"
            strokeWidth="3"
          />

          {/* Checkmark */}
          <path
            d="M40 52 L47 60 L62 42"
            stroke="#6B9E3E"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Logo variant="icon" iconClassName={iconClassName} />
      <span className="text-xl font-bold text-white">HuddleBooks</span>
    </div>
  )
}
