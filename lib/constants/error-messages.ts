/**
 * Centralized error message constants
 *
 * User-friendly error messages without technical details.
 * Used for inline error states and retry flows.
 */
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Unable to load transactions. Please try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  PERMISSION_DENIED: "You don't have permission to view this data.",
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  NOT_FOUND: 'The requested data could not be found.',
} as const

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES
