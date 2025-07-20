import { validateNZBN } from './EntityIdentifierNZBN';

describe('validateNZBN', () => {
  it('should validate a correct NZBN', () => {
    expect(validateNZBN('9429044650421')).toBe(true);
  });

  it('should validate NZBN with formatting', () => {
    expect(validateNZBN('942-904-465-0421')).toBe(true);
    expect(validateNZBN('942 904 465 0421')).toBe(true);
  });

  it('should reject invalid NZBNs', () => {
    expect(validateNZBN('9429044650420')).toBe(false); // Wrong check digit
    expect(validateNZBN('942904465042')).toBe(false); // Too short
    expect(validateNZBN('94290446504212')).toBe(false); // Too long
    expect(validateNZBN('942904465042a')).toBe(false); // Contains letter
  });

  it('should reject invalid inputs', () => {
    expect(validateNZBN('')).toBe(false);
    expect(validateNZBN(null as any)).toBe(false);
    expect(validateNZBN(undefined as any)).toBe(false);
    expect(validateNZBN(9429044650421 as any)).toBe(false); // Number instead of string
  });
});
