export class CurrencyUtils {
  static formatCurrency(amount: number): string {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'KSh 0.00';
    }
    
    return `KSh ${amount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  static parseCurrency(currencyString: string): number {
    if (!currencyString) return 0;
    
    // Remove currency symbol and commas, parse as float
    const cleanString = currencyString.replace(/[KSh,\s]/g, '');
    const parsed = parseFloat(cleanString);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  static formatCompactCurrency(amount: number): string {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'KSh 0';
    }

    if (amount >= 1000000) {
      return `KSh ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `KSh ${(amount / 1000).toFixed(1)}K`;
    } else {
      return `KSh ${amount.toFixed(0)}`;
    }
  }

  static calculatePercentage(value: number, total: number): string {
    if (total === 0 || isNaN(value) || isNaN(total)) {
      return '0%';
    }
    
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1)}%`;
  }

  static calculateProfit(revenue: number, expenses: number): number {
    return (revenue || 0) - (expenses || 0);
  }

  static calculateProfitMargin(revenue: number, expenses: number): string {
    if (!revenue || revenue === 0) return '0%';
    
    const profit = this.calculateProfit(revenue, expenses);
    const margin = (profit / revenue) * 100;
    
    return `${margin.toFixed(1)}%`;
  }

  static isPositive(amount: number): boolean {
    return amount > 0;
  }

  static isNegative(amount: number): boolean {
    return amount < 0;
  }

  static getAmountColor(amount: number): string {
    if (amount > 0) return 'text-success';
    if (amount < 0) return 'text-danger';
    return 'text-muted';
  }
}
