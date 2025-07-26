/**
 * Get the default country for new entities and members
 *
 * Configure this by setting the DEFAULT_COUNTRY environment variable in your .env file.
 *
 * @returns The configured default country or 'United States' as fallback
 */
export function getDefaultCountry(): string {
  return process.env.DEFAULT_COUNTRY || 'United States';
}

/**
 * Get the default currency for transactions and securities
 *
 * Configure this by setting the DEFAULT_CURRENCY environment variable in your .env file.
 *
 * @returns The configured default currency or 'USD' as fallback
 */
export function getDefaultCurrencyCode(): string {
  return process.env.DEFAULT_CURRENCY || 'USD';
}
