/**
 * Formats an ABN (Australian Business Number) with spaces every 3 digits
 * @param abn - The ABN string (should be 11 digits)
 * @returns Formatted ABN string like "12 345 678 912"
 */
export function formatABN(abn: string | null | undefined): string {
  if (!abn) return "Not specified";

  // Remove any existing spaces and ensure it's 11 digits
  const cleanABN = abn.replace(/\s/g, "");
  if (cleanABN.length !== 11 || !/^\d{11}$/.test(cleanABN)) {
    return abn; // Return original if invalid format
  }

  return cleanABN.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");
}

/**
 * Validates an ABN (Australian Business Number) using the modulus 89 algorithm
 * @param abn - The ABN string (should be 11 digits)
 * @returns true if the ABN is valid, false otherwise
 */
export function validateABN(abn: string): boolean {
  if (!abn || typeof abn !== "string") return false;

  // Remove any spaces and ensure it's exactly 11 digits
  const cleanABN = abn.replace(/\s/g, "");
  if (cleanABN.length !== 11 || !/^\d{11}$/.test(cleanABN)) {
    return false;
  }

  // Step 1: Subtract 1 from the first (left-most) digit
  const digits = cleanABN.split("").map(Number);
  const firstDigit = digits[0];
  if (firstDigit === 0) return false; // Can't subtract 1 from 0

  digits[0] = firstDigit - 1;

  // Step 2: Apply weighting factors based on position
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

  // Step 3: Sum the products
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * weights[i];
  }

  // Step 4: Divide by 89 and check remainder
  const remainder = sum % 89;

  // Step 5: If remainder is zero, the ABN is valid
  return remainder === 0;
}
