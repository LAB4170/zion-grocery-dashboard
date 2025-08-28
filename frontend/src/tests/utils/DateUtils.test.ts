import { DateUtils } from '../../modules/utils/DateUtils';

describe('DateUtils', () => {
  describe('formatDate', () => {
    it('should format valid date string correctly', () => {
      const result = DateUtils.formatDate('2024-01-15T10:30:00Z');
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should handle invalid date strings', () => {
      const result = DateUtils.formatDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });

    it('should handle empty string', () => {
      const result = DateUtils.formatDate('');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatDateTime', () => {
    it('should format valid datetime string correctly', () => {
      const result = DateUtils.formatDateTime('2024-01-15T10:30:00Z');
      expect(result).toMatch(/Jan 15, 2024/);
      expect(result).toMatch(/10:30/);
    });

    it('should handle invalid datetime strings', () => {
      const result = DateUtils.formatDateTime('invalid-datetime');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('isToday', () => {
    it('should return true for today\'s date', () => {
      const today = new Date().toISOString();
      const result = DateUtils.isToday(today);
      expect(result).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = DateUtils.isToday(yesterday.toISOString());
      expect(result).toBe(false);
    });
  });

  describe('isThisWeek', () => {
    it('should return true for dates in current week', () => {
      const today = new Date();
      const result = DateUtils.isThisWeek(today.toISOString());
      expect(result).toBe(true);
    });

    it('should return false for dates outside current week', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 10);
      const result = DateUtils.isThisWeek(lastWeek.toISOString());
      expect(result).toBe(false);
    });
  });

  describe('isThisMonth', () => {
    it('should return true for dates in current month', () => {
      const today = new Date();
      const result = DateUtils.isThisMonth(today.toISOString());
      expect(result).toBe(true);
    });

    it('should return false for dates in different month', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const result = DateUtils.isThisMonth(lastMonth.toISOString());
      expect(result).toBe(false);
    });
  });

  describe('getDaysUntilDue', () => {
    it('should calculate days until future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const result = DateUtils.getDaysUntilDue(futureDate.toISOString());
      expect(result).toBe(5);
    });

    it('should return negative for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      const result = DateUtils.getDaysUntilDue(pastDate.toISOString());
      expect(result).toBe(-3);
    });
  });

  describe('addDays', () => {
    it('should add days to date correctly', () => {
      const baseDate = '2024-01-15T00:00:00Z';
      const result = DateUtils.addDays(baseDate, 5);
      const resultDate = new Date(result);
      expect(resultDate.getDate()).toBe(20);
    });

    it('should handle negative days (subtract)', () => {
      const baseDate = '2024-01-15T00:00:00Z';
      const result = DateUtils.addDays(baseDate, -5);
      const resultDate = new Date(result);
      expect(resultDate.getDate()).toBe(10);
    });
  });

  describe('getWeekRange', () => {
    it('should return correct week range', () => {
      const testDate = '2024-01-15T00:00:00Z'; // Monday
      const result = DateUtils.getWeekRange(testDate);
      
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
      expect(new Date(result.start).getDay()).toBe(0); // Sunday
      expect(new Date(result.end).getDay()).toBe(6); // Saturday
    });
  });

  describe('getMonthRange', () => {
    it('should return correct month range', () => {
      const result = DateUtils.getMonthRange(2024, 1); // January 2024
      
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
      
      const startDate = new Date(result.start);
      const endDate = new Date(result.end);
      
      expect(startDate.getDate()).toBe(1);
      expect(startDate.getMonth()).toBe(0); // January
      expect(endDate.getMonth()).toBe(0); // January
      expect(endDate.getDate()).toBe(31); // Last day of January
    });
  });
});
