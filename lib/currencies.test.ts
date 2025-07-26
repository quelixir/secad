import {
  Currencies,
  findCurrencyByCode,
  getCurrencySymbol,
  getCurrencyName,
  type Currency,
} from './currencies';

describe('Currencies', () => {
  describe('Currencies array', () => {
    it('should export a non-empty array of currencies', () => {
      expect(Currencies).toBeDefined();
      expect(Array.isArray(Currencies)).toBe(true);
      expect(Currencies.length).toBeGreaterThan(0);
    });

    it('should have currencies with the correct structure', () => {
      Currencies.forEach((currency) => {
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('name');
        expect(currency).toHaveProperty('symbol');
        expect(typeof currency.code).toBe('string');
        expect(typeof currency.name).toBe('string');
        expect(typeof currency.symbol).toBe('string');
      });
    });

    it('should have unique currency codes', () => {
      const codes = Currencies.map((c) => c.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should have valid currency codes (3 letters)', () => {
      Currencies.forEach((currency) => {
        expect(currency.code).toMatch(/^[A-Z]{3}$/);
      });
    });

    it('should include major world currencies', () => {
      const majorCurrencies = [
        'USD',
        'EUR',
        'GBP',
        'JPY',
        'AUD',
        'CAD',
        'CHF',
        'CNY',
      ];
      majorCurrencies.forEach((code) => {
        const currency = Currencies.find((c) => c.code === code);
        expect(currency).toBeDefined();
        expect(currency?.code).toBe(code);
      });
    });

    it('should have non-empty names and symbols', () => {
      Currencies.forEach((currency) => {
        expect(currency.name.trim().length).toBeGreaterThan(0);
        expect(currency.symbol.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('findCurrencyByCode', () => {
    it('should find a currency by its code', () => {
      const usd = findCurrencyByCode('USD');
      expect(usd).toBeDefined();
      expect(usd?.code).toBe('USD');
      expect(usd?.name).toBe('United States Dollar');
      expect(usd?.symbol).toBe('$');
    });

    it('should find EUR currency', () => {
      const eur = findCurrencyByCode('EUR');
      expect(eur).toBeDefined();
      expect(eur?.code).toBe('EUR');
      expect(eur?.name).toBe('Euro');
      expect(eur?.symbol).toBe('€');
    });

    it('should find GBP currency', () => {
      const gbp = findCurrencyByCode('GBP');
      expect(gbp).toBeDefined();
      expect(gbp?.code).toBe('GBP');
      expect(gbp?.name).toBe('British Pound Sterling');
      expect(gbp?.symbol).toBe('£');
    });

    it('should return undefined for non-existent currency codes', () => {
      expect(findCurrencyByCode('XXX')).toBeUndefined();
      expect(findCurrencyByCode('')).toBeUndefined();
      expect(findCurrencyByCode('INVALID')).toBeUndefined();
    });

    it('should be case sensitive', () => {
      expect(findCurrencyByCode('usd')).toBeUndefined();
      expect(findCurrencyByCode('Usd')).toBeUndefined();
      expect(findCurrencyByCode('USD')).toBeDefined();
    });

    it('should handle edge cases', () => {
      expect(findCurrencyByCode('   ')).toBeUndefined();
      expect(findCurrencyByCode('123')).toBeUndefined();
      expect(findCurrencyByCode('A')).toBeUndefined();
      expect(findCurrencyByCode('AB')).toBeUndefined();
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return the correct symbol for valid currency codes', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('GBP')).toBe('£');
      expect(getCurrencySymbol('JPY')).toBe('¥');
      expect(getCurrencySymbol('AUD')).toBe('A$');
    });

    it('should return the code as fallback for invalid currency codes', () => {
      expect(getCurrencySymbol('XXX')).toBe('XXX');
      expect(getCurrencySymbol('')).toBe('');
      expect(getCurrencySymbol('INVALID')).toBe('INVALID');
    });

    it('should handle edge cases', () => {
      expect(getCurrencySymbol('   ')).toBe('   ');
      expect(getCurrencySymbol('123')).toBe('123');
      expect(getCurrencySymbol('A')).toBe('A');
      expect(getCurrencySymbol('AB')).toBe('AB');
    });

    it('should return correct symbols for various currencies', () => {
      expect(getCurrencySymbol('BTC')).toBe('₿');
      expect(getCurrencySymbol('CNY')).toBe('¥');
      expect(getCurrencySymbol('INR')).toBe('₹');
      expect(getCurrencySymbol('RUB')).toBe('₽');
      expect(getCurrencySymbol('THB')).toBe('฿');
    });
  });

  describe('getCurrencyName', () => {
    it('should return the correct name for valid currency codes', () => {
      expect(getCurrencyName('USD')).toBe('United States Dollar');
      expect(getCurrencyName('EUR')).toBe('Euro');
      expect(getCurrencyName('GBP')).toBe('British Pound Sterling');
      expect(getCurrencyName('JPY')).toBe('Japanese Yen');
      expect(getCurrencyName('AUD')).toBe('Australian Dollar');
    });

    it('should return the code as fallback for invalid currency codes', () => {
      expect(getCurrencyName('XXX')).toBe('XXX');
      expect(getCurrencyName('')).toBe('');
      expect(getCurrencyName('INVALID')).toBe('INVALID');
    });

    it('should handle edge cases', () => {
      expect(getCurrencyName('   ')).toBe('   ');
      expect(getCurrencyName('123')).toBe('123');
      expect(getCurrencyName('A')).toBe('A');
      expect(getCurrencyName('AB')).toBe('AB');
    });

    it('should return correct names for various currencies', () => {
      expect(getCurrencyName('BTC')).toBe('Bitcoin');
      expect(getCurrencyName('CNY')).toBe('Chinese Yuan');
      expect(getCurrencyName('INR')).toBe('Indian Rupee');
      expect(getCurrencyName('RUB')).toBe('Russian Ruble');
      expect(getCurrencyName('THB')).toBe('Thai Baht');
    });
  });

  describe('Currency interface', () => {
    it('should have the correct TypeScript interface', () => {
      const currency: Currency = {
        code: 'TEST',
        name: 'Test Currency',
        symbol: 'T',
      };

      expect(currency.code).toBe('TEST');
      expect(currency.name).toBe('Test Currency');
      expect(currency.symbol).toBe('T');
    });

    it('should enforce required properties', () => {
      // ensures TS compilation fails if interface is violated
      const validCurrency: Currency = {
        code: 'USD',
        name: 'United States Dollar',
        symbol: '$',
      };

      expect(validCurrency).toHaveProperty('code');
      expect(validCurrency).toHaveProperty('name');
      expect(validCurrency).toHaveProperty('symbol');
    });
  });

  describe('Data integrity', () => {
    it('should not have duplicate currency codes', () => {
      const codes = Currencies.map((c) => c.code);
      const uniqueCodes = [...new Set(codes)];
      expect(codes.length).toBe(uniqueCodes.length);
    });

    it('should not have empty or whitespace-only values', () => {
      Currencies.forEach((currency) => {
        expect(currency.code.trim().length).toBeGreaterThan(0);
        expect(currency.name.trim().length).toBeGreaterThan(0);
        expect(currency.symbol.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have consistent data types', () => {
      Currencies.forEach((currency) => {
        expect(typeof currency.code).toBe('string');
        expect(typeof currency.name).toBe('string');
        expect(typeof currency.symbol).toBe('string');
      });
    });
  });
});
