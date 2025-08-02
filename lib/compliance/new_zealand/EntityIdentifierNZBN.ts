export function validateNZBN(nzbn: string): boolean {
  if (!nzbn || typeof nzbn !== "string") return false;

  // Remove any non-digit characters
  const cleanNZBN = nzbn.replace(/\D/g, "");

  // Check if it's exactly 13 digits
  if (cleanNZBN.length !== 13) return false;

  // Check if it's all digits
  if (!/^\d{13}$/.test(cleanNZBN)) return false;

  // GTIN-13 check digit validation
  const digits = cleanNZBN.split("").map(Number);
  const checkDigit = digits[12]; // Last digit
  const dataDigits = digits.slice(0, 12); // First 12 digits

  // Calculate check digit: sum of (digit * weight) where weight alternates 1,3,1,3...
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += dataDigits[i] * weight;
  }

  // Calculate expected check digit: (10 - (sum % 10)) % 10
  const expectedCheckDigit = (10 - (sum % 10)) % 10;

  return checkDigit === expectedCheckDigit;
}
