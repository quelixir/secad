/**
 * Get the configured locale for number formatting
 *
 * Configure this by setting the LOCALE environment variable in your .env file.
 * Specify a BCP 47 language tag (e.g., 'en-US', 'en-AU', 'fr-FR', 'de-DE')
 * You can validate your choice with this tool: https://r12a.github.io/app-subtags/
 *
 * @returns The configured locale or 'en-US' as fallback
 */
export function getLocale(): string {
  return process.env.LOCALE || 'en-US';
}

/**
 * Get locale options for number formatting with consistent decimal places
 *
 * @returns Locale options for toLocaleString with 2 decimal places
 */
export function getLocaleOptions() {
  return {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
}
