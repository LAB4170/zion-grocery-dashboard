import { CurrencyUtils } from '../../modules/utils/CurrencyUtils';

describe('CurrencyUtils', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      const result = CurrencyUtils.formatCurrency(1234.56);
      expect(result).toBe('KSh 1,234.56');
    });

    it('should format zero correctly', () => {
      const result = CurrencyUtils.formatCurrency(0);
      expect(result).toBe('KSh 0.00');
    });

    it('should handle negative numbers', () => {
      const result = CurrencyUtils.formatCurrency(-500.25);
      expect(result).toBe('KSh -500.25');
    });

    it('should handle NaN values', () => {
      const result = CurrencyUtils.formatCurrency(NaN);
      expect(result).toBe('KSh 0.00');
    });

    it('should handle null values', () => {
      const result = CurrencyUtils.formatCurrency(null as any);
      expect(result).toBe('KSh 0.00');
    });

    it('should handle undefined values', () => {
      const result = CurrencyUtils.formatCurrency(undefined as any);
      expect(result).toBe('KSh 0.00');
    });
  });

  describe('parseCurrency', () => {
    it('should parse formatted currency strings', () => {
      const result = CurrencyUtils.parseCurrency('KSh 1,234.56');
      expect(result).toBe(1234.56);
    });

    it('should handle strings without currency symbol', () => {
      const result = CurrencyUtils.parseCurrency('1,234.56');
      expect(result).toBe(1234.56);
    });

    it('should handle empty strings', () => {
      const result = CurrencyUtils.parseCurrency('');
      expect(result).toBe(0);
    });

    it('should handle null values', () => {
      const result = CurrencyUtils.parseCurrency(null as any);
      expect(result).toBe(0);
    });

    it('should handle invalid currency strings', () => {
      const result = CurrencyUtils.parseCurrency('invalid');
      expect(result).toBe(0);
    });
  });

  describe('formatCompactCurrency', () => {
    it('should format millions correctly', () => {
      const result = CurrencyUtils.formatCompactCurrency(2500000);
      expect(result).toBe('KSh 2.5M');
    });

    it('should format thousands correctly', () => {
      const result = CurrencyUtils.formatCompactCurrency(15000);
      expect(result).toBe('KSh 15.0K');
    });

    it('should format hundreds correctly', () => {
      const result = CurrencyUtils.formatCompactCurrency(500);
      expect(result).toBe('KSh 500');
    });

    it('should handle zero', () => {
      const result = CurrencyUtils.formatCompactCurrency(0);
      expect(result).toBe('KSh 0');
    });

    it('should handle NaN', () => {
      const result = CurrencyUtils.formatCompactCurrency(NaN);
      expect(result).toBe('KSh 0');
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      const result = CurrencyUtils.calculatePercentage(25, 100);
      expect(result).toBe('25.0%');
    });

    it('should handle zero total', () => {
      const result = CurrencyUtils.calculatePercentage(25, 0);
      expect(result).toBe('0%');
    });

    it('should handle NaN values', () => {
      const result = CurrencyUtils.calculatePercentage(NaN, 100);
      expect(result).toBe('0%');
    });

    it('should round to one decimal place', () => {
      const result = CurrencyUtils.calculatePercentage(33.333, 100);
      expect(result).toBe('33.3%');
    });
  });

  describe('calculateProfit', () => {
    it('should calculate positive profit', () => {
      const result = CurrencyUtils.calculateProfit(1000, 600);
      expect(result).toBe(400);
    });

    it('should calculate negative profit (loss)', () => {
      const result = CurrencyUtils.calculateProfit(500, 800);
      expect(result).toBe(-300);
    });

    it('should handle zero values', () => {
      const result = CurrencyUtils.calculateProfit(0, 0);
      expect(result).toBe(0);
    });

    it('should handle null/undefined values', () => {
      const result = CurrencyUtils.calculateProfit(null as any, undefined as any);
      expect(result).toBe(0);
    });
  });

  describe('calculateProfitMargin', () => {
    it('should calculate profit margin correctly', () => {
      const result = CurrencyUtils.calculateProfitMargin(1000, 600);
      expect(result).toBe('40.0%');
    });

    it('should handle zero revenue', () => {
      const result = CurrencyUtils.calculateProfitMargin(0, 100);
      expect(result).toBe('0%');
    });

    it('should handle negative margin', () => {
      const result = CurrencyUtils.calculateProfitMargin(500, 800);
      expect(result).toBe('-60.0%');
    });
  });

  describe('isPositive', () => {
    it('should return true for positive numbers', () => {
      expect(CurrencyUtils.isPositive(100)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(CurrencyUtils.isPositive(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(CurrencyUtils.isPositive(-100)).toBe(false);
    });
  });

  describe('isNegative', () => {
    it('should return true for negative numbers', () => {
      expect(CurrencyUtils.isNegative(-100)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(CurrencyUtils.isNegative(0)).toBe(false);
    });

    it('should return false for positive numbers', () => {
      expect(CurrencyUtils.isNegative(100)).toBe(false);
    });
  });

  describe('getAmountColor', () => {
    it('should return success color for positive amounts', () => {
      const result = CurrencyUtils.getAmountColor(100);
      expect(result).toBe('text-success');
    });

    it('should return danger color for negative amounts', () => {
      const result = CurrencyUtils.getAmountColor(-100);
      expect(result).toBe('text-danger');
    });

    it('should return muted color for zero', () => {
      const result = CurrencyUtils.getAmountColor(0);
      expect(result).toBe('text-muted');
    });
  });
});
