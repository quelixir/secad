import { getLocale, getLocaleOptions } from "./locale";

// Save original environment variables
const originalEnv = process.env;

describe("Locale Utilities", () => {
  beforeEach(() => {
    // Reset environment variables before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe("getLocale", () => {
    test("returns configured locale when LOCALE is set", () => {
      process.env.LOCALE = "en-AU";
      expect(getLocale()).toBe("en-AU");
    });

    test("returns fallback when LOCALE is not set", () => {
      delete process.env.LOCALE;
      expect(getLocale()).toBe("en-US");
    });

    test("returns fallback when LOCALE is empty string", () => {
      process.env.LOCALE = "";
      expect(getLocale()).toBe("en-US");
    });

    test("returns fallback when LOCALE is undefined", () => {
      process.env.LOCALE = undefined;
      expect(getLocale()).toBe("en-US");
    });

    test("handles various locale values", () => {
      const testLocales = [
        "en-US",
        "en-AU",
        "en-GB",
        "fr-FR",
        "de-DE",
        "ja-JP",
        "zh-CN",
        "es-ES",
      ];

      testLocales.forEach((locale) => {
        process.env.LOCALE = locale;
        expect(getLocale()).toBe(locale);
      });
    });
  });

  describe("getLocaleOptions", () => {
    test("returns consistent locale options", () => {
      const options = getLocaleOptions();
      expect(options).toEqual({
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });

    test("returns new object instance each time", () => {
      const options1 = getLocaleOptions();
      const options2 = getLocaleOptions();
      expect(options1).toEqual(options2);
      expect(options1).not.toBe(options2); // Different object instances
    });

    test("options are immutable", () => {
      const options = getLocaleOptions();

      // Try to modify the options
      options.minimumFractionDigits = 3;
      options.maximumFractionDigits = 4;

      // Should not affect the original function
      const newOptions = getLocaleOptions();
      expect(newOptions.minimumFractionDigits).toBe(2);
      expect(newOptions.maximumFractionDigits).toBe(2);
    });
  });

  describe("Integration tests", () => {
    test("locale functions work together for number formatting", () => {
      const testNumber = 1234.5678;

      // Test with different locales
      const testCases = [
        { locale: "en-US", expected: "1,234.57" },
        { locale: "en-AU", expected: "1,234.57" },
        { locale: "de-DE", expected: "1.234,57" },
      ];

      testCases.forEach(({ locale, expected }) => {
        process.env.LOCALE = locale;
        const localeOptions = getLocaleOptions();

        const formatted = testNumber.toLocaleString(getLocale(), localeOptions);
        expect(formatted).toBe(expected);
      });

      // Test French locale separately due to potential space character differences
      process.env.LOCALE = "fr-FR";
      const localeOptions = getLocaleOptions();
      const formatted = testNumber.toLocaleString(getLocale(), localeOptions);
      expect(formatted).toMatch(/1\s*234,57/); // Flexible matching for space characters
    });

    test("handles edge cases with locale configuration", () => {
      // Test with invalid locale (should fall back to en-US)
      process.env.LOCALE = "invalid-locale";
      expect(getLocale()).toBe("invalid-locale"); // Should still return the invalid value

      // Test with complex locale string
      process.env.LOCALE = "en-US-u-ca-gregory";
      expect(getLocale()).toBe("en-US-u-ca-gregory");
    });
  });
});
