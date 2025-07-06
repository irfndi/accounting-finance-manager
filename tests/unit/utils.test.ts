import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatCurrency, roundToDecimalPlaces, FINANCIAL_CONSTANTS } from '../../src/lib/index';

describe('Financial Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      const result = formatCurrency(1234.56);
      expect(typeof result).toBe('string');
      expect(result).toBe('Rp 1.235');
    });

    it('should format zero correctly', () => {
      const result = formatCurrency(0);
      expect(typeof result).toBe('string');
      expect(result).toBe('Rp 0');
    });

    it('should format negative numbers correctly', () => {
      const result = formatCurrency(-1234.56);
      expect(typeof result).toBe('string');
      expect(result).toBe('Rp -1.235');
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000);
      expect(typeof result).toBe('string');
      expect(result).toBe('Rp 1.000.000');
    });
  });

  describe('roundToDecimalPlaces', () => {
    it('should round to default decimal places', () => {
      const result = roundToDecimalPlaces(1234.56789);
      expect(result).toBe(1234.57);
    });

    it('should round to specified decimal places', () => {
      expect(roundToDecimalPlaces(1234.56789, 1)).toBe(1234.6);
      expect(roundToDecimalPlaces(1234.56789, 3)).toBe(1234.568);
      expect(roundToDecimalPlaces(1234.56789, 0)).toBe(1235);
    });

    it('should handle negative numbers', () => {
      expect(roundToDecimalPlaces(-1234.56789, 2)).toBe(-1234.57);
    });

    it('should handle zero', () => {
      expect(roundToDecimalPlaces(0, 2)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(roundToDecimalPlaces(0.999, 2)).toBe(1.00);
      expect(roundToDecimalPlaces(0.001, 2)).toBe(0.00);
    });
  });

  describe('FINANCIAL_CONSTANTS', () => {
    it('should have required constants', () => {
      expect(FINANCIAL_CONSTANTS).toBeDefined();
      expect(typeof FINANCIAL_CONSTANTS).toBe('object');
    });

    it('should have decimal places constant', () => {
      expect(FINANCIAL_CONSTANTS.DECIMAL_PLACES).toBeDefined();
      expect(typeof FINANCIAL_CONSTANTS.DECIMAL_PLACES).toBe('number');
      expect(FINANCIAL_CONSTANTS.DECIMAL_PLACES).toBeGreaterThanOrEqual(0);
    });

    it('should have currency symbols', () => {
      expect(FINANCIAL_CONSTANTS.CURRENCY_SYMBOLS).toBeDefined();
      expect(typeof FINANCIAL_CONSTANTS.CURRENCY_SYMBOLS).toBe('object');
    });

    it('should have account types', () => {
      expect(FINANCIAL_CONSTANTS.ACCOUNT_TYPES).toBeDefined();
      expect(typeof FINANCIAL_CONSTANTS.ACCOUNT_TYPES).toBe('object');
    });

    it('should have normal balances', () => {
      expect(FINANCIAL_CONSTANTS.NORMAL_BALANCES).toBeDefined();
      expect(typeof FINANCIAL_CONSTANTS.NORMAL_BALANCES).toBe('object');
    });
  });
});