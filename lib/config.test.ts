import { getDefaultCountry, getDefaultCurrencyCode } from "./config";

// Save original environment variables
const originalEnv = process.env;

describe("Config Utilities", () => {
  beforeEach(() => {
    // Reset environment variables before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe("getDefaultCountry", () => {
    test("returns configured country when DEFAULT_COUNTRY is set", () => {
      process.env.DEFAULT_COUNTRY = "Canada";
      expect(getDefaultCountry()).toBe("Canada");
    });

    test("returns fallback when DEFAULT_COUNTRY is not set", () => {
      delete process.env.DEFAULT_COUNTRY;
      expect(getDefaultCountry()).toBe("United States");
    });

    test("returns fallback when DEFAULT_COUNTRY is empty string", () => {
      process.env.DEFAULT_COUNTRY = "";
      expect(getDefaultCountry()).toBe("United States");
    });

    test("returns fallback when DEFAULT_COUNTRY is undefined", () => {
      process.env.DEFAULT_COUNTRY = undefined;
      expect(getDefaultCountry()).toBe("United States");
    });

    test("handles various country values", () => {
      const testCountries = [
        "Australia",
        "United States",
        "United Kingdom",
        "Canada",
        "Germany",
        "France",
        "Japan",
        "New Zealand",
      ];

      testCountries.forEach((country) => {
        process.env.DEFAULT_COUNTRY = country;
        expect(getDefaultCountry()).toBe(country);
      });
    });
  });

  describe("getDefaultCurrency", () => {
    test("returns configured currency when DEFAULT_CURRENCY is set", () => {
      process.env.DEFAULT_CURRENCY = "EUR";
      expect(getDefaultCurrencyCode()).toBe("EUR");
    });

    test("returns fallback when DEFAULT_CURRENCY is not set", () => {
      delete process.env.DEFAULT_CURRENCY;
      expect(getDefaultCurrencyCode()).toBe("USD");
    });

    test("returns fallback when DEFAULT_CURRENCY is empty string", () => {
      process.env.DEFAULT_CURRENCY = "";
      expect(getDefaultCurrencyCode()).toBe("USD");
    });

    test("returns fallback when DEFAULT_CURRENCY is undefined", () => {
      process.env.DEFAULT_CURRENCY = undefined;
      expect(getDefaultCurrencyCode()).toBe("USD");
    });

    test("handles various currency values", () => {
      const testCurrencies = [
        "AUD",
        "USD",
        "EUR",
        "GBP",
        "CAD",
        "JPY",
        "CHF",
        "NZD",
      ];

      testCurrencies.forEach((currency) => {
        process.env.DEFAULT_CURRENCY = currency;
        expect(getDefaultCurrencyCode()).toBe(currency);
      });
    });
  });

  describe("Integration tests", () => {
    test("both functions work together with different environment configurations", () => {
      // Test scenario 1: Both set
      process.env.DEFAULT_COUNTRY = "Australia";
      process.env.DEFAULT_CURRENCY = "AUD";
      expect(getDefaultCountry()).toBe("Australia");
      expect(getDefaultCurrencyCode()).toBe("AUD");

      // Test scenario 2: Only country set
      process.env.DEFAULT_COUNTRY = "United Kingdom";
      delete process.env.DEFAULT_CURRENCY;
      expect(getDefaultCountry()).toBe("United Kingdom");
      expect(getDefaultCurrencyCode()).toBe("USD");

      // Test scenario 3: Only currency set
      delete process.env.DEFAULT_COUNTRY;
      process.env.DEFAULT_CURRENCY = "EUR";
      expect(getDefaultCountry()).toBe("United States");
      expect(getDefaultCurrencyCode()).toBe("EUR");

      // Test scenario 4: Neither set
      delete process.env.DEFAULT_COUNTRY;
      delete process.env.DEFAULT_CURRENCY;
      expect(getDefaultCountry()).toBe("United States");
      expect(getDefaultCurrencyCode()).toBe("USD");
    });
  });
});
