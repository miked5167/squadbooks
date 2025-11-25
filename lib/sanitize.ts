import sanitizeHtml from 'sanitize-html'

/**
 * Sanitization configuration for HuddleBooks
 * Protects against XSS attacks by removing dangerous HTML/scripts from user input
 */

/**
 * Strict sanitization - removes ALL HTML tags
 * Use for: vendor names, category names, amounts, etc.
 */
export function sanitizeStrict(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
    disallowedTagsMode: 'discard',
  }).trim()
}

/**
 * Moderate sanitization - allows basic formatting only
 * Use for: transaction descriptions, comments, notes
 */
export function sanitizeModerate(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim()
}

/**
 * URL sanitization - ensures URLs are safe
 * Use for: external links, receipt URLs
 */
export function sanitizeUrl(input: string): string {
  const sanitized = sanitizeStrict(input)

  // Ensure URL uses safe protocols
  try {
    const url = new URL(sanitized)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid URL protocol')
    }
    return sanitized
  } catch {
    throw new Error('Invalid URL format')
  }
}

/**
 * Email sanitization
 * Use for: email addresses
 */
export function sanitizeEmail(input: string): string {
  const sanitized = sanitizeStrict(input).toLowerCase()

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format')
  }

  return sanitized
}

/**
 * Sanitize object with multiple fields
 * Automatically applies appropriate sanitization based on field names
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  config: { [K in keyof T]?: 'strict' | 'moderate' | 'url' | 'email' }
): T {
  const sanitized = { ...obj }

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      const sanitizationType = config[key as keyof T] || 'strict'

      switch (sanitizationType) {
        case 'strict':
          sanitized[key as keyof T] = sanitizeStrict(value) as T[keyof T]
          break
        case 'moderate':
          sanitized[key as keyof T] = sanitizeModerate(value) as T[keyof T]
          break
        case 'url':
          sanitized[key as keyof T] = sanitizeUrl(value) as T[keyof T]
          break
        case 'email':
          sanitized[key as keyof T] = sanitizeEmail(value) as T[keyof T]
          break
      }
    }
  }

  return sanitized
}
