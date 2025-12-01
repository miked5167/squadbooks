// Currency utilities for Squadbooks

export const SUPPORTED_CURRENCIES = [
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', country: 'Canada' },
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
] as const

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code']

/**
 * Get currency code based on country
 */
export function getCurrencyFromCountry(country: string | null | undefined): CurrencyCode {
  if (!country) return 'CAD'

  const normalizedCountry = country.toLowerCase().trim()

  if (normalizedCountry.includes('united states') || normalizedCountry.includes('usa') || normalizedCountry === 'us') {
    return 'USD'
  }

  if (normalizedCountry.includes('canada') || normalizedCountry === 'ca') {
    return 'CAD'
  }

  // Default to CAD for hockey associations
  return 'CAD'
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)
  return currency?.symbol || '$'
}

/**
 * Get currency name for a given currency code
 */
export function getCurrencyName(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)
  return currency?.name || 'Canadian Dollar'
}

/**
 * Format amount with currency
 */
export function formatCurrency(amount: number, currencyCode: string = 'CAD'): string {
  const symbol = getCurrencySymbol(currencyCode)
  return `${symbol}${amount.toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

/**
 * Validate currency code
 */
export function isValidCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.some(c => c.code === code)
}
