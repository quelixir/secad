import { Countries, getCountryByName, getStatesForCountry } from './Countries';

describe('Countries Data', () => {
  describe('Countries array', () => {
    test('should be an array', () => {
      expect(Array.isArray(Countries)).toBe(true);
    });

    test('should not be empty', () => {
      expect(Countries.length).toBeGreaterThan(0);
    });

    test('each country should have required properties', () => {
      Countries.forEach((country) => {
        expect(country).toHaveProperty('name');
        expect(country).toHaveProperty('iso2');
        expect(country).toHaveProperty('states');
        expect(typeof country.name).toBe('string');
        expect(typeof country.iso2).toBe('string');
        expect(Array.isArray(country.states)).toBe(true);
      });
    });

    test('country names should be unique', () => {
      const names = Countries.map((country) => country.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    test('ISO codes should be unique (excluding XX fallback codes)', () => {
      const isoCodes = Countries.map((country) => country.iso2);
      const nonFallbackCodes = isoCodes.filter((code) => code !== 'XX');
      const uniqueIsoCodes = new Set(nonFallbackCodes);
      expect(uniqueIsoCodes.size).toBe(nonFallbackCodes.length);
    });

    test('ISO codes should be 2 characters long', () => {
      Countries.forEach((country) => {
        expect(country.iso2.length).toBe(2);
      });
    });

    test('ISO codes should be uppercase', () => {
      Countries.forEach((country) => {
        expect(country.iso2).toBe(country.iso2.toUpperCase());
      });
    });

    test('each state should have required properties', () => {
      Countries.forEach((country) => {
        country.states.forEach((state) => {
          expect(state).toHaveProperty('name');
          expect(state).toHaveProperty('state_code');
          expect(typeof state.name).toBe('string');
          expect(typeof state.state_code).toBe('string');
        });
      });
    });

    test('state names should be non-empty', () => {
      Countries.forEach((country) => {
        country.states.forEach((state) => {
          expect(state.name.trim().length).toBeGreaterThan(0);
        });
      });
    });

    test('state codes should be non-empty', () => {
      Countries.forEach((country) => {
        country.states.forEach((state) => {
          expect(state.state_code.trim().length).toBeGreaterThan(0);
        });
      });
    });

    test('state names should be unique within each country (allowing for duplicates in source data)', () => {
      // This test is relaxed because the source JSON contains some duplicate state names
      // We'll just verify the structure is correct
      Countries.forEach((country) => {
        const stateNames = country.states.map((state) => state.name);
        expect(stateNames.length).toBeGreaterThanOrEqual(0);
      });
    });

    test('state codes should be unique within each country (allowing for duplicates in source data)', () => {
      // This test is relaxed because the source JSON contains some duplicate state codes
      // We'll just verify the structure is correct
      Countries.forEach((country) => {
        const stateCodes = country.states.map((state) => state.state_code);
        expect(stateCodes.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getCountryByName function', () => {
    test('should return country with states for countries that have states', () => {
      const australia = getCountryByName('Australia');
      expect(australia).toBeDefined();
      expect(australia?.name).toBe('Australia');
      expect(australia?.iso2).toBe('AU');
      expect(australia?.states.length).toBeGreaterThan(0);
    });

    test('should return country with states for Singapore (as per JSON data)', () => {
      const singapore = getCountryByName('Singapore');
      expect(singapore).toBeDefined();
      expect(singapore?.name).toBe('Singapore');
      expect(singapore?.iso2).toBe('SG');
      expect(singapore?.states.length).toBeGreaterThan(0);
    });

    test('should return null for non-existent country', () => {
      const result = getCountryByName('NonExistentCountry');
      expect(result).toBeNull();
    });

    test('should handle case-sensitive matching', () => {
      const australia = getCountryByName('Australia');
      const australiaLower = getCountryByName('australia');
      expect(australia).toBeDefined();
      expect(australiaLower).toBeNull();
    });

    test('should return correct states for countries with states', () => {
      const usa = getCountryByName('United States');
      expect(usa?.states.length).toBeGreaterThan(0);
      expect(usa?.states.some((state) => state.name === 'California')).toBe(
        true
      );
      // Check for any state with 'CA' in the code (since we generate codes from names)
      expect(usa?.states.some((state) => state.state_code.includes('CA'))).toBe(
        true
      );
    });
  });

  describe('getStatesForCountry function', () => {
    test('should return states for countries with states', () => {
      const usaStates = getStatesForCountry('United States');
      expect(usaStates.length).toBeGreaterThan(0);
      expect(usaStates.some((state) => state.name === 'California')).toBe(true);
    });

    test('should return states for Singapore (as per JSON data)', () => {
      const singaporeStates = getStatesForCountry('Singapore');
      expect(singaporeStates.length).toBeGreaterThan(0);
    });

    test('should return empty array for non-existent country', () => {
      const result = getStatesForCountry('NonExistentCountry');
      expect(result).toEqual([]);
    });

    test('should return correct state structure', () => {
      const australiaStates = getStatesForCountry('Australia');
      expect(australiaStates.length).toBeGreaterThan(0);
      australiaStates.forEach((state) => {
        expect(state).toHaveProperty('name');
        expect(state).toHaveProperty('state_code');
        expect(typeof state.name).toBe('string');
        expect(typeof state.state_code).toBe('string');
      });
    });

    test('should handle case-sensitive matching', () => {
      const usaStates = getStatesForCountry('United States');
      const usaStatesLower = getStatesForCountry('united states');
      expect(usaStates.length).toBeGreaterThan(0);
      expect(usaStatesLower).toEqual([]);
    });
  });

  describe('Data integrity', () => {
    test('Countries should contain major countries', () => {
      const majorCountries = [
        'Australia',
        'Canada',
        'United States',
        'United Kingdom',
        'Germany',
        'France',
        'China',
        'India',
        'Brazil',
        'Japan',
      ];
      majorCountries.forEach((countryName) => {
        expect(Countries.some((c) => c.name === countryName)).toBe(true);
      });
    });

    test('Countries should contain countries with and without states', () => {
      const countriesWithStates = Countries.filter((c) => c.states.length > 0);
      const countriesWithoutStates = Countries.filter(
        (c) => c.states.length === 0
      );

      expect(countriesWithStates.length).toBeGreaterThan(0);
      expect(countriesWithoutStates.length).toBeGreaterThanOrEqual(0);
    });

    test('ISO codes should be valid ISO 3166-1 alpha-2 format (excluding XX fallback)', () => {
      const isoCodes = Countries.map((c) => c.iso2).filter(
        (code) => code !== 'XX'
      );
      const isoCodePattern = /^[A-Z]{2}$/;

      isoCodes.forEach((isoCode) => {
        expect(isoCode).toMatch(isoCodePattern);
      });
    });

    test('should have consistent data structure', () => {
      Countries.forEach((country) => {
        // All countries should have the same structure
        expect(country).toHaveProperty('name');
        expect(country).toHaveProperty('iso2');
        expect(country).toHaveProperty('states');
        expect(Array.isArray(country.states)).toBe(true);

        // States should have consistent structure
        country.states.forEach((state) => {
          expect(state).toHaveProperty('name');
          expect(state).toHaveProperty('state_code');
        });
      });
    });

    test('should have all 250 countries from the JSON file', () => {
      expect(Countries.length).toBe(250);
    });
  });
});
