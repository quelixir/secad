/**
 * Formats an ACN (Australian Company Number) with spaces every 3 digits
 * @param acn - The ACN string (should be 9 digits)
 * @returns Formatted ACN string like "123 456 789"
 */
export function formatACN(acn: string | null | undefined): string {
  if (!acn) return 'Not specified';

  // Remove any existing spaces and ensure it's 9 digits
  const cleanACN = acn.replace(/\s/g, '');
  if (cleanACN.length !== 9 || !/^\d{9}$/.test(cleanACN)) {
    return acn; // Return original if invalid format
  }

  return cleanACN.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
}

/**
 * Validates an ACN (Australian Company Number) using the check digit algorithm
 * @param acn - The ACN string (should be 9 digits)
 * @returns true if the ACN is valid, false otherwise
 */
export function validateACN(acn: string): boolean {
  if (!acn || typeof acn !== 'string') return false;

  // Remove any spaces and ensure it's exactly 9 digits
  const cleanACN = acn.replace(/\s/g, '');
  if (cleanACN.length !== 9 || !/^\d{9}$/.test(cleanACN)) {
    return false;
  }

  // Extract the first 8 digits and the check digit (last digit)
  const digits = cleanACN.split('').map(Number);
  const checkDigit = digits[8];

  // Apply weighting to digits 1 to 8 (positions 0-7)
  const weights = [8, 7, 6, 5, 4, 3, 2, 1];
  let sum = 0;

  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights[i];
  }

  // Calculate the remainder when divided by 10
  const remainder = sum % 10;

  // Complement the remainder to 10
  const calculatedCheckDigit = remainder === 0 ? 0 : 10 - remainder;

  // Compare calculated check digit with actual check digit
  return calculatedCheckDigit === checkDigit;
}
