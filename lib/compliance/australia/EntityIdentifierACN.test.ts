import { formatACN, validateACN } from "./EntityIdentifierACN";

describe("ACN Formatting", () => {
  test("formats ACN correctly", () => {
    expect(formatACN("004085616")).toBe("004 085 616");
    expect(formatACN("123456789")).toBe("123 456 789");
    expect(formatACN("000000000")).toBe("000 000 000");
  });

  test("handles edge cases", () => {
    expect(formatACN("")).toBe("Not specified");
    expect(formatACN(null)).toBe("Not specified");
    expect(formatACN(undefined)).toBe("Not specified");
    expect(formatACN("12345678")).toBe("12345678"); // Invalid length, return original
    expect(formatACN("1234567890")).toBe("1234567890"); // Invalid length, return original
    expect(formatACN("12345678a")).toBe("12345678a"); // Invalid format, return original
  });
});

describe("ACN Validation", () => {
  test("validates correct ACN with check digit", () => {
    // Example from user: ACN 004 085 616
    expect(validateACN("004085616")).toBe(true);
    expect(validateACN("004 085 616")).toBe(true); // With spaces
  });

  test("rejects invalid ACN with wrong check digit", () => {
    expect(validateACN("004085610")).toBe(false); // Wrong check digit
    expect(validateACN("004085611")).toBe(false); // Wrong check digit
    expect(validateACN("004085612")).toBe(false); // Wrong check digit
    expect(validateACN("004085613")).toBe(false); // Wrong check digit
    expect(validateACN("004085614")).toBe(false); // Wrong check digit
    expect(validateACN("004085615")).toBe(false); // Wrong check digit
    expect(validateACN("004085617")).toBe(false); // Wrong check digit
    expect(validateACN("004085618")).toBe(false); // Wrong check digit
    expect(validateACN("004085619")).toBe(false); // Wrong check digit
  });

  test("rejects invalid input formats", () => {
    expect(validateACN("")).toBe(false);
    expect(validateACN("12345678")).toBe(false); // Too short
    expect(validateACN("1234567890")).toBe(false); // Too long
    expect(validateACN("12345678a")).toBe(false); // Contains letter
    expect(validateACN("12345678-")).toBe(false); // Contains special character
    expect(validateACN(null as any)).toBe(false);
    expect(validateACN(undefined as any)).toBe(false);
  });

  test("validates other known valid ACNs", () => {
    // These are some known valid ACNs
    expect(validateACN("000000000")).toBe(true); // All zeros
    expect(validateACN("123456780")).toBe(true); // Valid ACN with correct check digit
  });
});
