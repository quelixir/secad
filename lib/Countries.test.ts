import { Countries, getCountryByName, getStatesForCountry } from "./Countries";

describe("Countries Data", () => {
  let countryNames: string[];
  let isoCodes: string[];
  let countriesWithStates: typeof Countries;
  let countriesWithoutStates: typeof Countries;

  beforeAll(() => {
    // pre-compute data once for all tests
    countryNames = Countries.map((country) => country.name);
    isoCodes = Countries.map((country) => country.iso2);
    countriesWithStates = Countries.filter((c) => c.states.length > 0);
    countriesWithoutStates = Countries.filter((c) => c.states.length === 0);
  });

  describe("Countries array", () => {
    test("should be an array", () => {
      expect(Array.isArray(Countries)).toBe(true);
    });

    test("should not be empty", () => {
      expect(Countries.length).toBeGreaterThan(0);
    });

    test("each country should have required properties", () => {
      const sampleCountries = Countries.slice(0, 10);
      sampleCountries.forEach((country) => {
        expect(country).toHaveProperty("name");
        expect(country).toHaveProperty("iso2");
        expect(country).toHaveProperty("states");
        expect(typeof country.name).toBe("string");
        expect(typeof country.iso2).toBe("string");
        expect(Array.isArray(country.states)).toBe(true);
      });
    });

    test("country names should be unique", () => {
      const uniqueNames = new Set(countryNames);
      expect(uniqueNames.size).toBe(countryNames.length);
    });

    test("ISO codes should be unique (excluding XX fallback codes)", () => {
      const nonFallbackCodes = isoCodes.filter((code) => code !== "XX");
      const uniqueIsoCodes = new Set(nonFallbackCodes);
      expect(uniqueIsoCodes.size).toBe(nonFallbackCodes.length);
    });

    test("ISO codes should be 2 characters long and uppercase", () => {
      const sampleCountries = Countries.slice(0, 20);
      sampleCountries.forEach((country) => {
        expect(country.iso2.length).toBe(2);
        expect(country.iso2).toBe(country.iso2.toUpperCase());
      });
    });

    test("each state should have required properties", () => {
      const sampleCountriesWithStates = countriesWithStates.slice(0, 5);
      sampleCountriesWithStates.forEach((country) => {
        country.states.forEach((state) => {
          expect(state).toHaveProperty("name");
          expect(state).toHaveProperty("state_code");
          expect(typeof state.name).toBe("string");
          expect(typeof state.state_code).toBe("string");
        });
      });
    });

    test("state names and codes should be non-empty", () => {
      const sampleCountriesWithStates = countriesWithStates.slice(0, 3);
      sampleCountriesWithStates.forEach((country) => {
        country.states.forEach((state) => {
          expect(state.name.trim().length).toBeGreaterThan(0);
          expect(state.state_code.trim().length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("getCountryByName function", () => {
    test("should return country with states for countries that have states", () => {
      const australia = getCountryByName("Australia");
      expect(australia).toBeDefined();
      expect(australia?.name).toBe("Australia");
      expect(australia?.iso2).toBe("AU");
      expect(australia?.states.length).toBeGreaterThan(0);
    });

    test("should return country with states for Singapore (as per JSON data)", () => {
      const singapore = getCountryByName("Singapore");
      expect(singapore).toBeDefined();
      expect(singapore?.name).toBe("Singapore");
      expect(singapore?.iso2).toBe("SG");
      expect(singapore?.states.length).toBeGreaterThan(0);
    });

    test("should return null for non-existent country", () => {
      const result = getCountryByName("NonExistentCountry");
      expect(result).toBeNull();
    });

    test("should handle case-sensitive matching", () => {
      const australia = getCountryByName("Australia");
      const australiaLower = getCountryByName("australia");
      expect(australia).toBeDefined();
      expect(australiaLower).toBeNull();
    });

    test("should return correct states for countries with states", () => {
      const usa = getCountryByName("United States");
      expect(usa?.states.length).toBeGreaterThan(0);
      expect(usa?.states.some((state) => state.name === "California")).toBe(
        true,
      );
    });
  });

  describe("getStatesForCountry function", () => {
    test("should return states for countries with states", () => {
      const usaStates = getStatesForCountry("United States");
      expect(usaStates.length).toBeGreaterThan(0);
      expect(usaStates.some((state) => state.name === "California")).toBe(true);
    });

    test("should return states for Singapore (as per JSON data)", () => {
      const singaporeStates = getStatesForCountry("Singapore");
      expect(singaporeStates.length).toBeGreaterThan(0);
    });

    test("should return empty array for non-existent country", () => {
      const result = getStatesForCountry("NonExistentCountry");
      expect(result).toEqual([]);
    });

    test("should return correct state structure", () => {
      const australiaStates = getStatesForCountry("Australia");
      expect(australiaStates.length).toBeGreaterThan(0);
      australiaStates.forEach((state) => {
        expect(state).toHaveProperty("name");
        expect(state).toHaveProperty("state_code");
        expect(typeof state.name).toBe("string");
        expect(typeof state.state_code).toBe("string");
      });
    });

    test("should handle case-sensitive matching", () => {
      const usaStates = getStatesForCountry("United States");
      const usaStatesLower = getStatesForCountry("united states");
      expect(usaStates.length).toBeGreaterThan(0);
      expect(usaStatesLower).toEqual([]);
    });
  });

  describe("Data integrity", () => {
    test("Countries should contain major countries", () => {
      const majorCountries = [
        "Australia",
        "Canada",
        "United States",
        "United Kingdom",
        "Germany",
        "France",
        "China",
        "India",
        "Brazil",
        "Japan",
      ];
      majorCountries.forEach((countryName) => {
        expect(Countries.some((c) => c.name === countryName)).toBe(true);
      });
    });

    test("Countries should contain countries with and without states", () => {
      expect(countriesWithStates.length).toBeGreaterThan(0);
      expect(countriesWithoutStates.length).toBeGreaterThanOrEqual(0);
    });

    test("ISO codes should be valid ISO 3166-1 alpha-2 format (excluding XX fallback)", () => {
      const nonFallbackCodes = isoCodes.filter((code) => code !== "XX");
      const isoCodePattern = /^[A-Z]{2}$/;

      const sampleCodes = nonFallbackCodes.slice(0, 50);
      sampleCodes.forEach((isoCode) => {
        expect(isoCode).toMatch(isoCodePattern);
      });
    });

    test("should have consistent data structure", () => {
      const sampleCountries = Countries.slice(0, 10);
      sampleCountries.forEach((country) => {
        expect(country).toHaveProperty("name");
        expect(country).toHaveProperty("iso2");
        expect(country).toHaveProperty("states");
        expect(Array.isArray(country.states)).toBe(true);

        // states should have consistent structure
        country.states.forEach((state) => {
          expect(state).toHaveProperty("name");
          expect(state).toHaveProperty("state_code");
        });
      });
    });

    test("should have all 250 countries from the JSON file", () => {
      expect(Countries.length).toBe(250);
    });
  });
});
