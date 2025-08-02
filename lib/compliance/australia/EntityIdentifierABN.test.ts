import { formatABN, validateABN } from "./EntityIdentifierABN";

describe("ABN Formatting", () => {
  test("formats ABN correctly", () => {
    expect(formatABN("12345678901")).toBe("12 345 678 901");
    expect(formatABN("00000000000")).toBe("00 000 000 000");
  });

  test("handles edge cases", () => {
    expect(formatABN("")).toBe("Not specified");
    expect(formatABN(null)).toBe("Not specified");
    expect(formatABN(undefined)).toBe("Not specified");
    expect(formatABN("1234567890")).toBe("1234567890"); // Invalid length, return original
    expect(formatABN("123456789012")).toBe("123456789012"); // Invalid length, return original
    expect(formatABN("1234567890a")).toBe("1234567890a"); // Invalid format, return original
  });
});

describe("ABN Validation", () => {
  test("validates correct ABN with check digits", () => {
    // Example from user: ABN 51 824 753 556
    expect(validateABN("51824753556")).toBe(true);
    expect(validateABN("51 824 753 556")).toBe(true); // With spaces
  });

  test("rejects invalid ABN with wrong check digits", () => {
    expect(validateABN("51824753550")).toBe(false); // Wrong check digits
    expect(validateABN("51824753551")).toBe(false); // Wrong check digits
    expect(validateABN("51824753552")).toBe(false); // Wrong check digits
    expect(validateABN("51824753553")).toBe(false); // Wrong check digits
    expect(validateABN("51824753554")).toBe(false); // Wrong check digits
    expect(validateABN("51824753555")).toBe(false); // Wrong check digits
    expect(validateABN("51824753557")).toBe(false); // Wrong check digits
    expect(validateABN("51824753558")).toBe(false); // Wrong check digits
    expect(validateABN("51824753559")).toBe(false); // Wrong check digits
  });

  test("rejects invalid input formats", () => {
    expect(validateABN("")).toBe(false);
    expect(validateABN("1234567890")).toBe(false); // Too short
    expect(validateABN("123456789012")).toBe(false); // Too long
    expect(validateABN("1234567890a")).toBe(false); // Contains letter
    expect(validateABN("1234567890-")).toBe(false); // Contains special character
    expect(validateABN("01234567890")).toBe(false); // Starts with 0 (can't subtract 1)
    expect(validateABN(null as any)).toBe(false);
    expect(validateABN(undefined as any)).toBe(false);
  });

  test("validates other known valid ABNs", () => {
    // These are some known valid ABNs
    expect(validateABN("00000000000")).toBe(false); // All zeros (can't subtract 1 from 0)
    expect(validateABN("12345678901")).toBe(false); // This should be invalid if the algorithm is correct
  });
});
