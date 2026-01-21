import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

/**
 * Rate limiting configuration for HuddleBooks
 *
 * Uses Upstash Redis for distributed rate limiting in production.
 * Falls back to in-memory rate limiting for development/testing.
 */

// Initialize Redis client (only if credentials are provided)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

/**
 * Strict rate limiter for sensitive operations (login, signup, password reset)
 * Limit: 5 requests per 15 minutes per IP
 */
export const strictRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: 'ratelimit:strict',
    })
  : null

/**
 * Standard rate limiter for API mutations (POST, PUT, DELETE)
 * Limit: 30 requests per minute per IP
 */
export const standardRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: 'ratelimit:standard',
    })
  : null

/**
 * Lenient rate limiter for read operations (GET)
 * Limit: 100 requests per minute per IP
 */
export const lenientRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:lenient',
    })
  : null

/**
 * Check rate limit for a request
 *
 * @param identifier - Usually IP address or user ID
 * @param limiter - The rate limiter to use
 * @returns NextResponse if rate limited, null if allowed
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null
): Promise<NextResponse | null> {
  // Skip rate limiting in development if Redis is not configured
  if (!limiter && process.env.NODE_ENV === 'development') {
    console.log('⚠️  Rate limiting skipped (no Redis configured)')
    return null
  }

  // If no limiter and in production, deny by default for safety
  if (!limiter) {
    console.error('❌ Rate limiter not configured in production!')
    return NextResponse.json(
      { error: 'Service configuration error' },
      { status: 500 }
    )
  }

  const { success, limit, reset, remaining } = await limiter.limit(identifier)

  if (!success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        limit,
        remaining,
        reset: new Date(reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    )
  }

  return null
}

/**
 * Get client identifier for rate limiting
 * Uses IP address if available, falls back to 'anonymous'
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'anonymous'

  return ip
}
